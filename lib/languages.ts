// lib/languages.ts
export interface LanguageOption {
  /** "auto" or an ISO 639-1 code */
  code: string;
  /** Human-readable label shown in the UI (in its own language) */
  label: string;
  /** English name used inside the Gemini prompt; "" for auto-detect */
  promptName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "auto", label: "Auto-detect", promptName: "" },
  { code: "en", label: "English", promptName: "English" },
  { code: "da", label: "Dansk", promptName: "Danish" },
  { code: "de", label: "Deutsch", promptName: "German" },
  { code: "es", label: "Español", promptName: "Spanish" },
  { code: "fr", label: "Français", promptName: "French" },
  { code: "sv", label: "Svenska", promptName: "Swedish" },
];

export const DEFAULT_LANGUAGE = "auto";

/**
 * Returns the LanguageOption for a fixed (non-auto) language code, or
 * undefined for null/undefined, "auto", or any unrecognized code.
 * This is the single fail-safe check used by both the UI and the API route.
 */
export function getFixedLanguage(
  code: string | null | undefined,
): LanguageOption | undefined {
  if (!code || code === "auto") return undefined;
  return LANGUAGE_OPTIONS.find(
    (opt) => opt.code === code && opt.promptName !== "",
  );
}
