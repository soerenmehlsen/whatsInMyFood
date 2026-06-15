# Result Verdict Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a plain-language "verdict" banner above the ingredient grid that summarizes how processed the scanned product is, and sort the grid so the most processed ingredients appear first.

**Architecture:** A pure function (`lib/verdict.ts`) derives all numbers from the ingredient array — the model is never trusted to count. A small i18n dictionary (`lib/i18n.ts`) supplies the words in the label's language (Danish + English, English fallback). A presentational component (`app/components/ResultSummary.tsx`) renders the banner. The Gemini route returns an ISO language code alongside the ingredients; `ImageUploader` stores it, renders the banner, and sorts the grid by NOVA descending.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, `@google/generative-ai`. No test framework is configured; pure logic is verified with a throwaway `npx tsx` script, and the rest via `npm run lint` / `npm run build` plus a manual run of the example flow.

---

## File Structure

- **Create `lib/verdict.ts`** — pure verdict computation. Defines a structural input type (`VerdictInput`), the `Verdict` result type, `isAdditive()`, and `computeVerdict()`. No React, no i18n, no dependency on any component. Single source of truth for the numbers.
- **Create `lib/verdict.test.mts`** — standalone assertion script (node:assert) run with `npx tsx`. Verifies `computeVerdict` against the example data.
- **Create `lib/i18n.ts`** — `NovaStrings` type, `da` + `en` dictionaries, and `getStrings(language)` with English fallback. Imports only the `NovaGroup` type from `lib/verdict.ts`.
- **Create `app/components/ResultSummary.tsx`** — the banner. Props `{ items, language }`. Calls `computeVerdict` + `getStrings`, renders headline, subtext, and chips. Pure presentation.
- **Modify `app/api/parseIngredient/route.ts`** — change `responseSchema` from an array to an object `{ language, ingredient[] }`, update the prompt, return `{ success, ingredient, language }`.
- **Modify `app/components/ImageUploader.tsx`** — add `language` state, set it from the API and from the example flow, render `<ResultSummary>` above the grid, sort `filteredIngredient` by NOVA descending, reset `language` on reset.

---

### Task 1: Pure verdict computation (`lib/verdict.ts`)

**Files:**
- Create: `lib/verdict.ts`
- Test: `lib/verdict.test.mts`

- [ ] **Step 1: Write the failing test**

Create `lib/verdict.test.mts`:

```ts
import assert from "node:assert";
import { computeVerdict, isAdditive } from "./verdict";
import { exampleIngredient } from "./consant";

// Example data (hotdog) — see lib/consant.ts
const v = computeVerdict(exampleIngredient);
assert.ok(v, "expected a verdict for non-empty input");
assert.equal(v!.total, 25, "total");
assert.equal(v!.highestNova, 4, "highestNova");
assert.equal(v!.countAtHighest, 14, "countAtHighest (NOVA 4)");
assert.equal(v!.additiveCount, 7, "additiveCount (E-numbers)");

const counts = Object.fromEntries(v!.groupCounts.map((g) => [g.nova, g.count]));
assert.deepEqual(counts, { 1: 7, 2: 4, 4: 14 }, "groupCounts (no NOVA 3 present)");

// Empty input -> null
assert.equal(computeVerdict([]), null, "empty input -> null");

// Out-of-range nova values are ignored
assert.equal(
  computeVerdict([{ name: "x", nova_classification: 9 }]),
  null,
  "invalid nova-only input -> null",
);

// E-number detection
assert.equal(isAdditive({ name: "E451", nova_classification: 4 }), true);
assert.equal(isAdditive({ name: "Salt", nova_classification: 2 }), false);

console.log("verdict.test.mts: all assertions passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx lib/verdict.test.mts`
Expected: FAIL — `Cannot find module './verdict'` (file not created yet).

- [ ] **Step 3: Write the implementation**

Create `lib/verdict.ts`:

