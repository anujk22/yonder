import test from "node:test";
import assert from "node:assert/strict";
import { newCollection, toggleCollectionPlace } from "../src/lib/collections";

test("one collection is free, additional collections require Plus", () => {
  const first = newCollection([], " Campus ", false, "1");
  assert.equal(first.name, "Campus");
  assert.throws(() => newCollection([first], "Weekend", false, "2"), /Plus/);
  assert.equal(newCollection([first], "Weekend", true, "2").name, "Weekend");
  assert.throws(() => newCollection([first], "campus", true, "3"), /already/);
  assert.throws(() => newCollection([], "  ", true, "3"), /name/);
});

test("membership changes preserve other collections and do not duplicate a place", () => {
  const original = newCollection([], "Campus", false, "1");
  const added = toggleCollectionPlace(original, "pier2");
  assert.deepEqual(original.placeIds, []);
  assert.deepEqual(added.placeIds, ["pier2"]);
  assert.deepEqual(toggleCollectionPlace(added, "pier2").placeIds, []);
  // Existing data remains editable if Plus is refunded; only creating more is gated.
  assert.deepEqual(toggleCollectionPlace(added, "bryant").placeIds, ["pier2", "bryant"]);
});
