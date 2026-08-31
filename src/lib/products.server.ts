import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 5; // 5 years
const BUCKET = "product-photos";

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  quantity: number;
  created_at: string;
};

export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type Row = {
  id: string;
  title: string;
  description: string | null;
  price: number | string;
  image_urls: string[] | null;
  quantity: number;
  created_at: string;
};

export function toProduct(row: Row): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    price: Number(row.price),
    image_urls: row.image_urls ?? [],
    quantity: row.quantity,
    created_at: row.created_at,
  };
}

export async function listProductsFromDb(): Promise<Product[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select("id, title, description, price, image_urls, quantity, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toProduct(row as Row));
}

export async function getProductFromDb(id: string): Promise<Product | null> {
  const { data, error } = await publicClient()
    .from("products")
    .select("id, title, description, price, image_urls, quantity, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProduct(data as Row) : null;
}

/** Uploads a base64 data URL to storage and returns a long-lived signed URL. */
export async function uploadProductPhoto(dataUrl: string, fileName: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Unsupported image format.");
  const contentType = match[1]!;
  const bytes = Buffer.from(match[2]!, "base64");
  const path = `${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw new Error(error.message);

  const { data, error: signError } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !data) throw new Error(signError?.message ?? "Could not create image URL.");
  return data.signedUrl;
}
