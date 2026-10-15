# Verification status

Checked October 15, 2026. This records evidence and remaining work, not a claim that every business workflow has passed.

## Confirmed

- TanStack Start upgraded to the patched `1.168.60` release; related router packages aligned and Bun lockfile regenerated.
- Vercel built that dependency update successfully on the portfolio PR.
- The existing Production deployment returned HTTP 200 for the storefront, empty cart, empty checkout, bag-lookup entry page, and admin route. Invalid product IDs returned HTTP 404.
- The live storefront returned an empty catalog. No live product purchase was attempted.
- Local HTTP integration checks against isolated test services passed: successful bag lookup, missing bag, exclusion of private customer fields, order insertion with the server-calculated total, rejection of altered prices and excessive quantities, denial of unauthenticated order access, and rejection of an incorrect admin password.
- Regression tests cover catalog titles, exact currency totals, altered prices, duplicate cart lines exceeding inventory, removed products, and invalid quantities.
- An automated pattern review covered patches from all 267 commits on the business branch. Flagged historical `.env` entries contained public Supabase configuration; private-key markers and secret-key prefixes appeared in credential-handling code. These checks did not identify an embedded private credential. This is not a comprehensive security audit.

## Remaining before a full live release sign-off

- Preview runtime configuration: all seven required service variables are currently Production-only. The preview homepage returns HTTP 500 because its shop key is absent.
- Browser interaction and desktop/mobile visual checks remain unverified. Local browser execution was blocked by host permissions; creating a protected-deployment browser-access link was rejected by automatic approval review.
- Verify admin sign-in, product creation/photo upload/edit, and order management against the actual services using a clearly identified test record.
- Verify a designated test bag and its spreadsheet writes. Do not use a customer's bag for write tests.
- Complete one approved test order and confirm it appears in admin. Do not send a payment during a software check.
- Inspect actual Supabase table/storage policies. Repository source alone cannot establish deployed policy correctness.
- Review customer disclosure through public bag-number lookup. Claim replacement still deletes then adds; it is not atomic and duplicate claims need care.
- Add public-safe screenshots after browser verification, merge the reviewed PR, and explicitly approve repository visibility/publication.

Production behavior is still determined by `main` until the portfolio PR is merged. Code fixes on this PR do not update the business deployment by themselves.
