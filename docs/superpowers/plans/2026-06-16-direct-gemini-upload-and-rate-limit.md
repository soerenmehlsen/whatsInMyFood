# Direct-to-Gemini Upload & Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send ingredient images browser → API route → Gemini without persisting them, compress images client-side, and rate-limit the parse endpoint per IP via Upstash.

**Architecture:** The client compresses/re-encodes the image to JPEG on a canvas, then POSTs it as multipart form-data. The API route checks an Upstash sliding-window rate limit by IP, reads the file from form-data, base64-encodes it, and sends it to Gemini. Supabase is removed from the parse flow entirely.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@upstash/ratelimit` + `@upstash/redis`, `@google/generative-ai`, browser Canvas API.

**Testing note:** This repo has no test framework and `npm run lint` is broken under Next 16. Verification uses `npx tsc --noEmit` per task and `npm run build` at the end, plus manual checks where noted. Do not introduce a test runner.

---

### Task 1: Install Upstash dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install**

Run:
```bash
npm install @upstash/ratelimit @upstash/redis
```
Expected: both packages appear under `dependencies` in `package.json`, install exits 0.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add upstash ratelimit + redis deps"
```

---

### Task 2: Client-side image compression util

**Files:**
- Create: `lib/image.ts`

- [ ] **Step 1: Create `lib/image.ts`**

```ts
// Client-side image compression: scales the longest edge down to `maxEdge`
// and re-encodes as JPEG. Re-encoding also normalizes HEIC/PNG to JPEG.
export async function compressImage(
  file: File,
  maxEdge = 1600,
  quality = 0.8,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas 2D context");
    }
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) {
      throw new Error("Failed to encode image");
    }
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to `lib/image.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/image.ts
git commit -m "feat: add client-side image compression util"
```

---

### Task 3: Upstash rate-limit helper

**Files:**
- Create: `lib/rate-limit.ts`

- [ ] **Step 1: Create `lib/rate-limit.ts`**

```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const REQUESTS_PER_DAY = 15;

let ratelimit: Ratelimit | null = null;
let warned = false;

function getRatelimit(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warned) {
      console.warn(
        "[rate-limit] Upstash env vars missing; rate limiting disabled.",
      );
      warned = true;
    }
    return null;
  }
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(REQUESTS_PER_DAY, "24 h"),
      prefix: "parseIngredient",
    });
  }
  return ratelimit;
}

