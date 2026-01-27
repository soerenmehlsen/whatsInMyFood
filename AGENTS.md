# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
WhatsInMyFood is a Next.js application that analyzes food ingredient lists using AI. Users upload photos of ingredient labels, and the app uses Google's Gemini 2.5 Flash to extract, describe, and classify ingredients according to the NOVA food classification system.

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Notes
- The dev server uses Turbopack (`--turbopack` flag) for faster builds
- No test framework is currently configured in this project

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **AI/ML**: Google Generative AI (Gemini 2.5 Pro for ingredient analysis)
- **Authentication**: Clerk (handles user sign-in/sign-up)
- **Storage**: Supabase (stores uploaded images in "IngredientBucket")
- **Analytics**: PostHog (user behavior tracking), Google Analytics, Vercel Speed Insights
- **Styling**: Tailwind CSS, Framer Motion for animations

### Project Structure
```
app/
  ├── api/parseIngredient/route.ts    # API endpoint that processes images with Gemini
  ├── components/                      # React components
  │   ├── ImageUploader.tsx           # Main upload UI and ingredient display
  │   ├── ingredient-grid.tsx         # Grid display for parsed ingredients
  │   ├── FilterDropdown.tsx          # Filter by NOVA classification
  │   ├── header.tsx, footer.tsx      # Layout components
  │   └── ui/                         # Reusable UI components
  ├── dashboard/page.tsx              # Protected dashboard (requires auth)
  ├── page.tsx                        # Landing page with marketing content
  ├── layout.tsx                      # Root layout with providers
  └── providers.tsx                   # PostHog analytics provider

lib/
  ├── supabase.ts                     # Supabase client and image upload helper
  └── consant.ts                      # Example data for demo mode

middleware.ts                         # Clerk auth middleware
```

### Key Workflows

#### Image Processing Flow
1. User uploads image via `ImageUploader` component
2. Image is uploaded to Supabase storage via `uploadImageToSupabase()`
3. Public URL is sent to `/api/parseIngredient` endpoint
4. API fetches image, converts to base64, and sends to Gemini 2.5 Pro
5. Gemini extracts ingredients with structured JSON schema containing:
   - `name`: Ingredient name
   - `description`: User-friendly explanation
   - `nova_classification`: NOVA group (1-4)
   - `reason`: Classification justification
6. Results are displayed in `ingredient-grid` with search and filter capabilities

#### Authentication Flow
- Clerk middleware protects all routes except `/`, `/sign-in`, and `/sign-up`
- Authenticated users are redirected to `/dashboard`
- Unauthenticated users on protected routes are redirected to sign-in

### Environment Variables Required
- `GOOGLE_API_KEY`: Google Generative AI API key
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_KEY`: Supabase anon/public key
- `NEXT_PUBLIC_SUPABASE_DOMAIN`: Domain for Next.js image optimization
- Clerk environment variables (automatically configured by Clerk)
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog host URL

### NOVA Classification System
The app classifies ingredients into 4 groups:
1. **Unprocessed/minimally processed**: Natural foods (e.g., flour, spices, water)
2. **Processed culinary ingredients**: Extracted substances (e.g., sugar, oils, salt)
3. **Processed foods**: Foods with added ingredients (e.g., canned goods, cheese)
4. **Ultra-processed foods**: Industrial formulations with additives (e.g., E-numbers, artificial flavors)

### API Endpoint Details

#### POST `/api/parseIngredient`
- **Input**: `{ ingredientUrl: string }` - Public URL of uploaded image
- **Output**: `{ success: boolean, ingredient: IngredientItem[] }`
- **Timeout**: 60 seconds (`maxDuration = 60`)
- **Model**: Gemini 2.5 Pro with structured JSON schema
- **Special behavior**: Splits compound ingredients (e.g., "E621, E635" becomes separate entries)

### State Management
- Component-level state using React hooks (no global state library)
- `ImageUploader` manages upload/parsing status: `"initial" | "uploading" | "parsing" | "created" | "error"`

### Styling Patterns
- Uses Tailwind utility classes throughout
- Responsive design with mobile-first approach
- Animation effects using Framer Motion's `<Fade>` component
- Custom UI components in `app/components/ui/`
