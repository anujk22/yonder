import test from "node:test";
import assert from "node:assert/strict";
import { newCollection, toggleCollectionPlace } from "../src/lib/collections";

test("collections are free and unlimited, with unique trimmed names", () => {
  const first = newCollection([], " Campus ", "1");
  assert.equal(first.name, "Campus");
  const second = newCollection([first], "Weekend", "2");
  assert.equal(newCollection([first, second], "Lunch", "3").name, "Lunch");
  assert.throws(() => newCollection([first], "campus", "3"), /already/);
  assert.throws(() => newCollection([], "  ", "3"), /name/);
});

test("membership changes preserve other collections and do not duplicate a place", () => {
  const original = newCollection([], "Campus", "1");
  const added = toggleCollectionPlace(original, "pier2");
  assert.deepEqual(original.placeIds, []);
  assert.deepEqual(added.placeIds, ["pier2"]);
  assert.deepEqual(toggleCollectionPlace(added, "pier2").placeIds, []);
  assert.deepEqual(toggleCollectionPlace(added, "bryant").placeIds, ["pier2", "bryant"]);
});