```ts
// Pure verdict computation for the result banner.
// All numbers shown to the user are derived here, never taken from the model.

export type NovaGroup = 1 | 2 | 3 | 4;

// Structural input: anything with a name and a nova classification.
// IngredientItem (app/components/ImageUploader) is compatible.
export interface VerdictInput {
  name: string;
  nova_classification: number;
}

export interface GroupCount {
  nova: NovaGroup;
  count: number;
}

export interface Verdict {
  total: number;
  highestNova: NovaGroup;
  countAtHighest: number;
  groupCounts: GroupCount[]; // only groups that occur, ascending by nova
  additiveCount: number; // count of E-number entries
}

const E_NUMBER = /^E\d{3}/i;

export function isAdditive(item: VerdictInput): boolean {
  return E_NUMBER.test(item.name.trim());
}

function asGroup(value: number): NovaGroup | null {
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? (n as NovaGroup) : null;
}

export function computeVerdict(items: VerdictInput[]): Verdict | null {
  const counts = new Map<NovaGroup, number>();
  let additiveCount = 0;
  let total = 0;

  for (const item of items) {
    const group = asGroup(item.nova_classification);
    if (group === null) continue; // ignore out-of-range values
    total += 1;
    counts.set(group, (counts.get(group) ?? 0) + 1);
    if (isAdditive(item)) additiveCount += 1;
  }

  if (total === 0) return null;

  const highestNova = Math.max(...counts.keys()) as NovaGroup;
  const groupCounts: GroupCount[] = ([1, 2, 3, 4] as NovaGroup[])
    .filter((n) => counts.has(n))
    .map((n) => ({ nova: n, count: counts.get(n)! }));

  return {
    total,
    highestNova,
    countAtHighest: counts.get(highestNova)!,
    groupCounts,
    additiveCount,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx lib/verdict.test.mts`
Expected: PASS — prints `verdict.test.mts: all assertions passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/verdict.ts lib/verdict.test.mts
git commit -m "feat: add pure verdict computation for result banner"
```

---

### Task 2: i18n dictionary (`lib/i18n.ts`)

**Files:**
- Create: `lib/i18n.ts`

- [ ] **Step 1: Write the implementation**

Create `lib/i18n.ts`:

```ts
import type { NovaGroup } from "@/lib/verdict";

export interface NovaStrings {
  // Small uppercase tag at the top of the banner, keyed by the highest NOVA level.
  verdictLabel: Record<NovaGroup, string>;
  // Group noun used in the headline and chips, e.g. "natural".
  groupNoun: Record<NovaGroup, string>;
  // Explanatory sentence, keyed by the highest NOVA level.
  subtext: Record<NovaGroup, string>;
  // "{count} of {total} ingredients are {noun}"
  headline: (countAtHighest: number, total: number, groupNoun: string) => string;
  // Extra sentence appended when E-numbers are present.
  additiveSuffix: (n: number) => string;
  // Chip text, e.g. "14 ultra-processed".
  chipLabel: (count: number, groupNoun: string) => string;
}

const en: NovaStrings = {
  verdictLabel: {
    1: "Natural product",
    2: "Lightly processed product",
    3: "Processed product",
    4: "Highly processed product",
  },
  groupNoun: {
    1: "natural",
    2: "culinary",
    3: "processed",
    4: "ultra-processed",
  },
  subtext: {
    1: "Only unprocessed or minimally processed foods (NOVA 1).",
    2: "Highest level is processed culinary ingredients (NOVA 2), e.g. oil and salt.",
    3: "Highest level is processed foods (NOVA 3). No ultra-processed ingredients found.",
    4: "Contains ultra-processed ingredients (NOVA 4).",
  },
  headline: (count, total, noun) => `${count} of ${total} ingredients are ${noun}`,
  additiveSuffix: (n) =>
    `Includes ${n} ${n === 1 ? "additive" : "additives"} (E-numbers).`,
  chipLabel: (count, noun) => `${count} ${noun}`,
};

const da: NovaStrings = {
  verdictLabel: {
    1: "Naturligt produkt",
    2: "Let forarbejdet produkt",
    3: "Forarbejdet produkt",
    4: "Stærkt forarbejdet produkt",
  },
  groupNoun: {
    1: "naturlige",
    2: "kulinariske",
    3: "forarbejdede",
    4: "ultra-forarbejdede",
  },
  subtext: {
    1: "Kun uforarbejdede eller minimalt forarbejdede fødevarer (NOVA 1).",
    2: "Højeste niveau er forarbejdede kulinariske ingredienser (NOVA 2), fx olie og salt.",
    3: "Højeste niveau er forarbejdede fødevarer (NOVA 3). Ingen ultra-forarbejdede ingredienser fundet.",
    4: "Indeholder ultra-forarbejdede ingredienser (NOVA 4).",
  },
  headline: (count, total, noun) => `${count} af ${total} ingredienser er ${noun}`,
  additiveSuffix: (n) =>
    `Heraf ${n} ${n === 1 ? "tilsætningsstof" : "tilsætningsstoffer"} (E-numre).`,
  chipLabel: (count, noun) => `${count} ${noun}`,
};

const dictionaries: Record<string, NovaStrings> = { en, da };

// Normalize "da-DK" / "DA" -> "da" and fall back to English for unknown codes.
export function getStrings(language: string | undefined): NovaStrings {
  const code = (language ?? "en").toLowerCase().split(/[-_]/)[0];
  return dictionaries[code] ?? en;
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: PASS — no type errors from `lib/i18n.ts` (pre-existing errors elsewhere, if any, are unrelated).

- [ ] **Step 3: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat: add i18n dictionary for verdict banner (da, en)"
```

