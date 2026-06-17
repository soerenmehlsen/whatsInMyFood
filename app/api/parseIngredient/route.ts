import {GoogleGenerativeAI, SchemaType, type Schema} from "@google/generative-ai";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Defines the JSON schema for a consistent and structured output
const schema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    language: {
      type: SchemaType.STRING,
      description:
        "ISO 639-1 code of the language used by the ingredient names (e.g. 'da', 'en')",
    },
    ingredient: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: {
            type: SchemaType.STRING,
            description: "Name of the ingredient",
          },
          description: {
            type: SchemaType.STRING,
            description: "Description of the ingredient",
          },
          nova_classification: {
            type: SchemaType.NUMBER,
            description: "NOVA classification group (1-4)",
          },
          reason: {
            type: SchemaType.STRING,
            description: "Reason for the classification",
          },
        },
        required: ["name", "description", "nova_classification", "reason"],
      },
    },
  },
  required: ["language", "ingredient"],
};

export async function POST(request: Request) {
  try {
  // Best-effort client identity. x-forwarded-for is client-influenced, so this
  // is an abuse speed-bump, not a hard guarantee; unknown clients share the
  // "anonymous" bucket.
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "anonymous";
  const { success: allowed } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No image or text provided" },
      { status: 400 },
    );
  }
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

  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  // Instructions for the model
  const systemPrompt = `You are an expert in food and nutrition. Your task is to extract ingredients from an image of a food ingredient list, 
  enhance them by splitting complex entries like E-numbers into separate components with descriptions that match the language of the ingredient name, and classify them using the NOVA food classification system. 
  
  When splitting ingredients with multiple E-numbers, follow these rules:
1. Create a separate entry for each E-number.
2. Retain the original ingredient name for context, but make the E-number the focus of each entry (e.g., "Smagsforstærker (E621)" becomes "E621").
3. Provide a clear, user-friendly explanation of each E-number.
4. Exclude duplicate descriptions and ensure clarity.
5. Exclude duplicate ingredient names.
  
You have to provide formative descriptions that is clear and concise for each ingredient. 
For the field 'nova_classification', return only the group number (1, 2, 3, or 4) as a number, not the description or any text. 
Use the NOVA groups to justify the classification with a reason in the same language as the ingredient name and description.

NOVA Classification Groups:
1. Unprocessed or minimally processed foods: These are natural foods that have been cleaned, sliced, or otherwise minimally altered.
2. Processed culinary ingredients: These include items like sugar, oils, and salts, which are derived from natural foods but used to prepare other dishes.
3. Processed foods: Foods that combine natural ingredients with culinary ingredients and undergo preservation methods like canning or freezing.
4. Ultra-processed foods: These are industrially formulated products with ingredients like emulsifiers, preservatives, and artificial flavors.

Also return a top-level 'language' field: the ISO 639-1 code (e.g. 'da', 'en') of the language used by the ingredient names. Put every ingredient in the 'ingredient' array.`;

  const outputStartTime = Date.now();

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
  
  // Parse the response as JSON
  const response = await result.response;
  let parsed;
  try {
    parsed = JSON.parse(response.text());
    console.log({ parsed });
  } catch (error) {
    console.error('Error parsing ingredients JSON:', error);
    return NextResponse.json(
        { error: 'Failed to parse ingredients data' },
        { status: 500 }
    );
  }

  // Log the total request duration
  console.log(`Total request duration: ${Date.now() - outputStartTime}ms`);

  return NextResponse.json({
    success: true,
    ingredient: parsed.ingredient,
    language: typeof parsed.language === "string" ? parsed.language : "en",
  });

} catch (error) {
    // Logging the error
    console.error('Error processing request:', error);
    
    // User-friendly error message 
    return NextResponse.json(
        { success: false, error: 'Something went wrong while processing your image. Please try again.',
          details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
        },
        { status: 500 }
    );

}
}

export const maxDuration = 60;
