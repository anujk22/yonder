import test from "node:test";
import assert from "node:assert/strict";
import { placesFromOSM } from "../src/lib/nearby";
import { GET } from "../src/app/api/nearby+api";

test("nearby discovery handles ways, removes duplicates and private places, and sorts by distance", () => {
  const result = placesFromOSM(
    [
      {
        type: "way",
        id: 1,
        center: { lat: 47.61, lon: -122.34 },
        tags: { name: "Garden", leisure: "park" },
      },
      {
        type: "node",
        id: 2,
        lat: 47.6091,
        lon: -122.342,
        tags: { name: "Coffee", amenity: "cafe" },
      },
      {
        type: "node",
        id: 3,
        lat: 47.6091,
        lon: -122.342,
        tags: { name: "Coffee", amenity: "cafe" },
      },
      {
        type: "node",
        id: 4,
        lat: 47.609,
        lon: -122.342,
        tags: { name: "Private court", access: "private" },
      },
      {
        type: "node",
        id: 5,
        lat: NaN,
        lon: -122.342,
        tags: { name: "Invalid" },
      },
      { type: "node", id: 6, lat: 47.609, lon: -122.342, tags: {} },
    ],
    47.609,
    -122.342,
  );
  assert.deepEqual(
    result.map((p) => p.name),
    ["Coffee", "Garden"],
  );
  assert.deepEqual(result[0].categories, ["queue", "open_closed"]);
  assert.equal(result[1].id, "osm-way-1");
});

test("nearby endpoint rejects invalid coordinates before contacting the provider", async () => {
  for (const query of [
    "",
    "?lat=hello&lng=12",
    "?lat=91&lng=12",
    "?lat=40&lng=181",
  ]) {
    const response = await GET(
      new Request(`http://localhost/api/nearby${query}`),
    );
    assert.equal(response.status, 400);
  }
});
