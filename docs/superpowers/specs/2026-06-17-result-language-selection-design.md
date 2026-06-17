# Result Language Selection — Design

**Date:** 2026-06-17

## Problem

Today Gemini auto-detects the ingredient label's language and returns
descriptions and reasons in that same language. A user reading a foreign
product label has no way to get results in a language they understand. We want
the user to pick a target language up front, as a remembered setting, before
scanning.

## Behavior

- A language selector appears on the start screen (the `status === "initial"`
  view in `ImageUploader`), alongside the scan options.
- Options: **Auto-detect** (default) plus a curated list — English, Danish,
  German, Spanish, French, Swedish.
- **Auto-detect** preserves today's behavior: Gemini matches the label's own
  language.
- Any fixed choice makes Gemini output **every field — ingredient names,
  descriptions, and reasons — in that language**, regardless of the label's
  original language.
- The choice is persisted to `localStorage` and restored on future visits.
  Because it is a setting, **Reset / "Scan again" keeps it** — reset only clears
  scan results, not the language preference.

## Components

### `lib/languages.ts` (new)
Single source of truth for the supported set:

```ts
export interface LanguageOption {
  code: string;   // "auto" | ISO 639-1
  label: string;  // human-readable, shown in the UI
  promptName: string; // English name used in the prompt, e.g. "German"
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "auto", label: "Auto-detect", promptName: "" },
  { code: "en", label: "English", promptName: "English" },
  { code: "da", label: "Dansk", promptName: "Danish" },
  { code: "de", label: "Deutsch", promptName: "German" },
  { code: "es", label: "Español", promptName: "Spanish" },
  { code: "fr", label: "Français", promptName: "French" },
  { code: "sv", label: "Svenska", promptName: "Swedish" },
];

export const DEFAULT_LANGUAGE = "auto";

// Returns the option for a code, or undefined if unknown / "auto".
export function getFixedLanguage(code: string | null | undefined):
  LanguageOption | undefined;
```

Both the UI and the API route import from here so the supported set can't drift.
`getFixedLanguage` returns `undefined` for `null`, `"auto"`, or any
unrecognized code, giving the route a single fail-safe check.

### `LanguageSelect` component (new, `app/components/`)
A small styled `<select>` matching the existing rounded / hairline aesthetic.
Controlled:

```tsx
<LanguageSelect value={targetLang} onChange={setTargetLang} />
```

Renders `LANGUAGE_OPTIONS` as `<option>`s. No internal state.

### `ImageUploader.tsx` (modified)
- New state `targetLang`, initialized from `localStorage` (key
  `wimf:targetLang`), falling back to `DEFAULT_LANGUAGE`. Reading happens in a
  lazy initializer / effect so it's SSR-safe (no `localStorage` on the server).
- A small effect writes `targetLang` back to `localStorage` whenever it changes.
- Renders `LanguageSelect` on the initial screen.
- Appends `targetLang` to the `FormData` in both `handleFileChange` (image
  path) and `handleBarcode` (text path).
- `handleReset` no longer resets the language preference (remove the
  `setLanguage("en")` interplay only insofar as it concerns the *preference* —
  the displayed-result `language` state is separate and may still reset).

Note the existing component has two related concepts that must not be conflated:
- `language` — the language of the **current results**, used by `ResultSummary`
  and `IngredientGrid` for display. Set from the API response.
- `targetLang` (new) — the **user's preference** for future scans.

### `app/api/parseIngredient/route.ts` (modified)
- Read `targetLang` from `formData`.
- Call `getFixedLanguage(targetLang)`. If it returns a `LanguageOption`:
  - Append one instruction to the system prompt:
    *"Output every field — ingredient names, descriptions, and reasons — in
    {promptName} ({code}), regardless of the label's original language."*
  - Return that `code` as the response `language` (instead of the model's
    detected value), so the UI display matches what was requested.
- If it returns `undefined` (absent / `"auto"` / unknown) → behavior is
  unchanged: existing prompt, model-detected `language`. Fails safe.

## Data flow

1. User picks a language on the start screen → `targetLang` state +
   `localStorage`.
2. User scans (barcode or photo) → `targetLang` is added to the request
   `FormData`.
3. Route conditionally augments the prompt and forces the response `language`.
4. Response renders as today; `IngredientGrid` / `ResultSummary` use the
   returned `language`.

## Out of scope / notes

- UI chrome stays English — only AI-generated content is translated.
- The example-image demo uses hardcoded Danish data (`lib/consant.ts`); it
  ignores the setting and stays Danish. No change.
- Client-side search matches on `name`; since names are now in the chosen
  language, search stays consistent with what is displayed.
- No new dependencies. No test framework exists; verification is via
  `npx tsc --noEmit` + `npm run build` (project lint is known-broken under
  Next 16).
