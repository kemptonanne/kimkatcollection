# Cozy "Cherries, Hearts & Bows" refresh

Take the uploaded watercolor pattern as the guiding vibe: soft pink washes, glossy cherries, gingham and polka-dot hearts, ribbon bows, little blossoms. Warm the whole site up so it feels cozy and handmade instead of clean and modern.

## 1. Balanced icons (mom's note)

Right now the logo has a heart only on the left, which looks lopsided.

- Center the logo lockup with a matching motif on both sides: a small cherry on the left and a bow on the right (or a heart mirrored on each side), same size and weight.
- Apply the same rule everywhere a heading or label has a single icon: either give it a mirrored partner or remove the icon entirely. No one-sided icons anywhere on the site.
- The little motif row above "Bag number" gets the same balanced treatment.

## 2. Cozier palette

Shift the current cool pinks toward the warm, soft watercolor pinks from the photo:

- Background: warm blush-cream wash instead of stark near-white.
- Cards: soft warm pink/ivory with a gentle tint rather than pure white.
- Brand accent: the deep glossy cherry red from the photo.
- Text: warm cherry-brown instead of a cool dark red.
- Small supporting tints for gingham/blossom accents (pale pink, dusty rose, soft leaf green for cherry stems).

## 3. Cozier type

- Headings move to a warmer, rounder display serif with a homey, storybook feel.
- Body text gets a soft rounded sans that reads easily at 375px.
- Slightly larger line height and a touch more letter spacing so text feels relaxed rather than tight.

## 4. Busier motif wallpaper

- Use the uploaded pattern image itself as the site background, tiled and softened (low opacity, warm wash over it) so it never fights the content.
- Fall back to the existing SVG pattern behind it so the page still looks right before the image loads.
- Motif density goes up: cherries, hearts (solid, gingham, dotted), bows, and small blossoms scattered like the photo.
- Admin pages get the same cohesive theme too — same palette, fonts, cards, and background pattern (kept a touch lighter so data stays readable).

## 5. Chunkier, hand-crafted cards

- Bigger corner rounding and a soft layered shadow so cards feel like padded fabric rather than flat panels.
- Cards sit on a warm tinted surface with a thin ribbon-pink border.
- Buttons get pill shapes with a soft inner highlight, still 44px minimum tap targets.
- Section headings get a small bow or cherry divider (balanced, per note 1).

## Technical notes

- Palette, fonts, radii, and shadows are edited as tokens in `src/styles.css` (Tailwind v4 `@theme` / `:root`), not hardcoded in components.
- New fonts load via `<link>` tags in `src/routes/__root.tsx` head, per the Tailwind v4 rule against remote `@import`.
- The uploaded pattern is registered through the asset CLI and referenced by URL in the `bg-pattern` utility; the existing inline SVG stays as the fallback layer.
- Header changes are confined to `src/components/site-header.tsx`; motif and card changes touch the customer routes (`index`, product detail, cart, checkout, `view-bag`) and shared components only.
- No changes to data, server functions, Sheets/Apps Script wiring, cart logic, or admin behavior. Tap targets stay at 44px+ and 375px remains the priority width.
