# Cleanup pass: unused UI kit, dependencies, and plan files

The app only uses a handful of files. A scan shows the whole shadcn UI kit is unused except one file, and most npm packages exist only to support those unused components.

## What gets removed

1. **Old plan file** — `.lovable/plan/speed-up-view-bag-lookups-2026-09-02.md` (that work is done and documented in the README). Keeps `.lovable/project.json`.

2. **Unused UI components** — 44 of the 45 files in `src/components/ui/` are imported nowhere: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toggle, toggle-group, tooltip.
   Only `ui/sonner.tsx` stays (used for toasts in `__root.tsx`).

3. **`src/hooks/use-mobile.tsx`** — only consumer is the sidebar component being deleted.

4. **Dependencies that become dead** once the above are gone: all `@radix-ui/*` except the ones sonner/toast needs, plus `@hookform/resolvers`, `react-hook-form`, `cmdk`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `date-fns`, `react-resizable-panels`, `recharts`, `vaul`, `class-variance-authority` (verified per package before removal, not removed blindly).

## What stays

- All routes, `src/lib/*`, the admin components, the Apps Script copy, README/OPERATIONS.
- Lovable-managed files: `src/integrations/supabase/*`, `src/start.ts`, `supabase/config.toml`, `.env`, `src/routeTree.gen.ts`.

## Technical notes

- Order: delete files, then remove packages with `bun remove`, then run typecheck + production build to confirm nothing broke.
- Any package that turns out to still be referenced stays in `package.json`.
- No behavior or visual change to the site — this is purely dead-code removal.
