# Result Language Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user pick a target language as a remembered setting before scanning, so Gemini returns all result fields in that language.

**Architecture:** A new `lib/languages.ts` is the single source of truth for the supported language set, imported by both a new `LanguageSelect` client component and the API route. `ImageUploader` holds the `targetLang` preference (persisted to `localStorage`), renders the selector on the start screen, and sends `targetLang` with each scan request. The API route augments the Gemini system prompt only when a valid fixed language is supplied; otherwise behavior is unchanged.

**Tech Stack:** Next.js 16 (App Router), React client components, TypeScript, Tailwind, Google Generative AI SDK.

## Global Constraints

- No new dependencies.
- Path alias `@/*` maps to repo root (e.g. `@/lib/languages`, `@/app/components/...`).
- Use `cn()` from `lib/utils.ts` for conditional class names; styling is Tailwind utility classes.
- Note `lib/consant.ts` is the real (misspelled) filename — do not "fix" it.
- No test framework exists. "Verify" steps mean: `npx tsc --noEmit` passes, `npm run build` succeeds, and (where stated) a manual browser check. `npm run lint` is known-broken under Next 16 — do not rely on it.
- UI chrome stays English; only AI-generated content is translated.
- localStorage key: `wimf:targetLang`. Default language code: `auto`.

---

### Task 1: Language source of truth (`lib/languages.ts`)

**Files:**
- Create: `lib/languages.ts`

**Interfaces:**
- Produces:
  - `interface LanguageOption { code: string; label: string; promptName: string }`
  - `const LANGUAGE_OPTIONS: LanguageOption[]`
  - `const DEFAULT_LANGUAGE: string` (= `"auto"`)
  - `function getFixedLanguage(code: string | null | undefined): LanguageOption | undefined`

- [ ] **Step 1: Create the file with the full content**

```ts
// lib/languages.ts
export interface LanguageOption {
  /** "auto" or an ISO 639-1 code */
  code: string;
  /** Human-readable label shown in the UI (in its own language) */
  label: string;
  /** English name used inside the Gemini prompt; "" for auto-detect */
  promptName: string;
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

/**
 * Returns the LanguageOption for a fixed (non-auto) language code, or
 * undefined for null/undefined, "auto", or any unrecognized code.
 * This is the single fail-safe check used by both the UI and the API route.
 */
export function getFixedLanguage(
  code: string | null | undefined,
): LanguageOption | undefined {
  if (!code || code === "auto") return undefined;
  return LANGUAGE_OPTIONS.find(
    (opt) => opt.code === code && opt.promptName !== "",
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors referencing `lib/languages.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/languages.ts
git commit -m "feat: add language options source of truth"
```

---

### Task 2: `LanguageSelect` component

**Files:**
- Create: `app/components/LanguageSelect.tsx`

**Interfaces:**
- Consumes: `LANGUAGE_OPTIONS` from `@/lib/languages`.
- Produces: default export `LanguageSelect`, props `{ value: string; onChange: (code: string) => void; className?: string }`.

- [ ] **Step 1: Create the component**

```tsx
// app/components/LanguageSelect.tsx
"use client";

import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { cn } from "@/lib/utils";

