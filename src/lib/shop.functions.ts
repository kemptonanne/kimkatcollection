import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  price: z.number().finite().min(0),
  quantity: z.number().int().min(1).max(999),
});

const submitOrderSchema = z.object({
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
        status: "pending payment confirmation",
        buyer_name: data.buyerName ?? null,
        buyer_contact: data.buyerContact ?? null,
        payment_method: data.paymentMethod ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: order.id as string, total };
  });
