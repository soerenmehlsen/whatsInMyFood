# Design: Result verdict banner + sorted grid

**Date:** 2026-06-15
**Status:** Approved
**Area:** Result display after scanning an ingredient list

## Problem

After a user scans an ingredient label, results render as an equal grid of
cards ([app/components/ingredient-grid.tsx](../../../app/components/ingredient-grid.tsx)),
one per ingredient, in label order, each showing name, a NOVA badge, and a
description/reason. There is **no overall verdict** about the product and no
ordering by how processed something is. The user must read every card to form a
judgement of "how processed is this product?".

## Goal

Give the user an immediate, plain-language verdict about the whole product at
the top of the results, and make the grid reinforce it by surfacing the most
processed ingredients first.

Out of scope: changing the per-card layout, the search/filter controls, auth,
or the marketing pages.

## Decisions (from brainstorming)

1. **Direction:** A "verdict banner" — a single colored headline driven by the
   worst NOVA level present, plus counter chips. (Chosen over a score/grade +
   distribution bar, and over a row of stat tiles.)
2. **Scope:** Add the banner **and** sort the grid so the most processed
   ingredients (NOVA 4) appear first.
3. **Language:** The banner's fixed text follows the **ingredient/label
   language** (the same language Gemini already uses for descriptions/reasons),
   not the otherwise-English UI chrome.
4. **Localization mechanism:** Gemini returns an ISO language code; the frontend
   owns a small i18n dictionary and computes all numbers locally. (Chosen over
   having Gemini emit the translated sentence fragments.)

## Verdict logic ("worst-wins")

Computed entirely in the frontend from the ingredient array. Numbers are never
taken from the model.

- **Headline level** = the highest `nova_classification` present in the list.

  | Highest NOVA | Label key            | Color  |
  |--------------|----------------------|--------|
  | 4            | highly processed     | red    |
  | 3            | processed            | amber  |
  | 2            | lightly processed    | blue   |
  | 1            | natural / minimal    | green  |

- **Headline text:** "{countAtHighest} of {total} ingredients are {groupName}"
  (localized). When all items are at the highest level, an "all" phrasing may be
  used (e.g. "All N ingredients are natural").
- **Subtext:** a short explanatory sentence for the level. When E-numbers are
  present, append "...including N additives (E-numbers)".
- **Chips:** one chip per NOVA group that actually occurs, showing count +
  localized group name, using the existing NOVA color palette.

**E-number detection:** an ingredient is an additive when its `name` matches
`/^E\d{3}/i` (e.g. `E451`, `E160b`). Used only for the additive count line.

### Color palette (reuse existing NOVA colors)

Matches [ingredient-grid.tsx](../../../app/components/ingredient-grid.tsx):
NOVA 1 green, NOVA 2 blue, NOVA 3 yellow/amber, NOVA 4 red. The banner uses a
tinted background + left accent border in the level's color.

## Grid sorting

In [ImageUploader.tsx](../../../app/components/ImageUploader.tsx), the derived
`filteredIngredient` list is sorted by `nova_classification` **descending**
(4 → 1). Sort must be stable so the original label order is preserved within a
NOVA group, and must operate on a copy (no mutation of state). Search and NOVA
filtering continue to apply before sorting.

## Components & files

### New

- **[lib/verdict.ts](../../../lib/verdict.ts)** — pure functions. Given
  `IngredientItem[]`, returns a verdict descriptor: `highestNova`, `total`,
  `countAtHighest`, per-group counts (only groups present), and `additiveCount`
  (E-numbers). No React, no i18n — easy to unit-test by hand. This is the single
  source of truth for the numbers.
- **[lib/i18n.ts](../../../lib/i18n.ts)** — a dictionary keyed by ISO language
  code. Seeded with `da` and `en`. Each entry provides the level labels, group
  nouns, and the subtext/additive templates. A `getStrings(language)` helper
  returns the entry for the code, falling back to `en` for any unknown code.
- **[app/components/ResultSummary.tsx](../../../app/components/ResultSummary.tsx)**
  — the banner. Props: `items: IngredientItem[]`, `language: string`. Calls
  `lib/verdict.ts` for numbers and `lib/i18n.ts` for words, then renders the
  banner (headline, subtext, chips). Pure presentation; no data fetching.

### Changed

- **[app/api/parseIngredient/route.ts](../../../app/api/parseIngredient/route.ts)**
  — change `responseSchema` from a bare array to an object
  `{ language: string, ingredient: IngredientItem[] }`. `language` is an ISO
  639-1 code for the detected label language. Update the system prompt to
  request it. Response becomes `{ success, ingredient, language }`. The existing
  E-number splitting and same-language description behavior is unchanged.
- **[app/components/ImageUploader.tsx](../../../app/components/ImageUploader.tsx)**
  — add `language` to component state (default e.g. `"en"`); set it from the API
  response in `handleFileChange`; set it to `"da"` in `handleExampleImage`
  (the example data is Danish). Render `<ResultSummary items={parsedIngredient}
  language={language} />` above the grid. Sort `filteredIngredient` descending
  by NOVA as described. Reset `language` in `handleReset`.

## Data flow

1. `handleFileChange` POSTs the image URL to `/api/parseIngredient`.
2. Route returns `{ success, ingredient, language }`.
3. `ImageUploader` stores `parsedIngredient` (normalized) and `language`.
4. `ResultSummary` derives numbers via `lib/verdict.ts`, words via
   `lib/i18n.ts`, and renders the banner.
5. The grid renders below, sorted NOVA-descending, filtered by search + NOVA.

## Error / edge handling

- **Empty list:** if `parsedIngredient` is empty, render nothing (existing
  behavior — banner and grid are gated on `length > 0`).
- **Unknown / missing `language`:** `getStrings` falls back to English. If the
  API omits `language`, default to `"en"`.
- **Unexpected NOVA values** (not 1–4): excluded from group chips; they do not
  raise the headline level. `highestNova` only considers values in 1–4.
- **No E-numbers:** the additive line is omitted.
- **Numbers come only from `lib/verdict.ts`**, never from the model, so counts
  are always internally consistent with the grid.

## Testing

No test framework is configured in the repo, so verification is manual plus
pure-function review:

- `lib/verdict.ts` is pure and deterministic; verify counts against the example
  data in [lib/consant.ts](../../../lib/consant.ts) (expected: highest NOVA 4,
  total 25, 7 NOVA 1, 4 NOVA 2, 14 NOVA 4, 7 E-numbers).
- Manual: run the example-image flow and confirm the red "highly processed"
  banner with correct counts, the grid sorted with NOVA 4 first, and that
  search/filter still work.
- Manual: confirm English fallback by simulating an unknown language code.

## Localization note

Only the banner follows the label language. The rest of the UI (buttons,
"Found X ingredients" heading, search placeholder) stays English, consistent
with the recent UI-English standardization. Adding a new language later means
adding one entry to `lib/i18n.ts`.
