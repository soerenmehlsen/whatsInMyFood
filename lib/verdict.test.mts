import assert from "node:assert";
import { computeVerdict, isAdditive } from "./verdict";
import { exampleIngredient } from "./consant";

// Example data (hotdog) — see lib/consant.ts
const v = computeVerdict(exampleIngredient);
assert.ok(v, "expected a verdict for non-empty input");
assert.equal(v!.total, 25, "total");
assert.equal(v!.highestNova, 4, "highestNova");
assert.equal(v!.countAtHighest, 14, "countAtHighest (NOVA 4)");
assert.equal(v!.additiveCount, 7, "additiveCount (E-numbers)");

const counts = Object.fromEntries(v!.groupCounts.map((g) => [g.nova, g.count]));
assert.deepEqual(counts, { 1: 7, 2: 4, 4: 14 }, "groupCounts (no NOVA 3 present)");

// Empty input -> null
assert.equal(computeVerdict([]), null, "empty input -> null");

// Out-of-range nova values are ignored
assert.equal(
  computeVerdict([{ name: "x", nova_classification: 9 }]),
  null,
  "single item with out-of-range nova -> null",
);

// E-number detection
assert.equal(isAdditive("E451"), true);
assert.equal(isAdditive("Salt"), false);

console.log("verdict.test.mts: all assertions passed");
