# Kim Kat's Corner

Build a simple e-commerce website called "Kim Kat Collection" for a small jewelry and collectibles shop. Use Supabase for the shop's backend (products, cart, orders) and connect to the Google Sheets connector for a separate live-sale bag tracking system (details below). The entire site must be mobile-first and fully mobile-friendly — most traffic will come from TikTok, so every page, button, and interaction should work cleanly on a phone before worrying about desktop.

=== PAGES ===

1. HOME/SHOP PAGE — grid of product listings (image, title, price, short description), responsive grid that collapses to 1-2 columns on mobile. Click a listing to view a full detail page with larger image(s), full description, price, and a large, thumb-reachable "Add to Cart" button.

2. CART PAGE — shows items added, editable quantities (large tap targets for +/-), running total. "Checkout" button, full-width and easy to tap on mobile.

3. CHECKOUT PAGE — shows order summary and total. Displays three payment options as large, stacked buttons/links (not tiny inline links) so they're easy to tap on mobile:

   - Venmo: https://venmo.com/Kim-Kempton

   - Cash App: https://cash.app/$KimKat0707

   - PayPal: https://www.paypal.com/paypalme/kimberlykempton77

   Include a note: "Please send payment via one of the links above, then click Submit Order below." A "Submit Order" button saves the order (items, total, buyer info if available) to Supabase as "pending payment confirmation."

4. CHECK MY BAG PAGE (public, no login):

   - Step 1: Show a dropdown or search box listing Bag Numbers (pulled live from the connected Google Sheet's "Bags" tab), styled for easy mobile tapping/scrolling.

   - Step 2: Once a bag number is selected, slide up a bottom sheet (not a centered modal — mobile-friendly, thumb-reachable) displaying only the Customer Name for that bag, with two large tappable buttons: "Confirm" and "Go Back."

   - "Go Back" dismisses the sheet and returns to the bag number selector (step 1).

   - "Confirm" opens the read-only bag detail card: TikTok Handle, Customer Name, Bag Total, Payments Received, Remaining Balance, Due Date, Status.

   - Clean, simple styling matching the rest of the site. Large tap targets throughout, minimal typing required.

5. ADMIN PAGE (password-protected, single shared password stored securely, not public signup):

   - Add/edit/delete product listings (title, description, price, upload 1-3 photos, quantity in stock)

   - View submitted orders from Supabase

   - "Bags" tab: table view of all rows from the connected Google Sheet's "Bags" tab (bag #, TikTok handle, customer name, bag total, payments received, remaining balance, due date, status). Only Payments Received, Due Date, and Status are editable inline here and save back to the Google Sheet — everything else is read-only/display-only. Filterable by Status. On mobile, this table should scroll horizontally or stack into cards rather than break the layout. Clicking into a bag opens a detail view showing its itemized list from the "Bag Items" tab (item description, price, date added), with a quick "Add Item" input (description + price) to add a new row live during a TikTok Live, plus the ability to edit/delete an item row for mistakes. This admin page will likely be used on a phone during a live, so prioritize speed and large tap targets for the Add Item flow specifically.

=== NAVIGATION ===

Add these links to the main site nav, using a mobile-friendly hamburger/collapsible menu on small screens:

- "Sign Up" → opens https://forms.gle/D56V8iAxyrtbjczL7 in a new tab (this is an external Google Form for new customer signup — do NOT build a signup form on this site)

- "Check My Bag" → the page described above

- Links (Venmo/Cash App/PayPal) also visible somewhere accessible, e.g. a footer or a dedicated "Payment Options" section

=== SUPABASE DATA MODELS ===

- products: id, title, description, price, image_urls, quantity, created_at

- orders: id, items (jsonb), total, status, created_at

Do NOT create Supabase tables for bags, bag items, or customers — that data lives entirely in the connected Google Sheet, not the app's database.

=== GOOGLE SHEETS CONNECTOR ===

Connect to the Google Sheet I select. It has three tabs:

"Bags" — Bag # | TikTok Handle | Customer Name | Bag Total | Payments Received | Remaining Balance | Due Date | Status

- Bag #, TikTok Handle, Customer Name, Bag Total, and Remaining Balance are calculated by formulas already in the sheet — NEVER write to these columns from the app, read-only.

- Payments Received, Due Date, and Status are the only columns the app should ever write to.

- Status is one of: Open, Active, Hold, Closed.

"Bag Items" — Bag # | Item Description | Price | Date Added

- The app can both read and add new rows here.

"Customers" — Timestamp | First Name | Last Name | TikTok Username | Shipping Address | Birthday

- Read-only from the app. Populated by the external Google Form, not this website.

=== DESIGN ===

Mobile-first, clean, minimal, elegant aesthetic fitting a jewelry and collectibles brand. Every page must be fully usable and good-looking on a phone screen (test at ~375px width) before scaling up to tablet/desktop. Large tap targets (minimum 44px), no hover-dependent interactions, no horizontal scrolling except where explicitly noted (admin table). No login required for browsing/shopping/Check My Bag — only the admin page needs a password.

=== DO NOT ===

- Do not integrate Stripe, Shopify, or any real payment gateway — payment is handled manually via the Venmo/Cash App/PayPal links shown at checkout.

- Do not build a customer signup form on the website — that's handled entirely by the external Google Form.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kimkatcollection.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4e05d623-9f4f-408e-a4a2-17befc57762e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
