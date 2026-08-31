import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
});

const submitOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  total: z.number().min(0),
  buyerName: z.string().max(120).optional(),
  buyerContact: z.string().max(200).optional(),
  paymentMethod: z.string().max(40).optional(),
});

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { listProductsFromDb } = await import("./products.server");
  return listProductsFromDb();
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { getProductFromDb } = await import("./products.server");
    return getProductFromDb(data.id);
  });

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        items: data.items,
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