---

### Task 3: Banner component (`app/components/ResultSummary.tsx`)

**Files:**
- Create: `app/components/ResultSummary.tsx`

- [ ] **Step 1: Write the implementation**

Create `app/components/ResultSummary.tsx`:

```tsx
import type { IngredientItem } from "@/app/components/ImageUploader";
import { computeVerdict } from "@/lib/verdict";
import { getStrings } from "@/lib/i18n";

// Tinted background + left accent border per highest NOVA level.
const bannerStyles: Record<number, { wrap: string; label: string }> = {
  1: { wrap: "bg-green-50 border-green-600", label: "text-green-800" },
  2: { wrap: "bg-blue-50 border-blue-500", label: "text-blue-800" },
  3: { wrap: "bg-amber-50 border-amber-500", label: "text-amber-800" },
  4: { wrap: "bg-red-50 border-red-500", label: "text-red-800" },
};

// Chip colors mirror the NOVA badges in ingredient-grid.tsx.
const chipColors: Record<number, string> = {
  1: "bg-green-100 text-green-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-red-100 text-red-800",
};

interface ResultSummaryProps {
  items: IngredientItem[];
  language: string;
}

export function ResultSummary({ items, language }: ResultSummaryProps) {
  const verdict = computeVerdict(items);
  if (!verdict) return null;

  const t = getStrings(language);
  const { highestNova, countAtHighest, total, groupCounts, additiveCount } =
    verdict;
  const style = bannerStyles[highestNova];

  let subtext = t.subtext[highestNova];
  if (additiveCount > 0) subtext += " " + t.additiveSuffix(additiveCount);

  return (
    <div
      className={`mb-8 rounded-xl border-l-[6px] p-5 text-left ${style.wrap}`}
    >
      <div
        className={`text-xs font-bold uppercase tracking-wide ${style.label}`}
      >
        {t.verdictLabel[highestNova]}
      </div>
      <div className="mt-1 mb-1 text-2xl font-extrabold text-gray-900">
        {t.headline(countAtHighest, total, t.groupNoun[highestNova])}
      </div>
      <p className="mb-4 text-sm text-gray-600">{subtext}</p>
      <div className="flex flex-wrap gap-2">
        {groupCounts.map((g) => (
          <span
            key={g.nova}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${chipColors[g.nova]}`}
          >
            ● {t.chipLabel(g.count, t.groupNoun[g.nova])}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS — no new errors from `ResultSummary.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/components/ResultSummary.tsx
git commit -m "feat: add ResultSummary verdict banner component"
```

---

### Task 4: Return language from the parse route

**Files:**
- Modify: `app/api/parseIngredient/route.ts:8-32` (schema)
- Modify: `app/api/parseIngredient/route.ts:56-74` (prompt)
- Modify: `app/api/parseIngredient/route.ts:102-117` (parse + response)

- [ ] **Step 1: Change the response schema to an object**

Replace the `schema` declaration (lines 8–32):

```ts
// Defines the JSON schema for a consistent and structured output
const schema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    language: {
      type: SchemaType.STRING,
      description:
        "ISO 639-1 code of the language used by the ingredient names (e.g. 'da', 'en')",
    },
    ingredient: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: "Name of the ingredient",
          },
          description: {
            type: SchemaType.STRING,
            description: "Description of the ingredient",
          },
          nova_classification: {
            type: SchemaType.NUMBER,
            description: "NOVA classification group (1-4)",
          },
          reason: {
            type: SchemaType.STRING,
            description: "Reason for the classification",
          },
        },
        required: ["name", "description", "nova_classification", "reason"],
      },
    },
  },
  required: ["language", "ingredient"],
};
```

- [ ] **Step 2: Ask the model for the language in the prompt**

In `systemPrompt`, append this sentence to the end of the existing NOVA-groups block (right after the line ending `...preservatives, and artificial flavors.`), inside the backtick string:

```
\n\nAlso return a top-level 'language' field: the ISO 639-1 code (e.g. 'da', 'en') of the language used by the ingredient names. Put every ingredient in the 'ingredient' array.
```

- [ ] **Step 3: Read language from the parsed object and return it**

Replace the parse + return section. Change:

```ts
  let parsedIngredients;
  try {
    parsedIngredients = JSON.parse(response.text());
    console.log({ parsedIngredients });
  } catch (error) {
    console.error('Error parsing ingredients JSON:', error);
    return NextResponse.json(
        { error: 'Failed to parse ingredients data' },
        { status: 500 }
    );
  }

  // Log the total request duration
  console.log(`Total request duration: ${Date.now() - outputStartTime}ms`);

  return NextResponse.json({ success: true, ingredient: parsedIngredients });
```

