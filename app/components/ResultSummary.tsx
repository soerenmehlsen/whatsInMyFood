import type { IngredientItem } from "@/app/components/ImageUploader";
import { computeVerdict } from "@/lib/verdict";
import { getStrings } from "@/lib/i18n";

// Tinted background + left accent border per highest NOVA level.
const bannerStyles: Record<number, { wrap: string; label: string }> = {
  1: { wrap: "bg-green-50 border-green-600", label: "text-green-800" },
  2: { wrap: "bg-blue-50 border-blue-500", label: "text-blue-800" },
  3: { wrap: "bg-amber-50 border-amber-500", label: "text-amber-800" },
  4: { wrap: "bg-red-50 border-red-500", label: "text-red-800" },
};

// Chip colors mirror the NOVA badges in ingredient-grid.tsx.
const chipColors: Record<number, string> = {
  1: "bg-green-100 text-green-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-red-100 text-red-800",
};

interface ResultSummaryProps {
  items: IngredientItem[];
  language: string;
}

export function ResultSummary({ items, language }: ResultSummaryProps) {
  const verdict = computeVerdict(items);
  if (!verdict) return null;

  const t = getStrings(language);
  const { highestNova, countAtHighest, total, groupCounts, additiveCount } =
    verdict;
  const style = bannerStyles[highestNova];

  let subtext = t.subtext[highestNova];
  if (additiveCount > 0) subtext += " " + t.additiveSuffix(additiveCount);

  return (
    <div
      className={`mb-8 rounded-xl border-l-[6px] p-5 text-left ${style.wrap}`}
    >
      <div
        className={`text-xs font-bold uppercase tracking-wide ${style.label}`}
      >
        {t.verdictLabel[highestNova]}
      </div>
      <div className="mt-1 mb-1 text-2xl font-extrabold text-gray-900">
        {t.headline(countAtHighest, total, t.groupNoun[highestNova])}
      </div>
      <p className="mb-4 text-sm text-gray-600">{subtext}</p>
      <div className="flex flex-wrap gap-2">
        {groupCounts.map((g) => (
          <span
            key={g.nova}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${chipColors[g.nova]}`}
          >
            ● {t.chipLabel(g.count, t.groupNoun[g.nova])}
          </span>
        ))}
      </div>
    </div>
  );
}