// Returns { success: true } when the request is allowed. When Upstash is not
// configured (e.g. local dev), requests are allowed and a warning is logged.
export async function checkRateLimit(
  identifier: string,
): Promise<{ success: boolean }> {
  const rl = getRatelimit();
  if (!rl) {
    return { success: true };
  }
  const { success } = await rl.limit(identifier);
  return { success };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to `lib/rate-limit.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/rate-limit.ts
git commit -m "feat: add upstash-backed rate limit helper"
```

---

### Task 4: Switch API route to multipart + rate limiting

**Files:**
- Modify: `app/api/parseIngredient/route.ts`

- [ ] **Step 1: Add the rate-limit import**

At the top of the file, add below the existing imports:

```ts
import { checkRateLimit } from "@/lib/rate-limit";
```

- [ ] **Step 2: Replace the request parsing + image fetch block**

Replace this current block (lines ~46-100, from `const { ingredientUrl } = await request.json();` through the base64 conversion of the fetched image):

```ts
  const { ingredientUrl } = await request.json();

  console.log({ ingredientUrl });

  if (!ingredientUrl) {
    return NextResponse.json(
      { error: "No ingredient URL provided" },
      { status: 400 },
    );
  }
```

with rate limiting + form-data parsing:

```ts
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";
  const { success: allowed } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "No image provided" },
      { status: 400 },
    );
  }
```

- [ ] **Step 3: Remove the remote image fetch, keep base64 from the uploaded file**

Find and DELETE this block (the URL fetch — it is no longer needed):

```ts
  // Fetch the image data from the provided URL
  const imageResponse = await fetch(ingredientUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
  }
  
  const imageData = await imageResponse.arrayBuffer();

  // Convert the image data to base64
  const base64Image = Buffer.from(imageData).toString('base64');
```

Replace it with reading the uploaded file directly:

```ts
  // Convert the uploaded image to base64
  const imageData = await image.arrayBuffer();
  const base64Image = Buffer.from(imageData).toString("base64");
```

Leave the `model.generateContent([...])` call and everything after it unchanged. The `mimeType: "image/jpeg"` is now always correct because the client sends JPEG.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (No remaining references to `ingredientUrl` in this file — confirm with `grep -n ingredientUrl app/api/parseIngredient/route.ts`, expect no output.)

- [ ] **Step 5: Commit**

```bash
git add app/api/parseIngredient/route.ts
git commit -m "feat: parse endpoint accepts multipart upload + rate limits by IP"
```

---

### Task 5: Update ImageUploader for compression, multipart, blob preview & 429

**Files:**
- Modify: `app/components/ImageUploader.tsx`

- [ ] **Step 1: Swap the import**

Replace:

```ts
import { uploadImageToSupabase } from "@/lib/supabase";
```

with:

```ts
import { compressImage } from "@/lib/image";
```

- [ ] **Step 2: Add `rateLimited` to the status union**

Replace:

```ts
  const [status, setStatus] = useState<
    "initial" | "uploading" | "parsing" | "created" | "error"
  >("initial");
```

with:

```ts
  const [status, setStatus] = useState<
    "initial" | "uploading" | "parsing" | "created" | "error" | "rateLimited"
  >("initial");
```

- [ ] **Step 3: Revoke the blob URL on reset**

Replace the start of `handleReset`:

```ts
   const handleReset = () => {
    setStatus("initial");
    setIngredientUrl(undefined);
```

with:

```ts
   const handleReset = () => {
    if (ingredientUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(ingredientUrl);
    }
    setStatus("initial");
    setIngredientUrl(undefined);
```

- [ ] **Step 4: Rewrite `handleFileChange`**

Replace the whole current `handleFileChange` function (lines ~54-103) with:

```ts
  const handleFileChange = async (file: File) => {
    let objectUrl: string | undefined;
    try {
      objectUrl = URL.createObjectURL(file);
      setStatus("uploading");
      setIngredientUrl(objectUrl);

      const compressed = await compressImage(file);

      setStatus("parsing");
      const formData = new FormData();
      formData.append("image", compressed, "ingredient.jpg");

      const res = await fetch("/api/parseIngredient", {
        method: "POST",
        body: formData,
      });

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
    } catch (error) {
      console.error("Error processing image:", error);
      setStatus("error");
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setIngredientUrl(undefined);
    }
  };
```

Note: on the success and `rateLimited` paths the blob `objectUrl` is intentionally NOT revoked — it stays as the preview and is cleaned up in `handleReset`.

- [ ] **Step 5: Add `unoptimized` to the preview image**

Replace the preview `<Image>` block:

```tsx
          <Image
            width={1024}
            height={768}
            src={ingredientUrl}
            alt="Scanned ingredient label"
            className="w-40 rounded-2xl border border-hairline shadow-sm"
          />
```

with (adds `unoptimized` so `blob:` sources render without the Next optimizer):

```tsx
          <Image
            width={1024}
            height={768}
            src={ingredientUrl}
            alt="Scanned ingredient label"
            unoptimized
            className="w-40 rounded-2xl border border-hairline shadow-sm"
          />
```

- [ ] **Step 6: Add the rate-limited UI block**

Directly after the existing `status === "error"` block (the closing `)}` of that block, around line 245), insert:

```tsx
      {status === "rateLimited" && (
        <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-hairline bg-surface p-8 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#34c759]/10">
            <ExclamationTriangleIcon className="h-6 w-6 text-accent" />
          </span>
          <p className="text-base text-ink">
            Du har nået grænsen for antal scanninger. Prøv igen senere.
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

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. Confirm no lingering Supabase reference: `grep -n "uploadImageToSupabase\|@/lib/supabase" app/components/ImageUploader.tsx` → no output.

- [ ] **Step 8: Commit**

```bash
git add app/components/ImageUploader.tsx
git commit -m "feat: compress + multipart upload, blob preview, rate-limit UI"
```

---

### Task 6: Delete unused Supabase client

**Files:**
- Delete: `lib/supabase.ts`

- [ ] **Step 1: Confirm no remaining importers**

Run: `grep -rln "@/lib/supabase\|uploadImageToSupabase" --include="*.ts" --include="*.tsx" . | grep -v node_modules`
Expected: no output (keepalive constructs its own client and does not import this file).

- [ ] **Step 2: Delete the file**

```bash
git rm lib/supabase.ts
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove unused supabase client from parse flow"
```

---

### Task 7: Document new environment variables

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add Upstash vars to the env section**

In `CLAUDE.md`, under "## Environment variables", add these two lines to the bulleted list (after the PostHog entries):

```markdown
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis for rate limiting `/api/parseIngredient` (`lib/rate-limit.ts`). If unset, rate limiting is disabled (dev fallback).
```

- [ ] **Step 2: Note Supabase no longer used in the parse flow**

In the "### Request flow" section, update the description so it reflects that images are sent directly as multipart form-data to the route and are no longer uploaded to Supabase. Replace step 2's Supabase upload description with: the client compresses the image (`lib/image.ts`) and POSTs it as multipart form-data; Supabase is no longer part of the parse flow (still used only by `/api/keepalive`).

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document upstash env vars and direct upload flow"
```

---

### Task 8: Final verification

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds. (Per project memory, use this rather than `npm run lint`, which is broken under Next 16.)

- [ ] **Step 3: Manual smoke test (optional, needs keys)**

With `GOOGLE_API_KEY` set (and optionally Upstash vars), run `npm run dev`, open the dashboard, scan/upload a photo, and confirm: ingredients render, the preview thumbnail shows, and a large (>4.5MB) phone photo now succeeds. Without Upstash vars, confirm the `[rate-limit] ... disabled` warning appears in the server console and requests still work.