interface LanguageSelectProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export default function LanguageSelect({
  value,
  onChange,
  className,
}: LanguageSelectProps) {
  return (
    <label className={cn("flex items-center gap-2 text-sm text-muted", className)}>
      <span>Results in</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-hairline-strong bg-surface px-3 py-1.5 text-sm font-medium text-ink shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34c759]/40"
      >
        {LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors referencing `LanguageSelect.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/components/LanguageSelect.tsx
git commit -m "feat: add LanguageSelect component"
```

---

### Task 3: Wire preference into `ImageUploader`

**Files:**
- Modify: `app/components/ImageUploader.tsx`

**Interfaces:**
- Consumes: `LanguageSelect` (default export), `DEFAULT_LANGUAGE` from `@/lib/languages`.
- Produces: requests to `/api/parseIngredient` now include a `targetLang` form field.

Note: there are two distinct concepts. `language` (existing state) = language of the **current results**, set from the API response, used by `ResultSummary`/`IngredientGrid`. `targetLang` (new) = the **user's preference** for future scans. Do not merge them.

- [ ] **Step 1: Add imports**

Add to the import block near the top (after the existing `FilterDropdown` import at `app/components/ImageUploader.tsx:21`):

```tsx
import LanguageSelect from "./LanguageSelect";
import { DEFAULT_LANGUAGE } from "@/lib/languages";
```

- [ ] **Step 2: Add `targetLang` state with lazy localStorage init**

Add immediately after the existing `const [language, setLanguage] = useState<string>("en");` line (`app/components/ImageUploader.tsx:51`):

```tsx
  const [targetLang, setTargetLang] = useState<string>(DEFAULT_LANGUAGE);

  // Restore the saved preference after mount (localStorage is client-only).
  useEffect(() => {
    const saved = window.localStorage.getItem("wimf:targetLang");
    if (saved) setTargetLang(saved);
  }, []);

  // Persist the preference whenever it changes.
  useEffect(() => {
    window.localStorage.setItem("wimf:targetLang", targetLang);
  }, [targetLang]);
```

Also add `useEffect` to the React import at `app/components/ImageUploader.tsx:4`:

```tsx
import { useEffect, useState } from "react";
```

- [ ] **Step 3: Send `targetLang` in the image path**

In `handleFileChange`, after `formData.append("image", compressed, "ingredient.jpg");` (`app/components/ImageUploader.tsx:106`), add:

```tsx
      formData.append("targetLang", targetLang);
```

- [ ] **Step 4: Send `targetLang` in the barcode/text path**

In `handleBarcode`, after `formData.append("text", result.ingredientsText);` (`app/components/ImageUploader.tsx:142`), add:

```tsx
      formData.append("targetLang", targetLang);
```

- [ ] **Step 5: Keep the preference on reset**

`handleReset` currently ends with `setLanguage("en");` (`app/components/ImageUploader.tsx:66`). Leave that line (it resets the *displayed-result* language). Do NOT add any reset of `targetLang` — the preference must survive resets. No code change needed here beyond confirming `targetLang` is not touched.

- [ ] **Step 6: Render the selector on the start screen**

Inside the `status === "initial"` block, in the `<div className="mt-6 flex flex-col items-center gap-3">` group (`app/components/ImageUploader.tsx:207`), add the selector as the last child of that flex column, after the "Need an example image?" button and before the closing `</div>`:

```tsx
            <LanguageSelect
              value={targetLang}
              onChange={setTargetLang}
              className="mt-1"
            />
```

- [ ] **Step 7: Verify type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed, no errors.

- [ ] **Step 8: Commit**

```bash
git add app/components/ImageUploader.tsx
git commit -m "feat: add language preference selector to scan flow"
```

---

### Task 4: Honor `targetLang` in the API route

**Files:**
- Modify: `app/api/parseIngredient/route.ts`

**Interfaces:**
- Consumes: `targetLang` form field; `getFixedLanguage` from `@/lib/languages`.
- Produces: response `language` equals the requested code when a fixed language is supplied.

- [ ] **Step 1: Import the helper**

Add to the imports at the top of `app/api/parseIngredient/route.ts` (after line 3):

```ts
import { getFixedLanguage } from "@/lib/languages";
```

- [ ] **Step 2: Read and resolve the requested language**

After the existing `ingredientText` derivation block (`app/api/parseIngredient/route.ts:72-73`), add:

```ts
  const targetLangInput = formData.get("targetLang");
  const requestedLang = getFixedLanguage(
    typeof targetLangInput === "string" ? targetLangInput : undefined,
  );
```

- [ ] **Step 3: Append the language instruction to the prompt**

The system prompt is assigned to `const systemPrompt` (`app/api/parseIngredient/route.ts:94-114`). Right after that assignment closes (after line 114), add:

```ts
  const languageInstruction = requestedLang
    ? `\n\nIMPORTANT LANGUAGE OVERRIDE: Output every field — ingredient names, descriptions, and reasons — in ${requestedLang.promptName} (${requestedLang.code}), regardless of the label's original language. Translate ingredient names into ${requestedLang.promptName} as well.`
    : "";
  const fullPrompt = systemPrompt + languageInstruction;
```

- [ ] **Step 4: Use `fullPrompt` in the model parts**

In the `parts` assignment (`app/api/parseIngredient/route.ts:124-134`), replace both occurrences of `{ text: systemPrompt }` with `{ text: fullPrompt }`. The block becomes:

```ts
  const parts = hasImage
    ? [
        { text: fullPrompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: Buffer.from(await (image as File).arrayBuffer()).toString("base64"),
          },
        },
      ]
    : [{ text: fullPrompt }, { text: textPreamble + ingredientText }];
```

- [ ] **Step 5: Force the response language when requested**

The route currently returns (`app/api/parseIngredient/route.ts:156-160`):

```ts
  return NextResponse.json({
    success: true,
    ingredient: parsed.ingredient,
    language: typeof parsed.language === "string" ? parsed.language : "en",
  });
```

Replace the `language` line so a requested fixed language wins:

```ts
  return NextResponse.json({
    success: true,
    ingredient: parsed.ingredient,
    language: requestedLang
      ? requestedLang.code
      : typeof parsed.language === "string"
        ? parsed.language
        : "en",
  });
```

- [ ] **Step 6: Verify type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed, no errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/parseIngredient/route.ts
git commit -m "feat: honor target language override in parse route"
```

---

### Task 5: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify the selector and persistence**

In the browser at the dashboard:
- The "Results in" selector appears on the start screen, defaulting to "Auto-detect".
- Change it to "Deutsch", reload the page → it still shows "Deutsch" (localStorage persistence).

- [ ] **Step 3: Verify Auto behavior unchanged**

Set selector to "Auto-detect", scan (or use a barcode lookup) → descriptions/reasons come back in the label's own language, as before.

- [ ] **Step 4: Verify a fixed language**

Set selector to a language different from the label (e.g. "English" on a Danish product), scan → names, descriptions, and reasons come back in that language, and `ResultSummary`/`IngredientGrid` render consistently.

- [ ] **Step 5: Verify reset keeps the preference**

After results show, click "Scan again" / reset → the selector still shows the chosen language (preference survived).

---

## Self-Review

**Spec coverage:**
- Start-screen selector, Auto default → Task 3 Step 6, Task 1 `DEFAULT_LANGUAGE`.
- Curated list (en/da/de/es/fr/sv + auto) → Task 1.
- Full translation incl. names → Task 4 Step 3.
- localStorage persistence → Task 3 Step 2.
- Reset keeps preference → Task 3 Step 5, Task 5 Step 5.
- Fail-safe on absent/auto/unknown → Task 1 `getFixedLanguage`, Task 4 Steps 2/5.
- Example image stays Danish, untouched → no task modifies `handleExampleImage`/`lib/consant.ts` (intentional).

**Placeholder scan:** No TBD/TODO; all code shown in full.

**Type consistency:** `LanguageOption`, `LANGUAGE_OPTIONS`, `DEFAULT_LANGUAGE`, `getFixedLanguage` names/signatures match across Tasks 1, 2, 3, 4. `targetLang` form field name consistent between Task 3 (send) and Task 4 (read).
