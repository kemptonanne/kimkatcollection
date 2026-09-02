# Speed up "View Bag" lookups

## Why it's slow

Looking up one bag currently makes **two round trips to the Google Apps Script web app**, one after the other:

1. `getBags` — downloads **every** bag row from the sheet, then finds yours in code.
2. `getBagItems` — downloads that bag's claim rows.

Apps Script web apps are slow to answer (often 1-3 seconds each, more on a cold start), so two sequential calls plus a full-sheet download is the bulk of the wait. The admin bags table is worse: it calls `getBagItems` once per bag.

(Confirmed by reading `src/lib/sheets.server.ts` and `src/lib/bags.functions.ts`. Exact per-call timing is not yet measured — step 1 measures it.)

## Plan

1. **Measure first.** Add temporary server-side timing around each Apps Script call so we know the real split between "Apps Script is slow" and "we make too many calls".

2. **One call instead of two.** Add a `getBag` action to your Apps Script that takes a bag number and returns the bag row *and* its claims in a single response. Update the site's lookup to use it, keeping the old two-call path as a fallback if the script hasn't been redeployed yet. You'd paste the updated script into the Apps Script editor and deploy a new version.

3. **Short-lived server cache.** Cache bag/claim responses in server memory for ~30 seconds. Repeat lookups and page refreshes become instant; edits made in the admin clear the cache immediately so nothing looks stale.

4. **Admin table: stop the per-bag loop.** Add a `getAllItems` action to the script that returns the whole Claims tab in one response, instead of one request per bag. Big win when there are many bags.

5. **Make the wait feel shorter.** Show a skeleton/progress state on `/view-bag` while the lookup runs, and remember the last looked-up bag number so returning customers get results immediately from cache.

## Technical notes

- `src/lib/sheets.server.ts`: new `readBagWithItems(bagNumber)` using the `getBag` action; module-level `Map` cache with TTL and explicit invalidation from the write helpers (`writeBagEditableFields`, `appendBagItem`, `writeBagItem`, `deleteBagItemRow`).
- `src/lib/bags.functions.ts`: `lookupBag` calls the single combined read; `adminListBags` uses the bulk claims read.
- `src/routes/view-bag.tsx`: loading skeleton for the result card.
- No spreadsheet columns change; writes stay limited to Payments Received, Due Date, Status.
- Requires redeploying the Apps Script web app (new version). If the `/exec` URL changes, `BAG_API_URL` gets updated.

## What you'd do

Paste the updated Apps Script and deploy a new version. Everything else is on the site side.
