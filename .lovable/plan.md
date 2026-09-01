# Clarify "Lovable Cloud" wording in the docs

The README and OPERATIONS.md mention the database and storage but don't explain
that they're the managed backend included with this Lovable project (not a
Supabase account you manage yourself). Small wording updates to avoid confusion.

## Changes

- **README.md** — in "How it's built", change the two bullets to:
  - `Products & orders: Lovable Cloud database (managed backend included with this project — no separate database account needed) with row-level security`
  - `Product photos: private storage bucket in the same Lovable Cloud backend`
  - Add one line under the secrets list noting the database/storage connection
    keys are managed automatically and never need to be set by hand.
- **OPERATIONS.md** — add a short "Where the data lives" section near the top:
  - Products, orders, and product photos live in the site's built-in cloud
    backend (managed through Lovable — nothing to set up or pay separately
    beyond the normal Lovable plan).
  - Bags live only in the Google Sheet (already covered).

No code, data, or configuration changes — documentation text only.
