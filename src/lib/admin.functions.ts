import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(4000).default(""),
  price: z.number().min(0),
  quantity: z.number().int().min(0),
  imageUrls: z.array(z.string()).max(6).default([]),
});

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { isAdminUnlocked } = await import("./admin-session.server");
  return { unlocked: await isAdminUnlocked() };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ password: z.string().max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { passwordMatches, unlockAdmin } = await import("./admin-session.server");
    if (!passwordMatches(data.password)) return { ok: false as const };
    await unlockAdmin();
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { lockAdmin } = await import("./admin-session.server");
  await lockAdmin();
  return { ok: true as const };
});

export const adminListProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./admin-session.server");
  await requireAdmin();
  const { listProductsFromDb } = await import("./products.server");
  return listProductsFromDb();
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    productSchema.extend({ id: z.string().uuid().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { shopAdmin } = await import("./shop-db.server");
    const supabaseAdmin = shopAdmin();
    const payload = {
      title: data.title,
      description: data.description,
      price: data.price,
      quantity: data.quantity,
      image_urls: data.imageUrls,
    };
    const query = data.id
      ? supabaseAdmin.from("products").update(payload).eq("id", data.id)
      : supabaseAdmin.from("products").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { shopAdmin } = await import("./shop-db.server");
    const supabaseAdmin = shopAdmin();
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminUploadPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ dataUrl: z.string().min(10), fileName: z.string().max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { uploadProductPhoto } = await import("./products.server");
    return { url: await uploadProductPhoto(data.dataUrl, data.fileName) };
  });

export const adminListOrders = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdmin } = await import("./admin-session.server");
  await requireAdmin();
  const { shopAdmin } = await import("./shop-db.server");
    const supabaseAdmin = shopAdmin();
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, items, total, status, buyer_name, buyer_contact, payment_method, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: z.string().max(60) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin-session.server");
    await requireAdmin();
    const { shopAdmin } = await import("./shop-db.server");
    const supabaseAdmin = shopAdmin();
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
