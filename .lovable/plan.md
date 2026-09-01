# Point products, orders & photos at your own Supabase project

Your existing tables match the app exactly, so no schema changes — we just
re-point the app's three database touchpoints to your project.

## What you'll do (one-time, ~5 min)

1. In your Supabase project, go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this one private)
2. Paste them into the secure form I'll open. They'll be stored encrypted as
   `SHOP_SUPABASE_URL`, `SHOP_SUPABASE_ANON_KEY`, `SHOP_SUPABASE_SERVICE_ROLE_KEY`.
3. Run one short SQL script I'll give you (SQL editor → paste → Run). It only
   adds the access rules the app needs:
   - anyone can **view** products (storefront is public)
   - only the app (service key) can add/edit/delete products, create orders,
     and read/upload photos

## What I'll change in code (3 small files)

- New server-only helper that builds the database client from the
  `SHOP_SUPABASE_*` variables (your project), replacing the managed-backend one.
- `src/lib/products.server.ts` — product reads + photo upload/signed URLs.
- `src/lib/shop.functions.ts` — order creation at checkout.
- `src/lib/admin.functions.ts` — admin product add/edit/delete + order list.
- README/OPERATIONS updated: data lives in your own Supabase project.

## What does NOT change

- Shop, product, cart, checkout, View Bag, admin UI, styling — identical.
- Bags stay on your Google Sheet via the Apps Script API.
- Admin password gate unchanged.
- The managed backend stays connected (untouched) as a fallback — only these
  three code paths move. Nothing is deleted.

## Verification

- Shop shows products from **your** project (I'll add a temporary test product
  in yours to prove the switch, then remove it).
- Checkout creates an order row in your project.
- Admin adds a product with a photo; photo loads on the storefront.
