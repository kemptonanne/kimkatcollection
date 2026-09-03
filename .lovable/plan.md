# Site polish pass — honest-review follow-ups

Five targeted improvements from a full visual review. No layout or palette changes; the current cozy design stays as-is.

## 1. Shrink the background image (biggest win)
`src/assets/cozy-backdrop.jpg` is 1.5 MB — heavy for mobile visitors on cellular, who are most of the audience.
- Convert to WebP at the same dimensions, quality tuned to land under ~250 KB.
- Update the import in `src/routes/__root.tsx`. Delete the old JPG.

## 2. Improve text contrast
Muted cocoa-on-blush body text is borderline for readability (sunlight, older eyes).
- Slightly darken the `--muted-foreground` token in `src/styles.css` only — no component changes, no palette shift.

## 3. Warmer empty states
The empty cart is a bare white box ("Your cart is empty." + button).
- Add the small motif row and friendlier copy to the empty cart, matching the charm of the home empty-shop card.
- Same treatment for the "bag not found" state on View My Bag if it lacks one.

## 4. Friendlier bag-lookup failures
When the sheet API is slow or errors, customers currently hit a dead-end error.
- On View My Bag: show a friendly message ("Having trouble finding your bag — try again in a moment, or message us on TikTok") with a retry button instead of a raw error.

## 5. Content note (not code)
The shop shows "0 items" to every visitor. Listing even a few photographed pieces will change the first impression more than any design tweak.

## Technical notes
- Files touched: `src/assets/cozy-backdrop.webp` (new), `src/routes/__root.tsx`, `src/styles.css`, `src/routes/cart.tsx`, `src/routes/view-bag.tsx`.
- Verify with mobile (390px) screenshots of home, cart, and view-bag, plus a production build.
