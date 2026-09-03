# Plan: Cohesive "Soft Blush & Berry" palette

## Goal
Replace the remaining rainbow pastel accents (green Cash App button, yellow PayPal button, assorted mint/butter/sky highlights) with one cohesive palette, and make sure the new theme actually shows up in your preview.

## Chosen palette — Soft Blush & Berry
- Background wash: pale blush `#fae9ec`
- Cards / chips: rose `#eccdd2`
- Primary buttons & brand: deep berry `#8e3b4e`
- Text: dark berry-cocoa `#58323c`

## Changes
1. **Color tokens (`src/styles.css`)** — retune `--cream`, `--blush`, `--lilac`, `--sky`, `--brand`, `--ink`, `--inksoft`, `--surface` to the Soft Blush & Berry values; remove the green (`--mint`) and yellow (`--butter`) tones and the leaf-green accent, replacing them with blush/berry shades so no green or yellow remains anywhere.
2. **Payment buttons** (`src/routes/view-bag.tsx`, `src/components/site-footer.tsx`, `src/routes/checkout.tsx`) — Cash App and PayPal lose their green/yellow; all payment links use the same rose/berry styling, differing only by label.
3. **Sweep other accents** — update the handful of `bg-mint`/`bg-butter`/`bg-sky` highlights in `index.tsx`, `cart.tsx`, `checkout.tsx`, `product.$id.tsx`, and the admin components to blush/berry equivalents.
4. **Backdrop wash** — the warm overlay already softening the watercolor background stays, retinted to the new blush background color.
5. **Verify** — typecheck + mobile screenshots (home, view bag, checkout, cart, admin) to confirm one cohesive palette with no green/yellow left.

## Preview not updating
The code changes are live in the sandbox, but your open preview tab has the old background image cached. Fix on your end: hard-refresh the preview (or close and reopen the preview tab). Nothing in the code is blocking the update — I'll note this again when the palette work is done.

## Notes
- No layout, text, or functionality changes — colors only.
- Tap targets and mobile-first behavior are untouched.
