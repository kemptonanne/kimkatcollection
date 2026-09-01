/**
 * Server-only database client for the shop's own Supabase project
 * (products, orders, and the product-photos storage bucket).
 *
 * Env vars (set as Lovable secrets):
 *   SHOP_SUPABASE_URL              — your project's API URL
 *   SHOP_SUPABASE_ANON_KEY         — your project's anon public key
 *   SHOP_SUPABASE_SERVICE_ROLE_KEY — your project's service role key (private)
 *
 * `shopPublic()` is used for public storefront reads (products list/detail);
 * RLS applies as anon. `shopAdmin()` uses the service role key and bypasses
 * RLS — only call it after verifying the admin session.
 */

import { createClient } from "@supabase/supabase-js";

// Minimal schema for the shop's own Supabase project. Table shapes here mirror
// the user's existing products/orders tables.
type ProductRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
  quantity: number;
  created_at: string;
};
type ProductInsert = Omit<ProductRow, "id" | "created_at"> & { id?: string; created_at?: string };
type ProductUpdate = Partial<ProductInsert>;

type OrderRow = {
  id: string;
  items: unknown;
  total: number;
  status: string;
  buyer_name: string | null;
  buyer_contact: string | null;
  payment_method: string | null;
  created_at: string;
};
type OrderInsert = Omit<OrderRow, "id" | "created_at"> & { id?: string; created_at?: string };
type OrderUpdate = Partial<OrderInsert>;

type ShopDatabase = {
  public: {
    Tables: {
      products: { Row: ProductRow; Insert: ProductInsert; Update: ProductUpdate; Relationships: [] };
      orders: { Row: OrderRow; Insert: OrderInsert; Update: OrderUpdate; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type LooseClient = ReturnType<typeof createClient<ShopDatabase>>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. The shop database is not configured.`);
  return value;
}

/** Opaque sb_ keys aren't JWTs; send only apikey, not an Authorization bearer. */
function shopFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export function shopPublic(): LooseClient {
  const key = requireEnv("SHOP_SUPABASE_ANON_KEY");
  return createClient(requireEnv("SHOP_SUPABASE_URL"), key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: shopFetch(key) },
  });
}

export function shopAdmin(): LooseClient {
  const key = requireEnv("SHOP_SUPABASE_SERVICE_ROLE_KEY");
  return createClient(requireEnv("SHOP_SUPABASE_URL"), key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: { fetch: shopFetch(key) },
  });
}
