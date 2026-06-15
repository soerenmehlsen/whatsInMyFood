# Apple "Clarity Light" Redesign — Design Spec

**Date:** 2026-06-15
**Status:** Approved (ready for implementation plan)

## Goal

Reskin WhatsInMyFood with a cohesive, Apple-inspired design system that is user-friendly,
modern, and professional. The dashboard (the ingredient-scanning flow) is the priority and
most-improved surface; the shared chrome and the marketing landing page are brought into the
same system so the whole app feels consistent.

## Decisions (locked during brainstorming)

- **Scope:** whole-app reskin built on one shared design system.
- **Visual direction:** "Clarity Light" — pure white surfaces, generous whitespace, large
  tight-tracked type, minimal color, hairline borders over heavy shadows. (apple.com product-page feel.)
- **Accent color:** "Fresh Green" — one accent drives buttons, links, focus rings, and the
  primary CTA. Kept distinct from the NOVA scale's green.
- **Results layout:** "Grouped by NOVA" — ingredient cards split into labeled sections from
  Ultra-processed → Whole, replacing the flat sorted grid.

## Design tokens

Defined once and reused everywhere. CSS custom properties live in `app/globals.css` (`:root`);
semantic Tailwind colors are added in `tailwind.config.ts` so components read cleanly
(e.g. `bg-accent`, `text-ink`, `text-muted`).

### Color

| Token | Value | Use |
|---|---|---|
| `--surface` | `#ffffff` | cards, banners, page |
| `--ink` | `#1d1d1f` | primary text, headings |
| `--muted` | `#86868b` | secondary text |
| `--hairline` | `#ececec` | card/borders |
| `--hairline-strong` | `#d2d2d7` | dashed dropzone, dividers |
| `--accent` | `#34c759` | primary buttons, active states |
| `--accent-hover` | `#2aa64c` | button hover |
| `--accent-fg` | `#1a8f3c` | accent text + links (AA contrast on white) |
| `--accent-ring` | `rgba(52,199,89,.4)` | focus-visible rings |

Tailwind theme extension maps these to: `accent` (DEFAULT/hover/fg), `ink`, `muted`,
`hairline` (+ `hairline-strong`).

### NOVA scale (separate semantic signal)

Single source of truth in a new `lib/nova.ts`, consumed by the verdict banner, the grouped
results, and the filter. Replaces the duplicated `novaLabelsColor` / `shortNovaLabel` /
`NovaInfo` logic in `ingredient-grid.tsx` and the chip/banner maps in `ResultSummary.tsx`.

`lib/nova.ts` exports, per level 1–4:
- `chip` — Tailwind classes for the pill (bg + text), keeping the current tints (N3 moves
  from `yellow` to `amber` for warmth/consistency):
  - N1 `bg-green-100 text-green-800` · N2 `bg-blue-100 text-blue-800` ·
    N3 `bg-amber-100 text-amber-800` · N4 `bg-red-100 text-red-800`
- `dot` — hex/Tailwind for the section/list dot (N1 `#34c759`, N2 `#3b82f6`,
  N3 `#f59e0b`, N4 `#ef4444`)
- `shortLabel` — `"NOVA 1"`…`"NOVA 4"`
- `groupTitle` — section heading text key (Ultra-processed / Processed / Culinary / Whole),
  resolved through the existing i18n strings where one exists.
- `info` — the long description used by the tooltip.

i18n stays in `lib/i18n.ts`; `lib/nova.ts` holds only the color/visual mapping and label keys.

### Type, radii, motion

- Keep Geist (already loaded, SF-like). Headings: bold, `tracking-tight` (≈ -0.02em),
  `text-balance`. Body uses `--ink` / `--muted`.
- Radii: `rounded-2xl` (16px) for cards/banners; pill (`rounded-full`) for buttons and chips.
- Shadows: hairline borders by default; very soft shadow only on hover
  (`0 8px 24px rgba(0,0,0,.06)`). Remove the existing `hover:scale-110` on cards — replace
  with a subtle lift (small `-translate-y` + soft shadow), ~150–200ms.
- Keep framer-motion and react-awesome-reveal; make transitions subtler.

## Components

### 1. Foundations (do first)

- `app/globals.css` — add the `:root` token variables; keep the existing `.hero-grid` utility.
- `tailwind.config.ts` — extend `theme.colors` with the semantic tokens above.
- `lib/nova.ts` — new single source for NOVA visual mapping + label keys (see above).

