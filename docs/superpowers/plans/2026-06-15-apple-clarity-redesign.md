# Apple "Clarity Light" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin WhatsInMyFood with a cohesive Apple-inspired "Clarity Light + Fresh Green" design system, focused on the dashboard scanning flow, with grouped-by-NOVA results.

**Architecture:** Define design tokens once (CSS variables in `globals.css` + semantic Tailwind colors), centralize NOVA visual mapping in `lib/nova.ts`, then restyle each component to consume them. No data-flow, API, verdict, or i18n-string changes.

**Tech Stack:** Next.js 16 (App Router), React, Tailwind CSS v3, framer-motion, heroicons, Geist font.

**Testing note:** This project has **no test framework**, and `npm run lint` is **known-broken project-wide under Next 16** — do not gate on it. Each task is verified with `npx tsc --noEmit` (type-safety) plus a manual check in `npm run dev` via the example-image flow. A final task runs `npm run build`.

**Spec:** `docs/superpowers/specs/2026-06-15-apple-clarity-redesign-design.md`

---

### Task 1: Foundations — tokens, Tailwind theme, NOVA helper

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Create: `lib/nova.ts`

- [ ] **Step 1: Add design tokens to `app/globals.css`**

Replace the top of the file (the `@tailwind` lines through the `body` rule) with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #1d1d1f;

  --surface: #ffffff;
  --ink: #1d1d1f;
  --muted: #86868b;
  --hairline: #ececec;
  --hairline-strong: #d2d2d7;

  --accent: #34c759;
  --accent-hover: #2aa64c;
  --accent-fg: #1a8f3c;
  --accent-ring: rgba(52, 199, 89, 0.4);
}

