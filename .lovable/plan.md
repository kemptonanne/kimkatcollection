# Cleanup: single bag route + README refresh

## Why two bag routes exist
- `src/routes/view-bag.tsx` is the real "View my bag" page.
- `src/routes/check-my-bag.tsx` is a leftover redirect shim from the earlier rename — it just sends `/check-my-bag` visitors to `/view-bag`. No links in the app or docs point to it anymore.

## Changes

1. **Delete `src/routes/check-my-bag.tsx`** — `/view-bag` becomes the only bag route. (Anyone with an old bookmarked `/check-my-bag` link would see the 404 page; all in-app and shared links use `/view-bag`.)
2. **Regenerate route tree** — happens automatically once the file is removed (`src/routeTree.gen.ts` is auto-generated).
3. **Refresh `README.md`** — already mostly accurate; tidy it up:
   - Confirm route table lists only the real routes.
   - Tighten wording so it's concise and current (Apps Script bag API, own-Supabase products/orders, secrets list).
4. **`OPERATIONS.md`** — already only references `/view-bag`; no changes needed.

## Verification
- Preview loads `/view-bag` and the bag-number lookup still works.
- Old `/check-my-bag` path shows the not-found page.
