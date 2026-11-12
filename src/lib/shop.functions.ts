import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  price: z.number().finite().min(0),
  quantity: z.number().int().min(1).max(999),
});

const submitOrderSchema = z.object({
  checkoutKey: z.string().uuid().optional(),
  items: z.array(orderItemSchema).min(1).max(100),
  total: z.number().min(0),
  buyerName: z.string().trim().min(1).max(120),
  buyerContact: z.string().trim().min(1).max(200),
  paymentMethod: z.enum(["Venmo", "Cash App", "PayPal"]),
});

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { listProductsFromDb } = await import("./products.server");
  return listProductsFromDb();
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    // Non-UUID ids can never match a product row; treat them as "not found".
    if (!z.string().uuid().safeParse(data.id).success) return null;
    const { getProductFromDb } = await import("./products.server");
    return getProductFromDb(data.id);
  });

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { shopAdmin } = await import("./shop-db.server");
    const db = shopAdmin();
    const { createHash, randomUUID } = await import("node:crypto");
    const checkoutKey = data.checkoutKey ?? randomUUID();
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify([
          data.items.map(({ id, price, quantity }) => [id, price, quantity]),
          data.buyerName,
          data.buyerContact,
          data.paymentMethod,
        ]),
      )
      .digest("hex");

    async function findPreviousOrder() {
      const { data: existing, error } = await db
        .from("orders")
        .select("id, total, checkout_request_hash")
        .eq("checkout_key", checkoutKey)
        .maybeSingle();
      if (error) throw new Error("The order could not be checked. Please try again.");
      if (!existing) return null;
      if (existing.checkout_request_hash !== requestHash) {
        throw new Error("This checkout already has an order with different details.");
      }
      return { id: existing.id, total: Number(existing.total) };
    }

    const previous = await findPreviousOrder();
    if (previous) return previous;
    const { data: products, error: catalogError } = await db
      .from("products")
      .select("id, title, price, quantity")
      .in("id", [...new Set(data.items.map((item) => item.id))]);
    if (catalogError) throw new Error("The catalog could not be checked. Please try again.");
    const { validateOrderItems } = await import("./order-validation");
    const { items, total } = validateOrderItems(data.items, products ?? []);
    const { data: order, error } = await db
      .from("orders")
      .insert({
        items,
        total,
        checkout_key: checkoutKey,
        checkout_request_hash: requestHash,
        status: "pending payment confirmation",
        buyer_name: data.buyerName ?? null,
        buyer_contact: data.buyerContact ?? null,
        payment_method: data.paymentMethod ?? null,
      })
      .select("id")
      .single();
    if (error?.code === "23505") {
      const concurrentOrder = await findPreviousOrder();
      if (concurrentOrder) return concurrentOrder;
    }
    if (error || !order) throw new Error("The order could not be saved. Please try again.");
    return { id: order.id, total };
  });
