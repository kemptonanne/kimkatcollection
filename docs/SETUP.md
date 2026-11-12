# Setup

## Run locally

1. Install Bun, then run `bun install --frozen-lockfile`.
2. Copy `.env.example` to `.env.local` and provide your own service configuration.
3. Run `bun run dev`. Run `bun run typecheck`, `bun run lint`, `bun run test`, and `bun run build` before release.

The app requires existing services; installing dependencies alone does not create a database or spreadsheet. No customer records or credentials are included in this repository.

## Shop database

The server expects these Supabase tables:

| Table      | Columns                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `products` | `id` (UUID), `title`, `description`, `price` (numeric), `quantity` (integer), `image_urls` (text array), `created_at` (timestamp)         |
| `orders`   | `id` (UUID), `items` (JSON array), `total` (numeric), `status`, `buyer_name`, `buyer_contact`, `payment_method`, `created_at` (timestamp) |

IDs and timestamps need database defaults. Enable row-level security. The anonymous key should permit product reads only; order reads and all writes use the server-only service role. Audit existing policies in Supabase before release. Keep the `product-photos` storage bucket private; the server uploads photos and creates signed image URLs.

Before deploying the checkout and admin login changes, apply `supabase/external/20261112224150_harden_checkout_and_admin_login.sql` to the external shop database. The SQL adds checkout retry keys and a server-only login attempt counter. On Vercel, the app allows five sign-in attempts per client IP in a 15-minute window. Local runs share one attempt counter.

Checkout records an order awaiting manual payment confirmation. It does not collect card details, verify payments, reserve stock, or provide shipping/tax calculation. The owner must confirm availability and any fulfillment charges before requesting final payment.

## Bag tracker

1. Enable the Google Sheets API in the Google Cloud project that owns the service account.
2. Share the spreadsheet with the service account's email address as a Viewer.
3. Set `GOOGLE_SHEETS_SPREADSHEET_ID` to the ID in the spreadsheet URL and `GOOGLE_SHEETS_CREDENTIALS` to the service account key JSON in the server environment.
4. Keep the existing tab names and column order. Row 1 contains the headers.

| Range         | Columns in order                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `Bags!A2:H`   | Bag number, TikTok handle, customer name, bag total, payments received, balance due, due date, status |
| `Claims!A2:G` | Bag number, company name, item, price, quantity, total, date claimed                                  |

The website reads formatted values and caches them for 30 seconds. The team edits bags and claims directly in Sheets.

Bag-number lookup is public and is not proof of customer identity. It excludes names, handles, payments received, and row identifiers, but still displays claimed items and balances. Do not publish screenshots containing real customer bag information.

## Vercel

Use the connected Git repository and the detected TanStack Start framework. The build command is `bun run build`. Configure all seven `.env.example` variables separately for each environment that needs them.

The current business configuration is Production-only. A passing Preview build can still fail at runtime without its own configuration. Use separate test services for previews where possible; do not automatically copy production credentials to every PR. Never disable Vercel's vulnerable-package check to make a build pass.

Use a strong admin password and a random session secret. Admin cookies are Secure and HttpOnly. Local browsers must support Secure cookies on localhost, or run local HTTPS for sign-in testing. The shared-password admin has no per-user audit trail.
