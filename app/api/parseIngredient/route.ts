import {GoogleGenerativeAI, SchemaType, type Schema} from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Defines the JSON schema for a consistent and structured output
const schema: Schema = {
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
};

export async function POST(request: Request) {
  try {
  const { ingredientUrl } = await request.json();

  console.log({ ingredientUrl });

  if (!ingredientUrl) {
    return NextResponse.json(
      { error: "No ingredient URL provided" },
      { status: 400 },
    );
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
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
4. Ultra-processed foods: These are industrially formulated products with ingredients like emulsifiers, preservatives, and artificial flavors.`;

  const outputStartTime = Date.now();

  // Fetch the image data from the provided URL
  const imageResponse = await fetch(ingredientUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
  }
  
  const imageData = await imageResponse.arrayBuffer();

  // Convert the image data to base64
  const base64Image = Buffer.from(imageData).toString('base64');

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
  
  // Parse the response as JSON
  const response = await result.response;
  let parsedIngredients;
  try {
    parsedIngredients = JSON.parse(response.text());
    console.log({ parsedIngredients });
  } catch (error) {
    console.error('Error parsing ingredients JSON:', error);
    return NextResponse.json(
        { error: 'Failed to parse ingredients data' },
        { status: 500 }
    );
  }

  // Log the total request duration
  console.log(`Total request duration: ${Date.now() - outputStartTime}ms`);

  return NextResponse.json({ success: true, ingredient: parsedIngredients });

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
