import type { NovaGroup } from "@/lib/verdict";

export interface NovaVisual {
  chip: string; // pill background + text classes
  dot: string; // hex for the section/list dot
  shortLabel: string; // e.g. "NOVA 1"
  info: string; // long description for the tooltip
}

const VISUALS: Record<NovaGroup, NovaVisual> = {
  1: {
    chip: "bg-green-100 text-green-800",
    dot: "#34c759",
    shortLabel: "NOVA 1",
    info: "1. Unprocessed or minimally processed foods",
  },
  2: {
    chip: "bg-blue-100 text-blue-800",
    dot: "#3b82f6",
    shortLabel: "NOVA 2",
    info: "2. Processed culinary ingredients",
  },
  3: {
    chip: "bg-amber-100 text-amber-800",
    dot: "#f59e0b",
    shortLabel: "NOVA 3",
    info: "3. Processed foods",
  },
  4: {
    chip: "bg-red-100 text-red-800",
    dot: "#ef4444",
    shortLabel: "NOVA 4",
    info: "4. Ultra-processed foods",
  },
};

const UNKNOWN: NovaVisual = {
  chip: "bg-gray-100 text-gray-800",
  dot: "#9ca3af",
  shortLabel: "Unknown NOVA",
  info: "Unknown NOVA",
};

export function novaVisual(nova: number): NovaVisual {
  return VISUALS[nova as NovaGroup] ?? UNKNOWN;
}

// Capitalized group noun for section headers, e.g. "Ultra-processed".
// Pulls from the existing i18n groupNoun so language stays consistent.
export function sectionTitle(groupNoun: string): string {
  return groupNoun.charAt(0).toUpperCase() + groupNoun.slice(1);
}
