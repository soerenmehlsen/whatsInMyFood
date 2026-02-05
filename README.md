# WhatsInMyFood

Ever wondered what those mysterious ingredients on food labels actually mean? WhatsInMyFood transforms confusing ingredient lists into clear, understandable information. Simply snap a photo, and AI analyzes each ingredient's purpose and processing level using the NOVA classification system.

## 📋 Description

WhatsInMyFood is a web application that uses AI to analyze food ingredient lists. Users can upload photos of ingredient labels, and the app uses Google's Gemini AI to extract, describe, and classify ingredients. The system helps consumers make informed dietary choices by providing clear, user-friendly explanations of each ingredient and its processing level.

## 💡 Benefits

### For Health-Conscious Consumers
- **Make Informed Choices** - Understand exactly what's in your food before you eat it
- **Identify Processing Levels** - Know which ingredients are natural and which are ultra-processed
- **Easy to Use** - Simple photo upload, instant results
- **Mobile Friendly** - Scan ingredients while shopping at the grocery store
- **Health Goals** - Support your journey toward less processed, more natural foods
- **Free Access** - No subscription required to start understanding your food

## ✨ Features

### 📸 Image Upload & Analysis
- Upload photos of ingredient lists via drag-and-drop or file selection
- Instant AI-powered extraction of ingredients from images
- Support for multiple languages in ingredient detection
- Example images available for testing

### 🔍 Ingredient Analysis
- Detailed description of each ingredient in clear, user-friendly language
- NOVA classification system for processing level assessment
- Explanation of why each ingredient is classified at its level
- Special handling of E-numbers with comprehensive breakdowns

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
- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/), React Awesome Reveal
- **Icons:** [Heroicons](https://heroicons.com/)
- **Type Safety:** TypeScript

### Backend & AI
- **Runtime:** Node.js 20+
- **API Routes:** Next.js API Routes
- **AI/ML:** [Google Generative AI](https://ai.google.dev/) (Gemini 3 Flash)
- **Storage:** [Supabase](https://supabase.com/) (image storage)
- **Image Processing:** Next.js Image Optimization

### Analytics & Monitoring
- **User Analytics:** [PostHog](https://posthog.com/)
- **Web Analytics:** Google Analytics
- **Performance:** Vercel Speed Insights

### Tools
- **Hosting:** [Vercel](https://vercel.com/)
- **File Upload:** react-dropzone
- **Linting:** ESLint

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm, yarn, pnpm, or bun
- Supabase account for image storage
- Google AI API key for Gemini

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
   GOOGLE_API_KEY=your_google_ai_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_DOMAIN=your_supabase_domain
   ```

4. **Set up Supabase storage**
   - Create a new bucket called `IngredientBucket` in your Supabase project
   - Configure public access for image retrieval

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
whatsInMyFood/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── parseIngredient/  # AI ingredient parsing endpoint
│   ├── components/        # React components
│   │   ├── HeroSection.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── ingredient-grid.tsx
│   │   ├── FilterDropdown.tsx
│   │   └── ui/            # Reusable UI components
│   ├── fonts/             # Custom fonts
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── manifest.ts        # PWA manifest
├── lib/                   # Utility functions
│   ├── supabase.ts        # Supabase client
│   └── consant.ts         # Constants and examples
├── public/                # Static assets
│   ├── whatsinmyfood-logo.png
│   └── web-app-manifest-*.png
└── AGENTS.md             # Development guide
```

## 🔧 Configuration

### NOVA Classification
The app uses the NOVA food classification system to categorize ingredients:

1. **Unprocessed/minimally processed**: Natural foods (e.g., flour, spices, water)
2. **Processed culinary ingredients**: Extracted substances (e.g., sugar, oils, salt)
3. **Processed foods**: Foods with added ingredients (e.g., canned goods, cheese)
4. **Ultra-processed foods**: Industrial formulations with additives (e.g., E-numbers, artificial flavors)

### AI Model Configuration
The app uses Google's Gemini 3 Flash model with:
- JSON structured output for consistent parsing
- Schema validation for ingredient data

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
2. **Configure environment variables** in Vercel dashboard:
   ```
   GOOGLE_API_KEY
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_KEY
   NEXT_PUBLIC_SUPABASE_DOMAIN
   ```
3. **Deploy** - Vercel will automatically build and deploy your app

## 📱 Progressive Web App

WhatsInMyFood is a Progressive Web App (PWA) that can be installed on mobile devices:
- Add to home screen on iOS and Android
- Offline-capable with service workers
- App-like experience with custom splash screens
- Optimized icons for all device sizes

## 🗺️ Roadmap

### Completed Features
- ✅ NOVA classification system implementation
- ✅ Detailed ingredient descriptions
- ✅ E-number breakdown and analysis
- ✅ Visual processing level indicators

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
- Storage by [Supabase](https://supabase.com/)
- Analytics by [PostHog](https://posthog.com/)
- Hosted on [Vercel](https://vercel.com/)
- Icons by [Heroicons](https://heroicons.com/)

---

**Live Demo:** [whatsinmyfood.info](https://whatsinmyfood.info)