to:

```ts
  let parsed;
  try {
    parsed = JSON.parse(response.text());
    console.log({ parsed });
  } catch (error) {
    console.error('Error parsing ingredients JSON:', error);
    return NextResponse.json(
        { error: 'Failed to parse ingredients data' },
        { status: 500 }
    );
  }

  // Log the total request duration
  console.log(`Total request duration: ${Date.now() - outputStartTime}ms`);

  return NextResponse.json({
    success: true,
    ingredient: parsed.ingredient,
    language: typeof parsed.language === "string" ? parsed.language : "en",
  });
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: PASS — no new type errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/parseIngredient/route.ts
git commit -m "feat: return detected label language from parse route"
```

---

### Task 5: Wire the banner and grid sorting into ImageUploader

**Files:**
- Modify: `app/components/ImageUploader.tsx`

- [ ] **Step 1: Import the banner component**

Add to the imports near the top (after the `IngredientGrid` import on line 10):

```tsx
import { ResultSummary } from "./ResultSummary";
```

- [ ] **Step 2: Add language state**

After the `showCamera` state (line 34), add:

```tsx
  const [language, setLanguage] = useState<string>("en");
```

- [ ] **Step 3: Reset language on reset**

In `handleReset`, after `setShowCamera(false);`, add:

```tsx
    setLanguage("en");
```

- [ ] **Step 4: Store the language from the API response**

In `handleFileChange`, immediately after `setStatus("created");` (before the `normalizedIngredients` mapping), add:

```tsx
      setLanguage(typeof json.language === "string" ? json.language : "en");
```

- [ ] **Step 5: Set the example language to Danish**

In `handleExampleImage`, after `setStatus("created");`, add:

```tsx
    setLanguage("da");
```

- [ ] **Step 6: Sort the grid by NOVA descending**

Replace the `filteredIngredient` declaration (lines 96–103):

```tsx
  const filteredIngredient = (parsedIngredient || [])
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) =>
      selectedNovaFilters.length === 0 ||
      selectedNovaFilters.includes(item.nova_classification)
    );
```

with (copy before sort so state is never mutated; stable so label order is kept within a NOVA group):

```tsx
  const filteredIngredient = [...(parsedIngredient || [])]
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) =>
      selectedNovaFilters.length === 0 ||
      selectedNovaFilters.includes(item.nova_classification)
    )
    .sort((a, b) => b.nova_classification - a.nova_classification);
```

- [ ] **Step 7: Render the banner above the grid**

In the results block, replace:

```tsx
          <h2 className="text-4xl font-bold mb-5">
            Found {parsedIngredient.length} ingredients
          </h2>
```

with:

```tsx
          <h2 className="text-4xl font-bold mb-5">
            Found {parsedIngredient.length} ingredients
          </h2>
          <ResultSummary items={parsedIngredient} language={language} />
```

- [ ] **Step 8: Verify it type-checks and lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS — no new errors.

- [ ] **Step 9: Commit**

```bash
git add app/components/ImageUploader.tsx
git commit -m "feat: show verdict banner and sort grid by NOVA descending"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Build the app**

Run: `npm run build`
Expected: PASS — production build succeeds with no type errors.

- [ ] **Step 2: Manual check of the example flow**

Run: `npm run dev`, open the dashboard, click "Need an example image? Try here."
Expected:
- A **red** banner with the label "Stærkt forarbejdet produkt" (Danish, because the example sets `language: "da"`).
- Headline "14 af 25 ingredienser er ultra-forarbejdede".
- Subtext ends with "Heraf 7 tilsætningsstoffer (E-numre).".
- Three chips: "7 naturlige", "4 kulinariske", "14 ultra-forarbejdede".
- The grid below shows all NOVA 4 cards first, then NOVA 2, then NOVA 1.
- Search and the NOVA filter still work.

- [ ] **Step 3: Manual check of a real scan (optional, needs camera + API key)**

Scan an English label.
Expected: the banner renders in English (e.g. "Highly processed product"); an unknown label language falls back to English.

---

## Notes for the implementer

- **Why a structural input type:** `computeVerdict` takes `VerdictInput` (just `name` + `nova_classification`) instead of importing `IngredientItem` from a client component, so `lib/verdict.ts` stays free of React/UI dependencies and the `npx tsx` test runs without alias resolution. `IngredientItem` is structurally compatible, so `ResultSummary` can pass its `items` straight through.
- **Numbers vs. words:** every number comes from `lib/verdict.ts`; the model only supplies a language code. If the code is missing or unknown, everything falls back to English.
- **`lib/verdict.test.mts`** is a plain assertion script, not a framework test — keep it; it documents the expected counts for the example data and reruns in seconds with `npx tsx lib/verdict.test.mts`.
