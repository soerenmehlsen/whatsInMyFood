import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImageToSupabase = async (file: File) => {
    try {
        const fileName = `images/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
            .from("IngredientBucket") // Replace with your bucket name
            .upload(fileName, file);

        if (error) {
            console.error("Error uploading file:", error.message, error);
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from("IngredientBucket")
            .getPublicUrl(fileName);

        if (!publicUrlData.publicUrl) {
            throw new Error("Failed to retrieve public URL");
        }
        console.log(publicUrlData.publicUrl);
        return publicUrlData.publicUrl; // Return the public URL
    } catch (error) {
        console.error("Error uploading image to Supabase:", error);
        throw error;
    }
};