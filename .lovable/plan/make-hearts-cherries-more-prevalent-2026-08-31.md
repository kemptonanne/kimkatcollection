# Make hearts & cherries more prevalent

## Goal
Turn the existing heart-and-cherry accents into a playful, bold background motif that runs across the customer-facing pages without hurting readability or mobile usability.

## What will change

1. **Site-wide background pattern**
   - Add a subtle repeating hearts-and-cherries SVG pattern behind the main page content on the customer-facing routes.
   - Keep it light enough that text and cards remain easy to read (low opacity, small-to-medium motif size).
   - Apply it on `/`, `/product/$id`, `/cart`, `/checkout`, and `/check-my-bag`.
   - Leave `/admin` untouched so the admin UI stays clean and functional.

2. **Homepage hero boost**
   - Increase the size/weight of the existing corner heart and cherry graphics in the hero.
   - Add one more cherry/heart accent near the CTA so the hero feels centered on the theme.

3. **Card accents**
   - Add a tiny heart or cherry watermark to empty-state cards and the "Check my bag" CTA card so the motif touches key interactive surfaces.

4. **Color emphasis**
   - Slightly bump the cherry-red brand presence on headings/CTAs where it already exists, keeping the overall light pink background.
   - No new colors; reuse existing `--brand` and `--accent` tokens.

## What will not change
- No new pages, routes, or server functions.
- No changes to cart, checkout, bag lookup, or admin logic.
- Tap targets stay at least 44px and mobile ~375px layout remains the priority.
- The existing Fraunces + Nunito typography and rounded card radius stay the same.

## Implementation notes
- Pattern will be implemented as a CSS background using inline SVG data-URI or a small reusable CSS class in `src/styles.css`.
- Components will opt into the pattern via a wrapper class; no hardcoded colors will be added.
- Verify contrast and readability on a real mobile viewport after the change.