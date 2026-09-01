# Kim Kat Collection

A mobile-first storefront for Kim Kat Collection — jewelry and collectibles sold
through TikTok live sales. Customers browse products, check out manually via
Venmo/Cash App/PayPal links, and look up their live-sale "bag" by number.

## How it's built

- **Framework:** TanStack Start (React 19, Vite) with file-based routing in `src/routes/`
- **Products & orders:** Lovable Cloud database with row-level security
- **Product photos:** Lovable Cloud storage (private bucket)
- **Cart:** browser `localStorage` (no account needed)
- **Live-sale bags:** a Google Apps Script Web App API that reads/writes the
  owner's Google Sheet (Bags + Bag Items tabs). The Customers tab is never read.
- **Admin:** password gate at `/admin` (session cookie, no user accounts)

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Shop / product listing |
| `/product/$id` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Manual-payment checkout (payment links only) |
| `/view-bag` | Public "View my bag" lookup by bag number |
| `/admin` | Password-protected Products / Bags / Orders management |

## Important pieces

| File | What it does |
| --- | --- |
| `src/lib/sheets.server.ts` | All reads/writes to the bag spreadsheet via the Apps Script API |
| `src/lib/bags.functions.ts` | Server functions for bag lookup and admin bag edits |
| `src/lib/products.server.ts` | Product/order database access |
| `src/lib/shop.functions.ts` | Server functions for products and checkout orders |
| `src/lib/admin.functions.ts` | Admin login/session and admin-only operations |
| `src/lib/cart.ts` | localStorage cart helpers |

## Environment secrets (set in Lovable, never in code)

- `BAG_API_URL` — the Apps Script `/exec` URL for the bag spreadsheet API
- `BAG_API_TOKEN` — shared secret required by that API
- `ADMIN_PASSWORD` — unlocks `/admin`
- `SESSION_SECRET` — signs the admin session cookie

## Spreadsheet rules

- Only **Payments Received**, **Due Date**, and **Status** are writable on Bags.
- All other columns are spreadsheet formulas and must stay read-only.
- Bag data lives **only** in the Google Sheet — no database tables for bags.

## Development

```sh
npm install
npm run dev
```

See `OPERATIONS.md` for how to run the shop day-to-day (products, bags,
payments, admin).
