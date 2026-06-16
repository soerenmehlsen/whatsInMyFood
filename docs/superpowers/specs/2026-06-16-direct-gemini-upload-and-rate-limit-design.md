# Design: Direct-to-Gemini upload, client-side compression & rate limiting

Date: 2026-06-16

## Goal

Harden the ingredient-parsing flow against three problems:

1. **Abuse / cost** — `/api/parseIngredient` is unauthenticated and unthrottled; anyone can loop it and burn the Gemini budget.
2. **Public images forever** — uploads land in a public Supabase bucket and are never deleted.
3. **Wasteful round-trip** — client uploads to Supabase, then the server re-fetches that public URL just to base64-encode it for Gemini.

Decision: stop storing images entirely. The image goes browser → our API route → Gemini, and is never persisted. This collapses problem 2 (no public images exist to leak or clean up) and resolves problem 3. Problem 1 is solved with IP-based rate limiting backed by Upstash Redis.

As a side effect this also fixes the hardcoded `image/jpeg` mimeType bug: the browser re-encodes every image to JPEG before sending.

## Architecture & data flow

1. User selects or captures an image in `app/components/ImageUploader.tsx`.
2. **New util `lib/image.ts`** exposes `compressImage(file: File): Promise<Blob>`:
   - Loads the file into an `Image` via an object URL.
   - Draws onto a `<canvas>`, scaled so the longest edge is at most **1600px** (no upscaling for smaller images).
   - Exports via `canvas.toBlob(..., "image/jpeg", 0.8)`.
   - Revokes the temporary object URL it created internally.
3. ImageUploader sends the compressed JPEG as `multipart/form-data` (a `FormData` with one `image` field) to `POST /api/parseIngredient`. The previous `{ ingredientUrl }` JSON body is removed.
4. `app/api/parseIngredient/route.ts`:
   - **Rate-limit check first.** Derive the client IP from the `x-forwarded-for` header (first entry). Consult Upstash. If the limit is exceeded, return `429` with `{ success: false, error: "rate_limited" }`.
   - Read `formData()`, get the `image` file, convert to base64.
   - Send to Gemini with `mimeType: "image/jpeg"` (now always correct).
   - Return `{ success, ingredient, language }` exactly as today.
5. **Supabase removed from the analysis flow.** `lib/supabase.ts` is deleted (only ImageUploader imported it; the `supabase` named export is unused elsewhere — verified via grep). The keepalive cron (`app/api/keepalive/route.ts`) constructs its own client and is unchanged; the bucket simply stays empty and `list()` still keeps the project warm.

## Image preview

Without a Supabase URL, the preview uses the local `blob:` object URL.

- The object URL is created once from the original file and kept in `ingredientUrl` state.
- It must **not** be revoked after upload (current code revokes it); it is revoked only in `handleReset`.
- `next/image` does not handle `blob:` sources well, so the preview `<Image>` gets the `unoptimized` prop. The source is a small local blob, so optimization is unnecessary.

## Rate limiting

- Dependencies: `@upstash/ratelimit`, `@upstash/redis`.
- Implemented in a small helper (e.g. `lib/rate-limit.ts`) that constructs the Ratelimit lazily and exports a `checkRateLimit(ip)` function.
- Algorithm: sliding window, **15 requests per IP per 24 hours**. Tunable in one place.
- Identifier: client IP from `x-forwarded-for`. If no IP can be determined, fall back to a single shared bucket key (still better than nothing) — abuse from unknown IPs is then collectively throttled.
- **Graceful fallback for local dev:** if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are missing, `checkRateLimit` logs a `console.warn` once and allows the request, so the app runs locally without Upstash.

## Error handling

- Route returns `429` when throttled. The client checks `res.status === 429` and shows a specific message ("Du har nået grænsen — prøv igen senere") rather than the generic error state. Implementation detail: either a new status value or an error-message field on the existing `"error"` state; the existing `"error"` state with a distinct message string is sufficient.
- All other failures keep the current generic error behavior.

## New environment variables

Added to `.env.local` and documented in `CLAUDE.md`:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Explicitly out of scope

Kept out to stay focused on points 1–3:

- Empty-result messaging (distinguishing "no ingredients found" from "couldn't read image").
- Client-side abort/timeout (`AbortController`).
- Removing production `console.log` calls.

## Files touched

- `lib/image.ts` — new: `compressImage`.
- `lib/rate-limit.ts` — new: Upstash-backed `checkRateLimit`.
- `app/api/parseIngredient/route.ts` — accept multipart, rate-limit, fixed mimeType.
- `app/components/ImageUploader.tsx` — compress + multipart upload, blob preview, 429 handling, remove Supabase call.
- `lib/supabase.ts` — deleted.
- `CLAUDE.md` — document new env vars; note Supabase no longer used in the parse flow.
- `package.json` — add Upstash deps.
