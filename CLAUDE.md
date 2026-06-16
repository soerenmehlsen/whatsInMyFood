# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhatsInMyFood is a Next.js 16 (App Router) app that analyzes food ingredient labels. A user uploads a photo of an ingredient list, the image is stored in Supabase, and Google's Gemini model extracts each ingredient with a description, a NOVA processing-level classification (groups 1–4), and a reason for that classification.

## Commands

```bash
npm run dev      # Dev server with Turbopack
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint (next/core-web-vitals + next/typescript)
```

No test framework is configured.

## Architecture

### Request flow (the core of the app)
1. `app/components/ImageUploader.tsx` is the main client component. It owns the whole flow and tracks status as `"initial" | "uploading" | "parsing" | "created" | "error"`.
2. On upload the client compresses the image (`lib/image.ts`) and POSTs it as multipart form-data; Supabase is no longer part of the parse flow (still used only by `/api/keepalive`).
3. That public URL is POSTed to `app/api/parseIngredient/route.ts` as `{ ingredientUrl }`.
4. The route fetches the image, base64-encodes it, and sends it to Gemini with a fixed JSON `responseSchema` (`name`, `description`, `nova_classification`, `reason`). It returns `{ success, ingredient: IngredientItem[] }`. `maxDuration = 60`.
5. Results render in `app/components/ingredient-grid.tsx` with client-side search and NOVA filtering (`app/components/FilterDropdown.tsx`).

The Gemini system prompt (in the route) drives two important behaviors: it splits compound E-number entries into one entry per E-number (e.g. "Smagsforstærker (E621, E635)" → separate `E621`, `E635` entries), and it returns descriptions/reasons in the same language as the detected ingredient name.

### Pages
- `app/page.tsx` — marketing landing page (Hero, HowItWorks, WhyItMatters, article showcase).
- `app/dashboard/page.tsx` — renders `ImageUploader`, the actual app.
- `lib/consant.ts` — hardcoded example ingredient data used for the demo / example-image mode.

## Important: docs vs. reality

The existing `AGENTS.md` and `README.md` are partially stale. Trust the code:
- **Model** is `gemini-3-flash-preview` (set in `app/api/parseIngredient/route.ts`), not Gemini 2.5 Pro/Flash as the docs claim.
- **There is no `middleware.ts`.** Clerk is installed and `ClerkProvider` wraps the app in `app/layout.tsx`, but the auth gate in `app/dashboard/page.tsx` is currently commented out — routes are not actually protected right now. Re-enable that block (and add middleware) if auth needs enforcing.

## Conventions

- Path alias `@/*` maps to the repo root (e.g. `@/app/components/...`, `@/lib/...`).
- Use the `cn()` helper from `lib/utils.ts` (clsx + tailwind-merge) for conditional class names.
- Styling is Tailwind utility classes; animations use Framer Motion and react-awesome-reveal (`app/components/ui/fade.tsx`).
- Note `lib/consant.ts` is the actual (misspelled) filename — import accordingly.

## Environment variables

Set in `.env.local`:
- `GOOGLE_API_KEY` — Gemini API key.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` — Supabase client (used in `lib/supabase.ts`).
- `NEXT_PUBLIC_SUPABASE_DOMAIN` — whitelisted hostname for Next.js image optimization (`next.config.ts`).
- `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` — used by `app/api/keepalive/route.ts`.
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` — PostHog analytics (`app/providers.tsx`).
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis for rate limiting `/api/parseIngredient` (`lib/rate-limit.ts`). If unset, rate limiting is disabled (dev fallback).
- Clerk keys.

## Cron / keepalive

`vercel.json` schedules a daily `GET /api/keepalive` (09:00). It lists one object in the Supabase storage bucket using the service-role key to keep the free-tier Supabase project from being paused. The endpoint checks `Authorization: Bearer ${CRON_SECRET}` when `CRON_SECRET` is set.
