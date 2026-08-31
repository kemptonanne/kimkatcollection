# Rename /check-my-bag to /view-bag

## Current state (verified)
- Admin page works: `/admin` loads and shows the "Shop admin" password gate with the password field. Unlocking needs your admin password, which is set and working.
- `/check-my-bag` is referenced in exactly 3 places: the route file, the header nav, and the home page CTA.

## Changes
1. Rename `src/routes/check-my-bag.tsx` to `src/routes/view-bag.tsx` and update `createFileRoute("/view-bag")`.
2. Update the two links:
   - `src/components/site-header.tsx` nav item (`to="/view-bag"`, label stays "View Bag")
   - `src/routes/index.tsx` CTA (`to="/view-bag"`)
3. Add a redirect route at `/check-my-bag` so the old URL (site is already published) keeps working and forwards to `/view-bag`.
4. Keep all page content, head metadata, and the number-only lookup as-is.
5. Verify: typecheck passes and `/view-bag`, `/check-my-bag` redirect, and header/home links all work in the preview.
