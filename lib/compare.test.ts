// Run: npx tsx lib/compare.test.ts
import assert from "node:assert";
import { compareProducts } from "@/lib/compare";

const n = (name: string, nova: number) => ({ name, nova_classification: nova });

// Lower NOVA wins
assert.equal(compareProducts([n("a", 1)], [n("b", 4)]), "a");
// Same NOVA, fewer additives wins
assert.equal(
  compareProducts([n("E621", 4)], [n("E621", 4), n("E635", 4)]),
  "a",
);
// Identical = tie
assert.equal(compareProducts([n("a", 2)], [n("b", 2)]), "tie");

console.log("ok");