body {
  color: var(--ink);
  background: var(--background);
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
}
```

Leave the existing `@layer utilities { .hero-grid { ... } }` block unchanged.

- [ ] **Step 2: Extend the Tailwind theme and add `lib` to content globs**

Replace the contents of `tailwind.config.ts` with:

```ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        surface: "var(--surface)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          fg: "var(--accent-fg)",
        },
        hairline: {
          DEFAULT: "var(--hairline)",
          strong: "var(--hairline-strong)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

> Adding `./lib/**` is required so Tailwind scans the class strings in `lib/nova.ts` (Step 3) and does not purge them.

- [ ] **Step 3: Create `lib/nova.ts`**

```ts
import type { NovaGroup } from "@/lib/verdict";

export interface NovaVisual {
  chip: string; // pill background + text classes
  dot: string; // hex for the section/list dot
  shortLabel: string; // e.g. "NOVA 1"
  info: string; // long description for the tooltip
}

const VISUALS: Record<NovaGroup, NovaVisual> = {
  1: {
    chip: "bg-green-100 text-green-800",
    dot: "#34c759",
    shortLabel: "NOVA 1",
    info: "1. Unprocessed or minimally processed foods",
  },
  2: {
    chip: "bg-blue-100 text-blue-800",
    dot: "#3b82f6",
    shortLabel: "NOVA 2",
    info: "2. Processed culinary ingredients",
  },
  3: {
    chip: "bg-amber-100 text-amber-800",
    dot: "#f59e0b",
    shortLabel: "NOVA 3",
    info: "3. Processed foods",
  },
  4: {
    chip: "bg-red-100 text-red-800",
    dot: "#ef4444",
    shortLabel: "NOVA 4",
    info: "4. Ultra-processed foods",
  },
};

const UNKNOWN: NovaVisual = {
  chip: "bg-gray-100 text-gray-800",
  dot: "#9ca3af",
  shortLabel: "Unknown NOVA",
  info: "Unknown NOVA",
};

export function novaVisual(nova: number): NovaVisual {
  return VISUALS[nova as NovaGroup] ?? UNKNOWN;
}

// Capitalized group noun for section headers, e.g. "Ultra-processed".
// Pulls from the existing i18n groupNoun so language stays consistent.
export function sectionTitle(groupNoun: string): string {
  return groupNoun.charAt(0).toUpperCase() + groupNoun.slice(1);
}
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tailwind.config.ts lib/nova.ts
git commit -m "feat: add Clarity Light design tokens and NOVA visual helper"
```

---

### Task 2: Restyle the verdict banner

**Files:**
- Modify: `app/components/ResultSummary.tsx`

- [ ] **Step 1: Rewrite `ResultSummary.tsx` to use tokens + `lib/nova.ts`**

Replace the entire file with:

```tsx
import type { IngredientItem } from "@/app/components/ImageUploader";
import { computeVerdict } from "@/lib/verdict";
import { getStrings } from "@/lib/i18n";
import { novaVisual } from "@/lib/nova";

// Left accent border color per highest NOVA level, matching the NOVA dots.
const accentBorder: Record<number, string> = {
  1: "border-l-[#34c759]",
  2: "border-l-[#3b82f6]",
  3: "border-l-[#f59e0b]",
  4: "border-l-[#ef4444]",
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

  let subtext = t.subtext[highestNova];
  if (additiveCount > 0) subtext += " " + t.additiveSuffix(additiveCount);

  return (
    <div
      className={`mb-8 rounded-2xl border border-hairline border-l-[6px] bg-surface p-6 text-left shadow-sm ${accentBorder[highestNova]}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t.verdictLabel[highestNova]}
      </div>
      <div className="mt-1 mb-1 text-2xl font-bold tracking-tight text-ink">
        {t.headline(countAtHighest, total, t.groupNoun[highestNova])}
      </div>
      <p className="mb-4 text-sm text-muted">{subtext}</p>
      <div className="flex flex-wrap gap-2">
        {groupCounts.map((g) => (
          <span
            key={g.nova}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${novaVisual(g.nova).chip}`}
          >
            ● {t.chipLabel(g.count, t.groupNoun[g.nova])}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check**

Run `npm run dev`, open `/dashboard`, click "Try an example image". The banner should be a white rounded card with a colored left edge, muted label, bold headline, and colored chips.

- [ ] **Step 4: Commit**

```bash
git add app/components/ResultSummary.tsx
git commit -m "feat: restyle verdict banner to Clarity Light"
```

---

### Task 3: Grouped-by-NOVA ingredient results + remove MUI tooltip

**Files:**
- Modify: `app/components/ingredient-grid.tsx` (full rewrite)
- Modify: `app/components/ImageUploader.tsx` (pass `language` to the grid)

- [ ] **Step 1: Rewrite `ingredient-grid.tsx` as grouped sections**

Replace the entire file with:

```tsx
"use client";

import { IngredientItem } from "@/app/components/ImageUploader";
import { motion } from "framer-motion";
import { useState } from "react";
import { getStrings } from "@/lib/i18n";
import { novaVisual, sectionTitle } from "@/lib/nova";
import type { NovaGroup } from "@/lib/verdict";

interface IngredientGridProps {
  items: IngredientItem[];
  language: string;
}

export function IngredientGrid({ items, language }: IngredientGridProps) {
  const [expandItem, setExpandItem] = useState<string | null>(null);
  const t = getStrings(language);

  const handleExpand = (itemName: string) => {
    setExpandItem((prev) => (prev === itemName ? null : itemName));
  };

  // Group by NOVA level, highest (most processed) first. Empty groups omitted.
  const groups = ([4, 3, 2, 1] as NovaGroup[])
    .map((nova) => ({
      nova,
      items: items.filter((i) => Number(i.nova_classification) === nova),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const visual = novaVisual(group.nova);
        return (
          <section key={group.nova}>
            <div className="mb-4 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: visual.dot }}
              />
              <h3 className="text-sm font-semibold tracking-tight text-ink">
                {sectionTitle(t.groupNoun[group.nova])}
              </h3>
              <span className="text-sm text-muted">· {group.items.length}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  onClick={() => handleExpand(item.name)}
                  className="group cursor-pointer rounded-2xl border border-hairline bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative">
                    <h4 className="mb-1 pr-16 text-base font-semibold text-ink">
                      {item.name}
                    </h4>

                    {/* NOVA pill with a lightweight CSS tooltip */}
                    <span className="absolute right-0 top-0">
                      <span className="group/tip relative inline-flex">
                        <span
                          tabIndex={0}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${visual.chip}`}
                        >
                          {visual.shortLabel}
                        </span>
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute right-0 top-full z-10 mt-1 w-48 rounded-lg bg-ink px-2.5 py-1.5 text-left text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
                        >
                          {visual.info}
                        </span>
                      </span>
                    </span>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: expandItem === item.name ? 1 : 0.7,
                      }}
                      className={`text-sm text-muted ${
                        expandItem === item.name
                          ? "line-clamp-none"
                          : "line-clamp-2"
                      }`}
                    >
                      {item.description}
                      <br />
                      <span className="font-semibold text-ink">Process: </span>
                      {item.reason}
                    </motion.p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
```

> This removes the `@mui/material` `Tooltip` import (dep removed in Task 7). Grouping happens here, so the existing search/filter logic in `ImageUploader` is untouched; its NOVA sort becomes redundant but harmless.

- [ ] **Step 2: Pass `language` to the grid in `ImageUploader.tsx`**

In `app/components/ImageUploader.tsx`, find:

```tsx
          <IngredientGrid items={filteredIngredient} />
```

Replace with:

```tsx
          <IngredientGrid items={filteredIngredient} language={language} />
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Visual check**

In `npm run dev`, run the example flow. Results should now appear in labeled sections (Ultra-processed → … → Natural) with colored dots, restyled cards that lift on hover, and a dark tooltip on the NOVA pill (hover or keyboard focus).

- [ ] **Step 5: Commit**

```bash
git add app/components/ingredient-grid.tsx app/components/ImageUploader.tsx
git commit -m "feat: group ingredient results by NOVA and drop MUI tooltip"
```

---

### Task 4: Restyle the NOVA filter dropdown

**Files:**
- Modify: `app/components/FilterDropdown.tsx`

- [ ] **Step 1: Rewrite `FilterDropdown.tsx` as an Apple-style popover**

Replace the entire file with:

```tsx
"use client";
import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { novaVisual } from "@/lib/nova";

// Filter dropdown component for selecting NOVA classification
export default function FilterDropdown({
  onFilterChange,
}: {
  onFilterChange: (selected: number[]) => void;
}) {
  const [selectedFilters, setSelectedFilters] = useState<number[]>([]);

  const handleFilterChange = (value: number) => {
    const newFilters = selectedFilters.includes(value)
      ? selectedFilters.filter((filter) => filter !== value)
      : [...selectedFilters, value];

    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-muted [&::-webkit-details-marker]:hidden">
          <span>
            Filter{selectedFilters.length > 0 ? ` · ${selectedFilters.length}` : ""}
          </span>
          <span className="transition group-open:-rotate-180">
            <ChevronDownIcon className="size-4" />
          </span>
        </summary>

        <div className="absolute end-0 z-50 mt-2 w-48 rounded-2xl border border-hairline bg-surface p-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs text-muted">
              {selectedFilters.length} selected
            </span>
            <button
              type="button"
              className="text-xs font-medium text-accent-fg hover:underline"
              onClick={() => {
                setSelectedFilters([]);
                onFilterChange([]);
              }}
            >
              Reset
            </button>
          </div>

          <ul className="mt-1 border-t border-hairline pt-1">
            {[1, 2, 3, 4].map((nova) => (
              <li key={nova}>
                <label
                  htmlFor={`FilterNova${nova}`}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    id={`FilterNova${nova}`}
                    className="size-4 rounded border-gray-300 text-accent accent-[#34c759]"
                    checked={selectedFilters.includes(nova)}
                    onChange={() => handleFilterChange(nova)}
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: novaVisual(nova).dot }}
                  />
                  <span className="text-sm font-medium text-ink">
                    NOVA {nova}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check**

In the example flow, the Filter control is now a rounded pill; opening it shows a soft-shadowed popover with green checkboxes and NOVA color dots. Selecting filters still narrows the grid.

- [ ] **Step 4: Commit**

```bash
git add app/components/FilterDropdown.tsx
git commit -m "feat: restyle NOVA filter as Apple-style popover"
```

---

### Task 5: Restyle the results header and search control

**Files:**
- Modify: `app/components/ImageUploader.tsx` (results block, lines ~233-254)

- [ ] **Step 1: Replace the results header + controls markup**

In `app/components/ImageUploader.tsx`, find this block:

```tsx
        <div className="mt-10 max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-5">
            Found {parsedIngredient.length} ingredients
          </h2>
          <ResultSummary items={parsedIngredient} language={language} />
          <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search ingredient items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <FilterDropdown onFilterChange={setSelectedNovaFilters} />
          </div>
          <IngredientGrid items={filteredIngredient} language={language} />
        </div>
```

Replace with:

```tsx
        <div className="mx-auto mt-10 max-w-7xl text-left">
          <h2 className="mb-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Found {parsedIngredient.length} ingredients
          </h2>
          <ResultSummary items={parsedIngredient} language={language} />
          <div className="mb-8 flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <Input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-full border-hairline-strong bg-surface pl-11 text-ink shadow-none focus-visible:ring-2 focus-visible:ring-[#34c759]/40"
              />
            </div>
            <FilterDropdown onFilterChange={setSelectedNovaFilters} />
          </div>
          <IngredientGrid items={filteredIngredient} language={language} />
        </div>
```

> Note: Step 1 already includes the `language` prop from Task 3; if Task 3 ran first this whole block is replaced consistently.

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check**

Search field is now a pill with a green focus ring; header is tighter; everything left-aligned within the results container.

- [ ] **Step 4: Commit**

```bash
git add app/components/ImageUploader.tsx
git commit -m "feat: restyle results header and search control"
```

---

### Task 6: Restyle upload, loading, error, and thumbnail states

**Files:**
- Modify: `app/components/ImageUploader.tsx` (initial / uploading / parsing / error blocks and the thumbnail block)

- [ ] **Step 1: Replace the outer container class**

Find:

```tsx
    <div className="container text-center px-4 py-8 max-w-full mx-auto">
```

Replace with:

```tsx
    <div className="container mx-auto max-w-full px-4 py-10 text-center">
```

- [ ] **Step 2: Replace the initial upload screen**

Find the `{status === "initial" && (` block (the dropzone button + example link, ending before `<AnimatePresence>`). Replace the dropzone `<div className="max-w-2xl mx-auto"> ... </div>` and the example-link `<div className="flex justify-center w-full my-5"> ... </div>` with:

```tsx
        <div className="mx-auto max-w-xl">
          <Fade direction="up" delay={300}>
            <button
              onClick={() => setShowCamera(true)}
              className="group mt-2 flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-hairline-strong bg-surface transition hover:border-accent"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#34c759]/10 transition group-hover:bg-[#34c759]/15">
                <CameraIcon className="h-7 w-7 text-accent" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xl font-semibold tracking-tight text-ink">
                Scan your ingredient list
              </p>
              <p className="mt-1 text-sm text-muted">
                Take a photo and let AI break it down
              </p>
            </button>
          </Fade>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Fade direction="up" delay={400}>
              <button
                onClick={handleExampleImage}
                className="text-sm font-semibold text-accent-fg transition hover:underline"
              >
                Need an example image? Try here →
              </button>
            </Fade>
            <p className="text-xs text-muted">Free · No sign-up needed</p>
          </div>
        </div>
```

- [ ] **Step 3: Replace the thumbnail ("Upload a new image") block**

Find:

```tsx
      {ingredientUrl && (
        <div className="my-10 mx-auto flex flex-col items-center max-w-2xl">
          <p className="text-lg text-gray-600 mb-4 cursor-pointer" onClick={handleReset}>Upload a new image</p>
          <Image
            width={1024}
            height={768}
            src={ingredientUrl}
            alt="Menu"
            className="w-40 rounded-lg shadow-md"
          />
        </div>
      )}
```

Replace with:

```tsx
      {ingredientUrl && (
        <div className="mx-auto my-10 flex max-w-2xl flex-col items-center">
          <button
            onClick={handleReset}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-muted"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Upload a new image
          </button>
          <Image
            width={1024}
            height={768}
            src={ingredientUrl}
            alt="Scanned ingredient label"
            className="w-40 rounded-2xl border border-hairline shadow-sm"
          />
        </div>
      )}
```

- [ ] **Step 4: Add the `ArrowUpTrayIcon` import**

Find:

```tsx
import { CameraIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
```

Replace with:

```tsx
import {
  CameraIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/20/solid";
```

- [ ] **Step 5: Recolor the uploading + parsing spinners and copy**

In both the `{status === "uploading" && (` and `{status === "parsing" && (` blocks, replace each spinner element:

```tsx
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
```

with:

```tsx
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-t-accent" />
```

And replace each `text-lg text-gray-600` on the status `<p>` with `text-lg text-muted`. Replace the skeleton `bg-gray-200` classes with `bg-gray-100` in both blocks.

- [ ] **Step 6: Restyle the error state**

Find:

```tsx
      {status === "error" && (
        <div className="mt-10 flex flex-col items-center max-w-2xl mx-auto space-y-4">
          <p className="text-lg text-red-600">
            Oops! Something went wrong. Please try again.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      )}
```

Replace with:

```tsx
      {status === "error" && (
        <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-hairline bg-surface p-8 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          </span>
          <p className="text-base text-ink">
            Something went wrong reading that image. Please try again.
          </p>
          <button
            onClick={handleReset}
            className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-hover"
          >
            Try again
          </button>
        </div>
      )}
```

- [ ] **Step 7: Add the `ExclamationTriangleIcon` import**

Add this import near the other heroicons import:

```tsx
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
```

- [ ] **Step 8: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Visual check**

Walk all states: initial dropzone (green icon chip, pill copy, reassurance line), example link, uploading/parsing (green spinner), error card. Trigger the error path if convenient (e.g. temporarily break the fetch URL) or at least confirm it compiles and renders in React DevTools.

- [ ] **Step 10: Commit**

```bash
git add app/components/ImageUploader.tsx
git commit -m "feat: restyle upload, loading, error, and thumbnail states"
```

---

### Task 7: Remove the unused MUI dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Confirm MUI is no longer imported**

Run: `grep -rn "@mui\|@emotion" app lib`
Expected: no matches (the only user was `ingredient-grid.tsx`, rewritten in Task 3).

- [ ] **Step 2: Uninstall the packages**

Run:

```bash
npm uninstall @mui/material @emotion/react @emotion/styled
```

> If any of these are not listed in `package.json`, npm will no-op for that name — that is fine. Run `node -e "console.log(Object.keys(require('./package.json').dependencies).filter(d=>d.includes('mui')||d.includes('emotion')))"` to confirm none remain.

- [ ] **Step 3: Verify build still compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused MUI/Emotion dependencies"
```

---

### Task 8: Align header and footer to the token system

**Files:**
- Modify: `app/components/header.tsx`
- Modify: `app/components/footer.tsx`

- [ ] **Step 1: Tidy the header markup and tokens**

In `app/components/header.tsx`, replace the title span and fix the leftover unbalanced markup. Find:

```tsx
            <span className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              What&apos;s in my{" "}
              <span>food</span>?
            </span>
          </Link>
```

Replace with:

```tsx
            <span className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              What&apos;s in my food?
            </span>
          </Link>
```

The commented-out Clerk block and its stray closing tags can stay (they are inert comments), but ensure the file still ends with the two closing `</div>` and `</header>`. No other change needed — the existing `backdrop-blur` glass header already fits the design.

- [ ] **Step 2: Align the footer to muted tokens**

In `app/components/footer.tsx`, replace `border-gray-200` with `border-hairline`, and replace each `text-gray-500` / `text-gray-600` with `text-muted`. Replace `hover:text-gray-800` with `hover:text-ink`.

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/components/header.tsx app/components/footer.tsx
git commit -m "feat: align header and footer to design tokens"
```

---

### Task 9: Landing-page accent pass (blue → green)

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/components/HeroSection.tsx`
- Modify: `app/components/SignUpButton.tsx`
- Modify: `app/components/HowItWorks.tsx`
- Modify: `app/components/WhyItMatters.tsx`

Apply this **blue → green mapping** to brand-accent utilities (do NOT touch any NOVA-scale colors, which live only in `lib/nova.ts`, `ResultSummary.tsx`, and `ingredient-grid.tsx`):

| Blue utility | Green replacement |
|---|---|
| `text-blue-500` / `text-blue-600` / `text-blue-700` | `text-accent-fg` |
| `bg-blue-500` | `bg-accent` |
| `hover:bg-blue-600` | `hover:bg-accent-hover` |
| `border-blue-100` / `border-blue-200` / `hover:border-blue-300` | `border-[#34c759]/20` / `hover:border-[#34c759]/40` |
| `bg-blue-50` / `bg-blue-50/70` | `bg-[#34c759]/10` |
| `bg-blue-300/25` / `bg-blue-300/30` / `bg-blue-200/40` | `bg-[#34c759]/20` |
| `bg-blue-400` | `bg-accent` |
| `from-blue-600 to-sky-500` (gradient text) | `from-[#1a8f3c] to-[#34c759]` |
| `from-blue-50 to-sky-50` (CTA panel) | `from-[#34c759]/8 to-[#34c759]/4` |
| `focus-visible:ring-blue-500` | `focus-visible:ring-[#34c759]` |
| `shadow-blue-900/10` / `shadow-blue-900/20` | leave as-is (neutral shadow tint) |

- [ ] **Step 1: Update `app/components/HeroSection.tsx`**

Apply the mapping to: the `CheckIcon` `text-blue-500` → `text-accent-fg`; the eyebrow badge (`border-blue-200` → `border-[#34c759]/40`, `bg-blue-50/70` → `bg-[#34c759]/10`, `text-blue-700` → `text-accent-fg`, ping `bg-blue-400` → `bg-accent`, dot `bg-blue-500` → `bg-accent`); the glow `bg-blue-300/25` → `bg-[#34c759]/20`; the headline gradient `from-blue-600 to-sky-500` → `from-[#1a8f3c] to-[#34c759]`; the "See how it works" link `hover:border-blue-300` → `hover:border-[#34c759]/40` and `hover:text-blue-700` → `hover:text-accent-fg`; the product glow `bg-blue-200/40` → `bg-[#34c759]/20`. Also change `text-zinc-900` headline → `text-ink` and `text-zinc-500` subhead → `text-muted` for token consistency.

- [ ] **Step 2: Update `app/components/SignUpButton.tsx`**

Keep the dark `bg-zinc-900` button (on-brand neutral), but change `focus-visible:ring-blue-500` → `focus-visible:ring-[#34c759]`.

- [ ] **Step 3: Update `app/page.tsx`**

In the CTA `<section>`: `border-blue-100` → `border-[#34c759]/20`, `from-blue-50 to-sky-50` → `from-[#34c759]/8 to-[#34c759]/4`, and the blur `bg-blue-300/30` → `bg-[#34c759]/20`. Change `text-zinc-900`/`text-zinc-600` to `text-ink`/`text-muted`.

- [ ] **Step 4: Update `HowItWorks.tsx` and `WhyItMatters.tsx`**

Open each file, find every blue brand-accent utility, and apply the mapping table above. (These were not pre-read; read each file first, then swap only blue brand-accent classes — leave layout, spacing, and any non-blue colors unchanged.)

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Visual check**

Run `npm run dev`, open `/`. The hero badge, gradient headline, check icons, CTA panel, and links should now read green; layout unchanged. Confirm no blue brand accents remain (`grep -rn "blue-" app/components/HeroSection.tsx app/components/HowItWorks.tsx app/components/WhyItMatters.tsx app/page.tsx` should only show intentional leftovers, if any).

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/components/HeroSection.tsx app/components/SignUpButton.tsx app/components/HowItWorks.tsx app/components/WhyItMatters.tsx
git commit -m "feat: switch landing accent from blue to green"
```

---

### Task 10: Final full-build verification

- [ ] **Step 1: Production build**

Run: `npm run build`
Expected: build completes with no type or compile errors.

- [ ] **Step 2: End-to-end manual pass**

Run `npm run dev`:
- `/dashboard` → initial dropzone, example link, "Free · No sign-up".
- Click "Try an example image" → uploading → parsing (green spinners) → results.
- Verdict banner (white card, colored edge), pill search with green focus ring, Filter popover.
- Grouped sections (Ultra-processed → Natural) with colored dots, card hover lift, NOVA tooltip on hover/focus.
- Search + filter still narrow results.
- `/` → green accents throughout, layout intact.

- [ ] **Step 3: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore: final redesign verification fixes"
```

(Skip if the working tree is clean.)
