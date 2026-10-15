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

Checkout records an order awaiting manual payment confirmation. It does not collect card details, verify payments, reserve stock, or provide shipping/tax calculation. The owner must confirm availability and any fulfillment charges before requesting final payment.

## Bag tracker

Deploy `apps-script/BagTrackerAPI.gs` in an Apps Script project bound to the owner's spreadsheet. The spreadsheet needs `Bags` and `Claims` tabs using the column layout in that file. Set `SECRET_TOKEN` in Script Properties; configure the matching token and Web App `/exec` URL in the app's server environment. After script changes, publish a new Apps Script deployment version separately from the website.

Bag-number lookup is public and is not proof of customer identity. It excludes names, handles, payments received, and row identifiers, but still displays claimed items and balances. Do not publish screenshots containing real customer bag information.

## Vercel

Use the connected Git repository and the detected TanStack Start framework. The build command is `bun run build`. Configure all seven `.env.example` variables separately for each environment that needs them.

The current business configuration is Production-only. A passing Preview build can still fail at runtime without its own configuration. Use separate test services for previews where possible; do not automatically copy production credentials to every PR. Never disable Vercel's vulnerable-package check to make a build pass.

Use a strong admin password and a random session secret. Admin cookies are Secure and HttpOnly. Local browsers must support Secure cookies on localhost, or run local HTTPS for sign-in testing. The current shared-password admin has no per-user audit trail or application-level login rate limit.
