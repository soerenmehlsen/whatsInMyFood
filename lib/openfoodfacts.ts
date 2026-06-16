// Client-side lookup against Open Food Facts API v2. Free, no API key, CORS-enabled.
// A "usable hit" requires status === 1 AND a non-empty ingredients_text — everything
// else (not found, missing text, network/parse error) returns { found: false } so the
// caller can fall back to the photo flow. Fail-open mirrors the rate limiter.

export interface OffLookupResult {
  found: boolean;
  ingredientsText?: string;
  language?: string; // ISO 639-1, best-effort from OFF's `lang` field
}

const OFF_PRODUCT_ENDPOINT = "https://world.openfoodfacts.org/api/v2/product";
const OFF_FIELDS = "code,status,product_name,ingredients_text,lang";

export async function lookupProduct(ean: string): Promise<OffLookupResult> {
  try {
    const url = `${OFF_PRODUCT_ENDPOINT}/${encodeURIComponent(ean)}.json?fields=${OFF_FIELDS}`;
    const res = await fetch(url);
    if (!res.ok) return { found: false };

    const data = await res.json();
    if (data?.status !== 1) return { found: false };

    const rawText = data?.product?.ingredients_text;
    const ingredientsText =
      typeof rawText === "string" ? rawText.trim() : "";
    if (!ingredientsText) return { found: false };

    const rawLang = data?.product?.lang;
    const language =
      typeof rawLang === "string" && rawLang.length > 0 ? rawLang : undefined;

    return { found: true, ingredientsText, language };
  } catch {
    return { found: false };
  }
}
