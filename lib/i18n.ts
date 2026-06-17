import type { NovaGroup } from "@/lib/verdict";

export interface NovaStrings {
  // Small uppercase tag at the top of the banner, keyed by the highest NOVA level.
  verdictLabel: Record<NovaGroup, string>;
  // Group noun used in the headline and chips, e.g. "natural".
  groupNoun: Record<NovaGroup, string>;
  // Explanatory sentence, keyed by the highest NOVA level.
  subtext: Record<NovaGroup, string>;
  // "{count} of {total} ingredients are {noun}"
  headline: (countAtHighest: number, total: number, groupNoun: string) => string;
  // Extra sentence appended when E-numbers are present.
  additiveSuffix: (n: number) => string;
  // Chip text, e.g. "14 ultra-processed".
  chipLabel: (count: number, groupNoun: string) => string;
  // Inline label before the NOVA reason on an ingredient card.
  processLabel: string;
}

const en: NovaStrings = {
  verdictLabel: {
    1: "Natural product",
    2: "Lightly processed product",
    3: "Processed product",
    4: "Highly processed product",
  },
  groupNoun: {
    1: "natural",
    2: "culinary",
    3: "processed",
    4: "ultra-processed",
  },
  subtext: {
    1: "Only unprocessed or minimally processed foods (NOVA 1).",
    2: "Highest level is processed culinary ingredients (NOVA 2), e.g. oil and salt.",
    3: "Highest level is processed foods (NOVA 3). No ultra-processed ingredients found.",
    4: "Contains ultra-processed ingredients (NOVA 4).",
  },
  headline: (count, total, noun) => `${count} of ${total} ingredients are ${noun}`,
  additiveSuffix: (n) =>
    `Includes ${n} ${n === 1 ? "additive" : "additives"} (E-numbers).`,
  chipLabel: (count, noun) => `${count} ${noun}`,
  processLabel: "Process",
};

const da: NovaStrings = {
  verdictLabel: {
    1: "Naturligt produkt",
    2: "Let forarbejdet produkt",
    3: "Forarbejdet produkt",
    4: "Stærkt forarbejdet produkt",
  },
  groupNoun: {
    1: "naturlige",
    2: "kulinariske",
    3: "forarbejdede",
    4: "ultra-forarbejdede",
  },
  subtext: {
    1: "Kun uforarbejdede eller minimalt forarbejdede fødevarer (NOVA 1).",
    2: "Højeste niveau er forarbejdede kulinariske ingredienser (NOVA 2), fx olie og salt.",
    3: "Højeste niveau er forarbejdede fødevarer (NOVA 3). Ingen ultra-forarbejdede ingredienser fundet.",
    4: "Indeholder ultra-forarbejdede ingredienser (NOVA 4).",
  },
  headline: (count, total, noun) => `${count} af ${total} ingredienser er ${noun}`,
  additiveSuffix: (n) =>
    `Heraf ${n} ${n === 1 ? "tilsætningsstof" : "tilsætningsstoffer"} (E-numre).`,
  chipLabel: (count, noun) => `${count} ${noun}`,
  processLabel: "Forarbejdning",
};

const dictionaries: Record<string, NovaStrings> = { en, da };

// Normalize "da-DK" / "DA" -> "da" and fall back to English for unknown codes.
export function getStrings(language: string | undefined): NovaStrings {
  const code = (language ?? "en").toLowerCase().split(/[-_]/)[0];
  return dictionaries[code] ?? en;
}
