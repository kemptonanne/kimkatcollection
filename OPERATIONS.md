# Operating Kim Kat Collection

Day-to-day guide for running the shop. No code changes needed for any of this.

## Products

Manage at `/admin` → **Products** tab:

- Add, edit, or remove products (name, description, price, photo, stock).
- Product photos upload to private storage automatically.
- Removing a product hides it from the shop immediately.

## Orders

Checkout creates an order record (no payment is processed on the site — the
customer pays you directly via your payment links). Review them at
`/admin` → **Orders** tab.

## Live-sale bags

Bag data lives in the connected Google Sheet (**Bags** and **Bag Items** tabs).
The site reads it live — edits in the sheet show up on `/view-bag` and in the
admin within moments.

- Customers look up their bag by **number** on `/view-bag`.
- In `/admin` → **Bags**, you can edit only **Payments Received**, **Due Date**,
  and **Status**. Every other column is a spreadsheet formula — edit those in
  the sheet itself, not the app.
- Add/remove bag items from the admin Bags tab or directly in the sheet.
- The **Customers** tab is private; the app never reads it.

## Customer signups

Customers sign up through the external Google Form linked in the site menu.
There is no signup form inside the app by design.

## Payments

Checkout shows your Venmo / Cash App / PayPal links. Payment happens outside
the site; you confirm receipt manually (and record it in the bag's
**Payments Received** column for live-sale bags).

## Admin access

- `/admin` is protected by the admin password (stored as the `ADMIN_PASSWORD`
  secret in Lovable — it is never visible in the code).
- The **Lock** button on the admin page logs you out and re-locks the gate.
- To change the password, update the `ADMIN_PASSWORD` secret in Lovable's
  project settings.

## If bags stop loading

`/view-bag` depends on the Apps Script Web App. If it stops working, check:

1. The Apps Script deployment is still active and the URL in the `BAG_API_URL`
   secret matches the current `/exec` URL (redeploys can change it).
2. The `BAG_API_TOKEN` secret still matches the token inside the script.
3. The script still has edit access to the spreadsheet.