### 2. Dashboard flow — `app/components/ImageUploader.tsx`

Keeps the existing state machine (`initial | uploading | parsing | created | error`) and all
data flow (`uploadImageToSupabase`, `/api/parseIngredient`, `computeVerdict`, language). Visual
changes only.

- **Initial / upload screen:** a white dropzone card with a soft dashed `--hairline-strong`
  border, `rounded-2xl`, green camera icon, clear title + subtitle, a green pill **"Open camera"**
  button, and a quiet text link ("Try an example image →") in `--accent-fg`. Add a small
  reassurance line ("Free · no sign-up"). Centered, generous spacing.
- **Uploading / parsing states:** green spinner (accent), copy calmer; skeletons reshaped to
  preview the grouped layout (a banner block + a couple of labeled section blocks of cards).
- **"Upload a new image":** becomes a proper secondary button with an icon (not plain text);
  the uploaded thumbnail sits in a tidy framed card.
- **Error state:** friendly white card with an icon, message, and a green retry button.

### 3. Results

- **Verdict banner — `app/components/ResultSummary.tsx`:** restyle to Clarity Light — white
  card, hairline border, colored accent (left border/label tint by highest NOVA) and a large
  headline. Reuse `computeVerdict` + i18n; pull chip colors from `lib/nova.ts`.
- **Controls:**
  - Search — pill input (`rounded-full`, hairline border, green focus ring) using the existing
    `Input` component + heroicons search icon.
  - **FilterDropdown — `app/components/FilterDropdown.tsx`:** rebuilt as an Apple-style popover
    (rounded-xl, soft shadow, hairline border) with green-accented checkboxes. Same
    `onFilterChange(number[])` contract.
- **Grouped results — `app/components/ingredient-grid.tsx`:** the flat grid becomes
  grouped sections. The component receives the already filtered list and groups it by NOVA
  descending (4 → 1); empty groups are omitted. Each section: a header row (colored dot +
  localized group title + count) followed by the restyled card grid
  (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`). Cards: white, hairline border,
  `rounded-2xl`, name + NOVA pill, expand-on-click for description + reason (keep the existing
  `expandItem` interaction and framer-motion fade, subtler). **Replace the MUI `Tooltip`** with
  a lightweight tooltip (CSS/native) for the NOVA pill, and remove the `@mui/material` +
  `@emotion/*` dependencies (MUI is only used here — confirmed by grep).

  Note: `ImageUploader` already sorts `filteredIngredient` by NOVA descending; grouping makes
  that sort redundant within the grid but it is harmless. Grouping happens inside the grid so the
  search/filter logic in `ImageUploader` is untouched.

### 4. Shared chrome + landing consistency

- **Header — `app/components/header.tsx`:** keep the glassy `backdrop-blur` (already on-brand);
  align colors to tokens; tidy the leftover/broken mobile flex markup left behind by the
  commented-out Clerk block.
- **Footer — `app/components/footer.tsx`:** tighten spacing/typography to the muted token; keep
  hairline top border.
- **Landing (lighter touch):** swap the blue brand accent → green across CTAs, links, and
  gradient tints in `HeroSection`, `HowItWorks`, `WhyItMatters`, `SignUpButton`, and the CTA
  section in `app/page.tsx`. Layouts unchanged — only the accent/tokens are unified.

## Out of scope

- No changes to data flow, the Gemini route, Supabase upload, verdict logic, or i18n strings
  (beyond reading existing keys from `lib/nova.ts`).
- No re-enabling of Clerk auth.
- No landing-page layout/structure redesign — accent/token alignment only.
- No new test framework.

## Build order

1. Foundations (tokens + `lib/nova.ts`).
2. Dashboard flow (upload, loading, error, thumbnail).
3. Results (verdict banner, controls, grouped grid, MUI removal).
4. Shared chrome + landing accent pass.

## Verification

- `npm run lint` is **known-broken project-wide under Next 16** — do not gate on it.
- Verify with `npx tsc --noEmit` and `npm run build`.
- Manual: run `npm run dev`, walk the **example-image** flow (`handleExampleImage`) and a real
  upload, checking each state (initial → uploading → parsing → created → error), the verdict
  banner, search, NOVA filter, grouped sections, and card expand.
- Confirm `@mui/material` / `@emotion/*` are removed from `package.json` and the build still
  passes.
