// Picks the less-processed of two scanned products.
// Lower NOVA wins; ties broken by fewer additives, then fewer items at the top level.

import { computeVerdict, type Verdict, type VerdictInput } from "@/lib/verdict";

export type CompareResult = "a" | "b" | "tie";

export function compareProducts(a: VerdictInput[], b: VerdictInput[]): CompareResult {
  const va = computeVerdict(a);
  const vb = computeVerdict(b);
  if (!va || !vb) return "tie"; // nothing to compare

  // ponytail: three-key lexicographic compare, good enough; add a real score if ranking needs more nuance
  const keys: ((v: Verdict) => number)[] = [
    (v) => v.highestNova, // lower = less processed
    (v) => v.additiveCount,
    (v) => v.countAtHighest,
  ];
  for (const k of keys) {
    if (k(va) < k(vb)) return "a";
    if (k(va) > k(vb)) return "b";
  }
  return "tie";
}
