# Barcode scan with photo fallback — design

**Date:** 2026-06-16
**Status:** Approved (pending spec review)

## Goal

Let a user scan a food product's **barcode** as the primary, faster way to get an
ingredient breakdown, while keeping the existing **photo → Gemini** flow as a
reliable fallback. Barcode lookups use **Open Food Facts** (free, no API key).

Because Open Food Facts coverage is incomplete (crowdsourced) and does **not**
provide the app's per-ingredient breakdown, a barcode hit yields only the raw
ingredient **text**, which we run through the existing Gemini pipeline to produce
the same `IngredientItem[]` output (per-ingredient `description`,
`nova_classification`, `reason`). The photo flow remains the robust floor.

## Decisions (locked in during brainstorming)

1. **Entry UX:** Barcode-first. Primary "Scan barcode" action; on a miss the app
   auto-switches to the existing photo flow. Photo remains reachable manually.
2. **Data mapping on a hit:** Send Open Food Facts' `ingredients_text` through the
   existing Gemini pipeline (text input instead of image). Identical output quality.
   Still an AI call, but faster/cheaper/more reliable than OCR on a photo.
3. **OFF lookup location:** Client-side direct browser → Open Food Facts (CORS
   supported). May be proxied through a server route later if OFF throttles.

## Architecture

```
Dashboard "Scan barcode" (primary)
        │
        ▼
  BarcodeScanner (live camera, continuous EAN detection)
        │ emits EAN string
        ▼
  OFF lookup  ──hit + ingredients_text──►  POST /api/parseIngredient  ──► grid
        │                                   (now accepts TEXT or image)
        │ miss / no ingredient text / network error
        ▼
  Auto-switch → existing photo → Gemini flow (camera capture)
```

Both paths converge on the same API response shape
(`{ success, ingredient: IngredientItem[], language }`) and the same
`IngredientGrid` rendering. The Gemini system prompt is unchanged.

## Components

### New: `app/components/BarcodeScanner.tsx`

A modal mirroring `CameraModal`'s structure (fixed overlay, `environment`
`getUserMedia` stream, Escape-to-close, camera-permission error state), but
instead of capture-on-click it runs **continuous barcode detection** on the live
stream and fires `onDetect(ean)` the instant it reads a valid EAN-8/EAN-13.

- Library: **`@zxing/library`** (`BrowserMultiFormatReader`). One small dependency,
  works across all browsers including Safari, no API key. (The native
  `BarcodeDetector` API is not available in Safari, so it is not relied upon.)
- Props: `onDetect(ean: string)`, `onClose()`, `onUsePhotoInstead()`.
- UI: live video with a framing guide, a "Take a photo instead" button routing to
  the photo flow, and the shared close button.
- Cleanup: stop all media tracks and reset the zxing reader on unmount.

### New: `lib/openfoodfacts.ts`

```ts
export interface OffLookupResult {
  found: boolean;
  ingredientsText?: string;
  language?: string; // ISO 639-1, best-effort from OFF lang fields
}

export async function lookupProduct(ean: string): Promise<OffLookupResult>;
```

- Endpoint: `https://world.openfoodfacts.org/api/v2/product/${ean}.json`
  with a `fields` query limiting payload to:
  `code,status,product_name,ingredients_text,lang`.
- **Usable hit** = HTTP ok **and** response `status === 1` **and** a non-empty,
  trimmed `ingredients_text`. Anything else (status 0, missing/empty text,
  non-ok HTTP) returns `{ found: false }`.
- **Network/parse error:** caught and returned as `{ found: false }` (fail-open →
  photo fallback), mirroring the rate-limiter's fail-open philosophy.
- `language` derived from OFF's `lang` field when present; otherwise omitted and
  the API/model falls back to its own detection.

### Changed: `app/api/parseIngredient/route.ts`

Accept **either** an image (today's behavior, unchanged) **or** an ingredient-text
string:

- Read `formData`. If `image instanceof File`, behave exactly as today.
- Else if a non-empty `text` field is present, build the Gemini request as
  `[{ text: systemPrompt }, { text: ingredientText }]` (no base64), using the same
  model, `responseSchema`, and response shape.
- If neither is present, return `400`.
- The system prompt is generic enough for text input ("extract ingredients from
  an image" wording is tolerated by the model on text); if needed, a minimal
  conditional preamble can note the input is already-extracted text. Keep the same
  schema and post-processing.
- **Rate limiting unchanged:** the IP check runs first for both paths, so the text
  path shares the existing 15/IP/24h Upstash window and `429` handling.

### Changed: `app/components/ImageUploader.tsx`

- Extend the status union with `"scanningBarcode"` (scanner open) and
  `"lookingUp"` (OFF request in flight). Existing statuses unchanged.
- Add a **primary "Scan barcode"** entry on the `initial` screen; keep "Scan your
  ingredient list" (photo) reachable as the secondary action, plus the existing
  example-image link.
- `handleBarcode(ean)`:
  1. `setStatus("lookingUp")`.
  2. `lookupProduct(ean)`.
  3. On usable hit: POST `text` to `/api/parseIngredient`, then reuse the existing
     parse/normalize/`created` handling (including `429 → rateLimited`).
  4. On miss/error: show a brief "Couldn't find that product — scan the ingredient
     list instead" and auto-open the photo camera (`setShowCamera(true)` / photo
     flow).
- The existing `handleFileChange` (photo path) is unchanged.

## Error handling summary

| Situation | Behavior |
|---|---|
| Barcode read OK, OFF usable hit | Text → Gemini → grid |
| OFF product not found / no ingredient text | Message + auto-switch to photo flow |
| OFF network/parse error | Treated as miss → photo flow (fail-open) |
| Gemini text call rate-limited | `429 → rateLimited` state (shared with photo path) |
| Camera permission denied in scanner | Permission error state + close (as CameraModal) |
| User can't get a read / gives up | "Take a photo instead" button → photo flow |

## Out of scope (YAGNI)

- Server-side OFF proxy / custom User-Agent (revisit only if OFF throttles).
- Caching OFF lookups.
- Writing missing products back to Open Food Facts.
- Manual barcode entry by typing digits.
- Nutri-Score / nutrition facts display (this app is about ingredients + NOVA).

## Verification

No test framework is configured, and `npm run lint` is known-broken under Next 16.
Verify with:

- `npx tsc --noEmit`
- `npm run build`
- Manual: scan a well-covered product (hit → grid), scan an obscure/own-brand
  product (miss → photo fallback), deny camera permission (error state).
