import type { IngredientItem } from "@/app/components/ImageUploader";
import { computeVerdict } from "@/lib/verdict";
import { getStrings } from "@/lib/i18n";
import { novaVisual } from "@/lib/nova";

// Left accent border color per highest NOVA level, matching the NOVA dots.
const accentBorder: Record<number, string> = {
  1: "border-l-[#34c759]",
  2: "border-l-[#3b82f6]",
  3: "border-l-[#f59e0b]",
  4: "border-l-[#ef4444]",
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

  let subtext = t.subtext[highestNova];
  if (additiveCount > 0) subtext += " " + t.additiveSuffix(additiveCount);

  return (
    <div
      className={`mb-8 rounded-2xl border border-hairline border-l-[6px] bg-surface p-6 text-left shadow-sm ${accentBorder[highestNova]}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
        {t.verdictLabel[highestNova]}
      </div>
      <div className="mt-1 mb-1 text-2xl font-bold tracking-tight text-ink">
        {t.headline(countAtHighest, total, t.groupNoun[highestNova])}
      </div>
      <p className="mb-4 text-sm text-muted">{subtext}</p>
      <div className="flex flex-wrap gap-2">
        {groupCounts.map((g) => (
          <span
            key={g.nova}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${novaVisual(g.nova).chip}`}
          >
            ● {t.chipLabel(g.count, t.groupNoun[g.nova])}
          </span>
        ))}
      </div>
    </div>
  );
}
