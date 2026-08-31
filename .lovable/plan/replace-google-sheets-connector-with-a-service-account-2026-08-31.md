# Replace Google Sheets connector with a service account

Goal: keep View Bag and the admin bags table working exactly as today, but without the Lovable connector, so the site keeps functioning on the Free plan.

## What you'll need to do (one-time, ~10 min, free)

1. In Google Cloud Console, create a free project and enable the **Google Sheets API**.
2. Create a **service account** and download its JSON key file.
3. **Share your spreadsheet** with the service account's email address (it looks like `something@project.iam.gserviceaccount.com`) with Editor access — same as sharing with a person.
4. Paste the JSON key into a secure Lovable secret form I'll open for you (name: `GOOGLE_SHEETS_SERVICE_ACCOUNT`). The value is stored encrypted and only readable by the server.

I'll give you exact click-by-click steps when we start.

## What I'll change in the code

- Rewrite `src/lib/sheets.server.ts`:
  - Remove the connector-gateway calls (`connector-gateway.lovable.dev`, `LOVABLE_API_KEY`, `GOOGLE_SHEETS_API_KEY`).
  - Add a small, edge-safe Google auth helper: sign a JWT with the service account key using built-in Web Crypto (no new npm packages — `googleapis` is too heavy/Node-only for this runtime), exchange it for an access token, and call `https://sheets.googleapis.com/v4/spreadsheets/...` directly with `fetch`.
  - Cache the access token in memory until it expires (tokens last ~1 hour) to stay fast and quota-friendly.
- Keep every exported function signature identical (`getBags`, `getBagByNumber`, `getBagItems`, `updateBagCell`, etc.) so `src/lib/bags.functions.ts`, the View Bag page, and the admin bags table need **no changes**.
- All existing protections stay: read-only formula columns, only Payments Received / Due Date / Status writable, Customers tab never read by the app.
- Optionally remove the linked Google Sheets connector afterward (your call — I'll leave the connector untouched unless you ask).

## Verification

- Look up bag #1 on /view-bag and confirm the real row (Kimberly Kempton, $24.00, Open) loads.
- Edit Payments Received / Due Date / Status in admin and confirm the write lands in the sheet.
- Confirm a wrong bag number still shows the friendly not-found message.

## Fallback

If anything goes wrong during the switch, the connector is still linked and we can revert `sheets.server.ts` to the gateway version in one step.
