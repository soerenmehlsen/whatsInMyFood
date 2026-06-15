// Pure verdict computation for the result banner.
// All numbers shown to the user are derived here, never taken from the model.

export type NovaGroup = 1 | 2 | 3 | 4;

// Structural input: anything with a name and a nova classification.
// IngredientItem (app/components/ImageUploader) is compatible.
export interface VerdictInput {
  name: string;
  nova_classification: number;
}

export interface GroupCount {
  nova: NovaGroup;
  count: number;
}

export interface Verdict {
  total: number;
  highestNova: NovaGroup;
  countAtHighest: number;
  groupCounts: GroupCount[]; // only groups that occur, ascending by nova
  additiveCount: number; // count of E-number entries
}

const E_NUMBER = /^E\d{3}/i;

export function isAdditive(item: VerdictInput): boolean {
  return E_NUMBER.test(item.name.trim());
}

function asGroup(value: number): NovaGroup | null {
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? (n as NovaGroup) : null;
}

export function computeVerdict(items: VerdictInput[]): Verdict | null {
  const counts = new Map<NovaGroup, number>();
  let additiveCount = 0;
  let total = 0;

  for (const item of items) {
    const group = asGroup(item.nova_classification);
    if (group === null) continue; // ignore out-of-range values
    total += 1;
    counts.set(group, (counts.get(group) ?? 0) + 1);
    if (isAdditive(item)) additiveCount += 1;
  }

  if (total === 0) return null;

  const highestNova = Math.max(...counts.keys()) as NovaGroup;
  const groupCounts: GroupCount[] = ([1, 2, 3, 4] as NovaGroup[])
    .filter((n) => counts.has(n))
    .map((n) => ({ nova: n, count: counts.get(n)! }));

  return {
    total,
    highestNova,
    countAtHighest: counts.get(highestNova)!,
    groupCounts,
    additiveCount,
  };
}
