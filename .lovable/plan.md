# Move products, orders & photos to your own Supabase project

Goal: the shop's products, orders, and product photos live in a **free Supabase
project you own**, so the store keeps working after your Pro plan ends — even
if Lovable Cloud pauses. Bags already live in your Google Sheet, so nothing
changes there.

## What you'll need to do (one-time, ~10 min, free)

1. Create a free account + project at supabase.com (Free tier is fine).
2. From your project's **Settings → API**, copy:
   - Project URL
   - `anon public` key
   - `service_role` key (keep private)
3. Paste them into a secure form I'll open (stored encrypted as
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` —
   server-side copies too).
4. Run one SQL script I give you in your Supabase SQL editor — it creates the
   `products` and `orders` tables, security policies, and the `product-photos`
   storage bucket. (I'll match the exact current schema.)

## What I'll change

1. **Database client** — point the app at your Supabase URL/keys instead of the
   managed backend. The integration files stay structurally the same; only the
   connection target changes.
2. **Products & orders** — same tables, same security rules (public can read
   products; orders are server-only; nothing else readable). Verified against
   the current schema first.
3. **Product photos** — create a private `product-photos` bucket in your
   project and update the upload/read code paths so admin photo uploads and
   storefront images work identically.
4. **Data migration** — export your current products (and any orders) from the
   managed backend and give you a ready-to-run SQL insert script (or a small
   one-time import script) so nothing is lost. Product photos get re-uploaded
   through the admin UI or copied over with a script.
5. **Cleanup** — remove Lovable Cloud dependencies from code paths that no
   longer need them. Docs (README/OPERATIONS) updated to say the data lives in
   your own Supabase project.

## What stays exactly the same

- Shop, product detail, cart, checkout, View Bag, admin UI, styling — zero
  visual or workflow changes.
- Bags/Bag Items still read/write your Google Sheet via the Apps Script API.
- Admin password gate unchanged.

## Things to know

- Once data lives in your own Supabase, I can no longer run database changes
  for you automatically — schema changes become "run this SQL in your
  dashboard" steps (I'll always provide the exact script).
- Supabase's free tier is generous for a shop this size; the one limit to know
  is projects pause after ~7 days of inactivity (a single visit wakes them).
- Keep `service_role` key secret — it bypasses all security rules.

## Verification

- Shop lists the migrated products with photos.
- Add-to-cart → checkout creates an order row in your project.
- Admin can add a product with a photo and edit bags as before.
