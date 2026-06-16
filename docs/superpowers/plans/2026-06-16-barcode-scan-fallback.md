# Barcode Scan with Photo Fallback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a barcode-first scan flow that looks products up in Open Food Facts and runs the returned ingredient text through the existing Gemini pipeline, falling back to the existing photo flow on any miss.

**Architecture:** A new live barcode-scanner modal emits an EAN; a client-side Open Food Facts lookup returns the raw ingredient text; that text is POSTed to an extended `/api/parseIngredient` route (which now accepts text *or* an image) and renders through the existing `IngredientGrid`. Any miss (not found, no ingredient text, network error) auto-switches to the existing photo→Gemini flow.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@google/generative-ai`, `@zxing/browser` + `@zxing/library` (barcode reading), Open Food Facts API v2.

## Global Constraints

- **No test framework** is configured and `npm run lint` is broken under Next 16. Per-task verification is `npx tsc --noEmit` and `npm run build` (plus the live/manual checks each task specifies). Never rely on `npm run lint`.
- **Path alias:** `@/*` maps to the repo root (e.g. `@/lib/...`, `@/app/components/...`).
- **Conditional classes:** use the `cn()` helper from `@/lib/utils`. For tinted backgrounds use literal hex with opacity (e.g. `bg-[#34c759]/10`), never `bg-accent/10`.
- **API response shape is fixed:** `/api/parseIngredient` must keep returning `{ success, ingredient: IngredientItem[], language }`. `IngredientItem` = `{ name: string; description: string; nova_classification: number; reason: string }`.
- **Images are never persisted.** The barcode path sends no image at all.
- **Commit message trailer:** end every commit body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. If the shell mangles `<...>` in `-m`, write the message to a temp file and use `git commit -F`.

---

### Task 1: Open Food Facts lookup helper

**Files:**
- Create: `lib/openfoodfacts.ts`

**Interfaces:**
- Consumes: nothing (leaf module, browser `fetch`).
- Produces:
  - `interface OffLookupResult { found: boolean; ingredientsText?: string; language?: string }`
  - `async function lookupProduct(ean: string): Promise<OffLookupResult>`

- [ ] **Step 1: Create the lookup module**

Create `lib/openfoodfacts.ts`:

```ts
// Client-side lookup against Open Food Facts API v2. Free, no API key, CORS-enabled.
// A "usable hit" requires status === 1 AND a non-empty ingredients_text — everything
// else (not found, missing text, network/parse error) returns { found: false } so the
// caller can fall back to the photo flow. Fail-open mirrors the rate limiter.

export interface OffLookupResult {
  found: boolean;
  ingredientsText?: string;
  language?: string; // ISO 639-1, best-effort from OFF's `lang` field
}

const OFF_PRODUCT_ENDPOINT = "https://world.openfoodfacts.org/api/v2/product";
const OFF_FIELDS = "code,status,product_name,ingredients_text,lang";

export async function lookupProduct(ean: string): Promise<OffLookupResult> {
  try {
    const url = `${OFF_PRODUCT_ENDPOINT}/${encodeURIComponent(ean)}.json?fields=${OFF_FIELDS}`;
    const res = await fetch(url);
    if (!res.ok) return { found: false };

    const data = await res.json();
    if (data?.status !== 1) return { found: false };

    const rawText = data?.product?.ingredients_text;
    const ingredientsText =
      typeof rawText === "string" ? rawText.trim() : "";
    if (!ingredientsText) return { found: false };

    const rawLang = data?.product?.lang;
    const language =
      typeof rawLang === "string" && rawLang.length > 0 ? rawLang : undefined;

    return { found: true, ingredientsText, language };
  } catch {
    return { found: false };
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify the live API contract against a known product**

This confirms the OFF endpoint, field selection, and `status`/`ingredients_text` shape the code depends on. Nutella's barcode (`3017620422003`) is well-covered.

Run:
```bash
node -e "fetch('https://world.openfoodfacts.org/api/v2/product/3017620422003.json?fields=code,status,product_name,ingredients_text,lang').then(r=>r.json()).then(d=>console.log('status:',d.status,'| hasText:',Boolean(d.product&&d.product.ingredients_text&&d.product.ingredients_text.trim()),'| lang:',d.product&&d.product.lang))"
```
Expected: `status: 1 | hasText: true | lang: <some code>`

Then confirm a miss path with a nonsense barcode:
```bash
node -e "fetch('https://world.openfoodfacts.org/api/v2/product/0000000000000.json?fields=code,status,product_name,ingredients_text,lang').then(r=>r.json()).then(d=>console.log('status:',d.status))"
```
Expected: `status: 0`

- [ ] **Step 4: Commit**

```bash
git add lib/openfoodfacts.ts
git commit -F <tmp-msg-file>   # body: "feat: add Open Food Facts barcode lookup helper" + Co-Authored-By trailer
```

---

### Task 2: Accept ingredient text in the parse API route

**Files:**
- Modify: `app/api/parseIngredient/route.ts`

**Interfaces:**
- Consumes: existing `checkRateLimit`, `genAI`, `schema`, `systemPrompt`.
- Produces: same HTTP contract `{ success, ingredient, language }`; route now accepts a `text` form field as an alternative to `image`.

- [ ] **Step 1: Branch the request body between image and text**

In `app/api/parseIngredient/route.ts`, the rate-limit block stays first and unchanged. Replace the current image-reading block (the `const formData = await request.formData();` through the `image instanceof File` 400 guard) and the later "Convert the uploaded image to base64" + `model.generateContent([...])` section with input-type branching.

Replace this existing block:

```ts
  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "No image provided" },
      { status: 400 },
    );
  }
```

with:

```ts
  const formData = await request.formData();
  const image = formData.get("image");
  const textInput = formData.get("text");
  const ingredientText =
    typeof textInput === "string" ? textInput.trim() : "";

  const hasImage = image instanceof File;
  const hasText = ingredientText.length > 0;

  if (!hasImage && !hasText) {
    return NextResponse.json(
      { error: "No image or text provided" },
      { status: 400 },
    );
  }
```

- [ ] **Step 2: Build the Gemini request from whichever input is present**

Replace this existing block:

```ts
  // Convert the uploaded image to base64
  const imageData = await image.arrayBuffer();
  const base64Image = Buffer.from(imageData).toString("base64");

  // Api request to the model
  const result = await model.generateContent([
    { text: systemPrompt },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image
      }
    }
  ]);
```

with:

```ts
  // The prompt is written for image input; for already-extracted text we prepend a
  // one-line note so the model treats the text as the ingredient list verbatim.
  const textPreamble =
    "The following is the already-extracted ingredient list text from a product label. " +
    "Treat it as the ingredient source (no image is provided):\n\n";

  const parts = hasImage
    ? [
        { text: systemPrompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: Buffer.from(await (image as File).arrayBuffer()).toString("base64"),
          },
        },
      ]
    : [{ text: systemPrompt }, { text: textPreamble + ingredientText }];

  // Api request to the model
  const result = await model.generateContent(parts);
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If TS narrows `image` poorly, the `image as File` cast in Step 2 keeps it sound; `hasImage` guarantees it at runtime.)

- [ ] **Step 4: Verify both paths against the running route**

Start the dev server in one shell: `npm run dev` (needs `GOOGLE_API_KEY` in `.env.local`).

Text path:
```bash
curl -s -X POST http://localhost:3000/api/parseIngredient \
  -F 'text=Sukker, palmeolie, hasselnødder, fedtfattig kakao, emulgator (sojalecithin E322), vanillin' \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('success:',j.success,'| count:',Array.isArray(j.ingredient)&&j.ingredient.length,'| language:',j.language)})"
```
Expected: `success: true | count: <>=4> | language: da` (E322 should appear as its own entry).

Missing-input path:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/parseIngredient
```
Expected: `400`

- [ ] **Step 5: Commit**

```bash
git add app/api/parseIngredient/route.ts
git commit -F <tmp-msg-file>   # body: "feat: accept ingredient text input in parse route" + trailer
```

---

### Task 3: Live barcode scanner modal

**Files:**
- Create: `app/components/BarcodeScanner.tsx`
- Modify: `package.json` (add `@zxing/browser`, `@zxing/library`)

**Interfaces:**
- Consumes: nothing from prior tasks.
- Produces: default-exported React component
  `BarcodeScanner({ onDetect, onClose, onUsePhotoInstead }: { onDetect: (ean: string) => void; onClose: () => void; onUsePhotoInstead: () => void })`.

- [ ] **Step 1: Install the barcode-reading dependencies**

Run:
```bash
npm install @zxing/browser@^0.1.5 @zxing/library@^0.21.3
```
Expected: both added to `package.json` dependencies; lockfile updated.

- [ ] **Step 2: Create the scanner component**

Create `app/components/BarcodeScanner.tsx`. It mirrors `CameraModal`'s overlay/permission/Escape patterns but runs continuous EAN detection instead of capture-on-click.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, CameraIcon } from "@heroicons/react/24/solid";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  DecodeHintType,
  BarcodeFormat,
  type Result,
} from "@zxing/library";

interface BarcodeScannerProps {
  onDetect: (ean: string) => void;
  onClose: () => void;
  onUsePhotoInstead: () => void;
}

// Limit to retail food barcodes for faster, more reliable reads.
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]);

export default function BarcodeScanner({
  onDetect,
  onClose,
  onUsePhotoInstead,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectedRef = useRef(false); // guard against double-firing onDetect
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints);
    let stopped = false;
    let controls: { stop: () => void } | undefined;

    const start = async () => {
      try {
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          (result: Result | undefined) => {
            if (result && !detectedRef.current) {
              detectedRef.current = true;
              controls?.stop();
              onDetect(result.getText());
            }
          },
        );
        if (stopped) controls.stop();
      } catch {
        if (!stopped) {
          setError(
            "Could not access the camera. Please grant permission and try again.",
          );
        }
      }
    };

    start();

    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onDetect]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Scan product barcode"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black shadow-xl"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <p className="text-base text-white">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-white px-4 py-2 font-medium text-gray-900 transition hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[3/4] w-full bg-black object-cover sm:aspect-video"
              />
              {/* Framing guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-3/4 rounded-lg border-2 border-white/80" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 bg-black px-4 py-5 text-center">
              <p className="text-sm text-white/80">
                Point the camera at the product barcode
              </p>
              <button
                onClick={onUsePhotoInstead}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <CameraIcon className="h-5 w-5" />
                Take a photo instead
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds (the component compiles and tree-shakes the zxing deps).

- [ ] **Step 4: Commit**

```bash
git add app/components/BarcodeScanner.tsx package.json package-lock.json
git commit -F <tmp-msg-file>   # body: "feat: add live barcode scanner modal" + trailer
```

---

### Task 4: Wire barcode flow into ImageUploader

**Files:**
- Modify: `app/components/ImageUploader.tsx`

**Interfaces:**
- Consumes: `lookupProduct` / `OffLookupResult` (Task 1), text input on `/api/parseIngredient` (Task 2), `BarcodeScanner` (Task 3).
- Produces: end-user flow; no further consumers.

- [ ] **Step 1: Add imports and new state**

In `app/components/ImageUploader.tsx`, add imports near the existing component imports:

```tsx
import BarcodeScanner from "./BarcodeScanner";
import { lookupProduct } from "@/lib/openfoodfacts";
```

Extend the status union and add scanner/notice state. Replace:

```tsx
  const [status, setStatus] = useState<
    "initial" | "uploading" | "parsing" | "created" | "error" | "rateLimited"
  >("initial");
```

with:

```tsx
  const [status, setStatus] = useState<
    | "initial"
    | "lookingUp"
    | "uploading"
    | "parsing"
    | "created"
    | "error"
    | "rateLimited"
  >("initial");
  const [showScanner, setShowScanner] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
```

The scanner is a modal overlay mounted inside the `status === "initial"` block (same as `CameraModal`), so opening it must keep `status` at `"initial"` and only toggle `showScanner` — exactly how the photo camera already works. There is intentionally no `"scanningBarcode"` status.

- [ ] **Step 2: Reset the new state in handleReset**

In `handleReset`, add the two new resets alongside the existing ones (after `setShowCamera(false);`):

```tsx
    setShowScanner(false);
    setNotice(null);
```

- [ ] **Step 3: Extract a shared response handler and add the barcode handler**

Refactor the response-handling tail of `handleFileChange` into a reusable function so both paths share `429`/normalize logic. Add this function above `handleFileChange`:

```tsx
  // Shared handling for /api/parseIngredient responses (image and text paths).
  const applyParseResponse = async (res: Response) => {
    if (res.status === 429) {
      setStatus("rateLimited");
      return;
    }
    if (!res.ok) {
      throw new Error("Failed to parse ingredient");
    }
    const json = await res.json();
    if (!json.ingredient || !Array.isArray(json.ingredient)) {
      throw new Error(
        "Unexpected response structure: 'ingredient' is not an array",
      );
    }
    setStatus("created");
    setLanguage(typeof json.language === "string" ? json.language : "en");
    const normalizedIngredients = json.ingredient.map(
      (item: IngredientItem) => ({
        ...item,
        nova_classification: Number(item.nova_classification),
      }),
    );
    setParsedIngredient(normalizedIngredients);
  };
```

Then in `handleFileChange`, replace everything from `if (res.status === 429) {` through `setParsedIngredient(normalizedIngredients);` (inside the `try`) with:

```tsx
      await applyParseResponse(res);
```

- [ ] **Step 4: Add handleBarcode**

Add below `handleFileChange`:

```tsx
  const handleBarcode = async (ean: string) => {
    setShowScanner(false);
    setNotice(null);
    setStatus("lookingUp");
    try {
      const result = await lookupProduct(ean);
      if (!result.found || !result.ingredientsText) {
        // Miss: no dead end — drop to the photo flow.
        setStatus("initial");
        setNotice(
          "Couldn't find that product. Scan the ingredient list instead.",
        );
        setShowCamera(true);
        return;
      }

      setStatus("parsing");
      const formData = new FormData();
      formData.append("text", result.ingredientsText);
      const res = await fetch("/api/parseIngredient", {
        method: "POST",
        body: formData,
      });
      await applyParseResponse(res);
    } catch (error) {
      console.error("Error looking up barcode:", error);
      setStatus("error");
    }
  };
```

- [ ] **Step 5: Make the initial screen barcode-first and mount the scanner**

In the `status === "initial"` block, replace the existing primary photo button + helper links section so "Scan barcode" is primary and the photo button is secondary, and surface the `notice`. Replace this existing markup:

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

with:

```tsx
        <div className="mx-auto max-w-xl">
          {notice && (
            <p className="mb-4 rounded-lg bg-[#34c759]/10 px-4 py-3 text-sm text-ink">
              {notice}
            </p>
          )}
          <Fade direction="up" delay={300}>
            <button
              onClick={() => {
                setNotice(null);
                setShowScanner(true);
              }}
              className="group mt-2 flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-hairline-strong bg-surface transition hover:border-accent"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#34c759]/10 transition group-hover:bg-[#34c759]/15">
                <CameraIcon className="h-7 w-7 text-accent" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xl font-semibold tracking-tight text-ink">
                Scan a barcode
              </p>
              <p className="mt-1 text-sm text-muted">
                Fastest way — we look it up instantly
              </p>
            </button>
          </Fade>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Fade direction="up" delay={400}>
              <button
                onClick={() => setShowCamera(true)}
                className="text-sm font-semibold text-accent-fg transition hover:underline"
              >
                No barcode? Scan the ingredient list →
              </button>
            </Fade>
            <button
              onClick={handleExampleImage}
              className="text-sm font-semibold text-accent-fg transition hover:underline"
            >
              Need an example image? Try here →
            </button>
            <p className="text-xs text-muted">Free · No sign-up needed</p>
          </div>
        </div>
```

Then, immediately after the existing `<AnimatePresence>...{showCamera && (<CameraModal .../>)}...</AnimatePresence>` block, add a second AnimatePresence for the scanner:

```tsx
          <AnimatePresence>
            {showScanner && (
              <BarcodeScanner
                onDetect={handleBarcode}
                onClose={() => setShowScanner(false)}
                onUsePhotoInstead={() => {
                  setShowScanner(false);
                  setShowCamera(true);
                }}
              />
            )}
          </AnimatePresence>
```

- [ ] **Step 6: Add a "lookingUp" status view**

Add a new status block next to the existing `status === "uploading"` block (it reuses the same spinner pattern):

```tsx
      {status === "lookingUp" && (
        <div className="mt-10 flex flex-col items-center max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-t-accent" />
            <p className="text-lg text-muted">Looking up the product...</p>
          </div>
        </div>
      )}
```

- [ ] **Step 7: Show a reset button for barcode results (no image thumbnail)**

The current "Upload a new image" reset only renders inside the `ingredientUrl` block, so barcode results (no image) would have no reset. Add a reset affordance to the results header. In the `parsedIngredient.length > 0` block, replace:

```tsx
          <h2 className="mb-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Found {parsedIngredient.length} ingredients
          </h2>
```

with:

```tsx
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Found {parsedIngredient.length} ingredients
            </h2>
            {!ingredientUrl && (
              <button
                onClick={handleReset}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-muted"
              >
                Scan again
              </button>
            )}
          </div>
```

- [ ] **Step 8: Type-check and build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 9: Manual end-to-end verification**

Run `npm run dev` and on `/dashboard` (the page that renders `ImageUploader`):
1. Click **Scan a barcode**, allow camera, point at a well-covered product (e.g. a Nutella jar / barcode `3017620422003` on screen) → expect the spinner ("Looking up…/Processing…") then the ingredient grid, no image thumbnail, "Scan again" present.
2. Scan an obscure/own-brand product not in OFF → expect the notice "Couldn't find that product…" and the photo camera opening automatically.
3. In the scanner, click **Take a photo instead** → photo camera opens.
4. Run the existing photo flow end-to-end → still works unchanged.

- [ ] **Step 10: Commit**

```bash
git add app/components/ImageUploader.tsx
git commit -F <tmp-msg-file>   # body: "feat: barcode-first scan flow with photo fallback" + trailer
```

---

## Notes for the implementer

- **Commit trailer / shell quoting:** `git commit -m` with the `<noreply@anthropic.com>` trailer can break under zsh (`unmatched` error). Write the message to a temp file and `git commit -F /tmp/msg.txt`, then delete it.
- **`@zxing/browser` version:** if `^0.1.5` is unavailable, install the latest `0.x` (`npm install @zxing/browser @zxing/library`) — the `BrowserMultiFormatReader` + `decodeFromConstraints(constraints, video, callback) => Promise<controls>` API is stable across `0.1.x`.
- **`decodeFromConstraints` callback signature:** the real callback is `(result, error, controls)`; the plan only uses `result` and the outer `controls`. Both are equivalent for stopping; using the outer `controls` keeps cleanup in one place.
- **Camera permission:** barcode scanning needs HTTPS or `localhost`. `npm run dev` on `localhost` is fine; testing from a phone needs a tunnel (e.g. the LAN IP won't have camera permission without HTTPS).
```
