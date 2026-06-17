# WhatsInMyFood

Ever wondered what those mysterious ingredients on food labels actually mean? WhatsInMyFood transforms confusing ingredient lists into clear, understandable information. Scan a product's barcode or snap a photo of the label, and AI analyzes each ingredient's purpose and processing level using the NOVA classification system.

## 📋 Description

WhatsInMyFood is a web application that uses AI to analyze food ingredient lists. Users either scan a product barcode — ingredients are pulled from the [Open Food Facts](https://world.openfoodfacts.org/) database — or take a photo of an ingredient label. Either way, Google's Gemini AI extracts, describes, and classifies each ingredient. The system helps consumers make informed dietary choices by providing clear, user-friendly explanations of each ingredient and its processing level. Images are processed in-memory and sent directly to the AI — they are never stored.

## 💡 Benefits

### For Health-Conscious Consumers
- **Make Informed Choices** - Understand exactly what's in your food before you eat it
- **Identify Processing Levels** - Know which ingredients are natural and which are ultra-processed
- **Easy to Use** - Snap a photo, get instant results
- **Mobile Friendly** - Scan ingredients while shopping at the grocery store
- **Privacy-First** - Photos are not stored anywhere; they are analyzed and discarded
- **Free Access** - No sign-up required to start understanding your food

## ✨ Features

### 📷 Barcode Scan
- Scan a product's EAN/UPC barcode live with your device camera (`@zxing/browser`)
- Ingredients are looked up from the [Open Food Facts](https://world.openfoodfacts.org/) database (free, no API key)
- Falls back to the photo flow when a barcode isn't found or has no ingredient text

### 📸 Photo Scan & Analysis
- Scan ingredient labels directly with your device camera
- Images are compressed client-side before upload (faster, cheaper, and normalizes phone formats like HEIC to JPEG)
- Instant AI-powered extraction of ingredients from the photo
- Built-in example image for testing without a camera

### 🌐 Language
- Automatic language detection — descriptions are returned in the label's language
- Optional language selector to force results into your preferred language before scanning

### 🔍 Ingredient Analysis
- Detailed description of each ingredient in clear, user-friendly language
- NOVA classification system for processing level assessment
- Explanation of why each ingredient is classified at its level
- Special handling of E-numbers with comprehensive breakdowns (compound entries are split into one per E-number)

### 🎯 Filtering
- Filter ingredients by NOVA classification group
- Search functionality to find specific ingredients
- Visual indicators for processing levels

### 📊 NOVA Classification System
- **Group 1**: Unprocessed or minimally processed foods (natural foods like flour, spices)
- **Group 2**: Processed culinary ingredients (extracted substances like sugar, oils, salt)
- **Group 3**: Processed foods (foods with added ingredients like canned goods)
- **Group 4**: Ultra-processed foods (industrial formulations with additives like E-numbers)

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/), React Awesome Reveal
- **Icons:** [Heroicons](https://heroicons.com/)
- **Type Safety:** TypeScript

### Backend & AI
- **Runtime:** Node.js 20+
- **API Routes:** Next.js Route Handlers
- **AI/ML:** [Google Generative AI](https://ai.google.dev/) (Gemini 3 Flash)
- **Barcode scanning:** [@zxing/browser](https://github.com/zxing-js/browser) (EAN-13/8, UPC-A/E), with product lookup via [Open Food Facts](https://world.openfoodfacts.org/) (client-side, no API key)
- **Image handling:** Client-side canvas compression; images are sent to the API as multipart form-data and forwarded to Gemini — never persisted
- **Rate limiting:** [Upstash Redis](https://upstash.com/) via `@upstash/ratelimit` (per-IP, fails open when unconfigured)
- **Auth:** [Clerk](https://clerk.com/) is installed and wraps the app; the dashboard auth gate is currently disabled (routes are not enforced)

### Analytics & Monitoring
- **User Analytics:** [PostHog](https://posthog.com/)
- **Web Analytics:** Google Analytics (`@next/third-parties`)
- **Performance:** Vercel Speed Insights

### Tools
- **Hosting:** [Vercel](https://vercel.com/)
- **Linting:** ESLint

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun
- Google AI API key for Gemini
- (Optional) An [Upstash](https://upstash.com/) Redis database for rate limiting

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/soerenmehlsen/whatsInMyFood.git
   cd whatsInMyFood
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Required — Gemini API key
   GOOGLE_API_KEY=your_google_ai_api_key

   # Optional — Upstash Redis for rate limiting /api/parseIngredient.
   # If omitted (or if Upstash errors), rate limiting fails open (all requests allowed).
   UPSTASH_REDIS_REST_URL=your_upstash_rest_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token

   # Optional — analytics
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   NEXT_PUBLIC_POSTHOG_HOST=your_posthog_host

   # Optional — Clerk (auth is currently not enforced)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
whatsInMyFood/
├── app/                       # Next.js App Router
│   ├── api/
│   │   └── parseIngredient/   # AI ingredient parsing endpoint (multipart upload + rate limit)
│   ├── components/            # React components
│   │   ├── HeroSection.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── ImageUploader.tsx  # Owns the barcode/photo → parse → results flow
│   │   ├── BarcodeScanner.tsx # Live EAN/UPC barcode scanning (zxing)
│   │   ├── CameraModal.tsx    # Live camera capture
│   │   ├── LanguageSelect.tsx # Result-language selector
│   │   ├── ingredient-grid.tsx
│   │   ├── ResultSummary.tsx
│   │   ├── FilterDropdown.tsx
│   │   └── ui/                # Reusable UI components
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Marketing landing page
│   ├── dashboard/page.tsx     # The actual app (renders ImageUploader)
│   └── manifest.ts            # PWA manifest
├── lib/                       # Utilities
│   ├── image.ts               # Client-side image compression
│   ├── rate-limit.ts          # Upstash-backed per-IP rate limiting
│   ├── nova.ts                # NOVA classification helpers
│   ├── verdict.ts             # Result summary logic
│   ├── openfoodfacts.ts       # Open Food Facts product lookup by barcode
│   ├── i18n.ts                # Localized UI strings
│   ├── languages.ts           # Supported result languages
│   ├── utils.ts               # cn() class-name helper
│   └── consant.ts             # Example ingredient data (note: filename is misspelled)
├── public/                    # Static assets
│   ├── example-ingredients.jpg
│   ├── whatsinmyfood-logo.png
│   └── web-app-manifest-*.png
└── AGENTS.md                  # Development guide
```

## 🔧 Configuration

### NOVA Classification
The app uses the NOVA food classification system to categorize ingredients:

1. **Unprocessed/minimally processed**: Natural foods (e.g., flour, spices, water)
2. **Processed culinary ingredients**: Extracted substances (e.g., sugar, oils, salt)
3. **Processed foods**: Foods with added ingredients (e.g., canned goods, cheese)
4. **Ultra-processed foods**: Industrial formulations with additives (e.g., E-numbers, artificial flavors)

### AI Model Configuration
The app uses Google's Gemini 3 Flash model (`gemini-3-flash-preview`) with:
- JSON structured output for consistent parsing
- A fixed response schema for ingredient data (`name`, `description`, `nova_classification`, `reason`) plus a detected `language`

### Rate Limiting
`/api/parseIngredient` is rate-limited per IP using Upstash Redis (sliding window, 15 requests per IP per 24h by default — tunable in `lib/rate-limit.ts`). Without Upstash credentials, rate limiting fails open so local development works unchanged.

## 📝 Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚢 Deployment

### Vercel (Recommended)

WhatsInMyFood is optimized for deployment on Vercel:

1. **Connect your repository** to Vercel
2. **Configure environment variables** in the Vercel dashboard:
   ```
   GOOGLE_API_KEY                 # required
   UPSTASH_REDIS_REST_URL         # recommended in production
   UPSTASH_REDIS_REST_TOKEN       # recommended in production
   NEXT_PUBLIC_POSTHOG_KEY        # optional
   NEXT_PUBLIC_POSTHOG_HOST       # optional
   ```
3. **Deploy** - Vercel will automatically build and deploy your app

## 📱 Progressive Web App

WhatsInMyFood is a Progressive Web App (PWA) that can be installed on mobile devices:
- Add to home screen on iOS and Android
- App-like experience with custom splash screens
- Optimized icons for all device sizes

## 🗺️ Roadmap

### Completed Features
- ✅ NOVA classification system implementation
- ✅ Detailed ingredient descriptions
- ✅ E-number breakdown and analysis
- ✅ Visual processing level indicators
- ✅ Barcode scanning with Open Food Facts lookup
- ✅ Result language selection

### Upcoming Features
- [ ] Health risk analysis of ingredients
- [ ] Personal profiles with allergy preferences
- [ ] Highlight allergenic ingredients
- [ ] Save and track scanned products
- [ ] Nutritional information integration
- [ ] Multi-language support expansion

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Søren Mehlsen** - [@soerenmehlsen](https://github.com/soerenmehlsen)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Google Gemini](https://ai.google.dev/)
- Rate limiting by [Upstash](https://upstash.com/)
- Analytics by [PostHog](https://posthog.com/)
- Hosted on [Vercel](https://vercel.com/)
- Icons by [Heroicons](https://heroicons.com/)

---

**Live Demo:** [whatsinmyfood.info](https://whatsinmyfood.info)
