<h1 align="center">Whats in my food</h1>

<p align="center">
  Take a picture of the ingredient list on your food and it will show you the ingredients with explanation so you easily can understand what it is and how processed the food is.
</p>

## Tech stack

- **Framework**: Next.js 15 with App Router
- **AI/ML**: Google Generative AI (Gemini 3 Flash for ingredient analysis)
- **Storage**: Supabase (stores uploaded images)
- **Analytics**: PostHog (user behavior tracking), Google Analytics, Vercel Speed Insights
- **Styling**: Tailwind CSS, Framer Motion for animations

### Workflows

#### Image Processing Flow
1. User uploads image via "ImageUploader" component
2. Image is uploaded to Supabase storage via "uploadImageToSupabase()"
3. Public URL is sent to "/api/parseIngredient" endpoint
4. API fetches image, converts to base64, and sends to Gemini 2.5 Pro
5. Gemini extracts ingredients with structured JSON schema containing:
   - name: Ingredient name
   - description: User-friendly explanation
   - nova_classification: NOVA group (1-4)
   - reason: Classification justification
6. Results are displayed in a grid with search and filter capabilities

### NOVA Classification System
The app classifies ingredients into 4 groups:
1. **Unprocessed/minimally processed**: Natural foods (e.g., flour, spices, water)
2. **Processed culinary ingredients**: Extracted substances (e.g., sugar, oils, salt)
3. **Processed foods**: Foods with added ingredients (e.g., canned goods, cheese)
4. **Ultra-processed foods**: Industrial formulations with additives (e.g., E-numbers, artificial flavors)

## Future Tasks

- [X] Indicator that can show how processed the food is
- [X] Make space for longer description of the ingredients
- [X] Classification of processed food based on the NOVA-classiciationsystem. (Gives the user a overview of the food's health profile)
- [ ] Health risk analysis of the food
- [ ] Personal profile with preferences (allgergies)
- [ ] Higlight the ingredients for your allergies
