import test from 'node:test';
import assert from 'node:assert/strict';
import { kindFromTags } from '../src/lib/placeKinds';
import { artFor, categoryFor } from '../src/lib/discovery';
import { placesFromOSM } from '../src/lib/nearby';

test('provider tags preserve grocery, court and transit identity, with a neutral fallback', () => {
  assert.equal(kindFromTags({ shop: 'supermarket' }), 'grocery');
  assert.equal(kindFromTags({ sport: 'basketball', leisure: 'pitch' }), 'court');
  assert.equal(kindFromTags({ railway: 'station' }), 'transit');
  assert.equal(kindFromTags({}), 'map');
  const [place] = placesFromOSM([{ type: 'node', id: 1, lat: 40, lon: -74, tags: { name: 'Neighborhood Pantry', shop: 'supermarket' } }], 40, -74);
  assert.equal(artFor(place), 'grocery');
  assert.equal(categoryFor(place), 'Shopping');
});

test("place search bias accepts only rounded coordinates", async () => {
  const { viewboxFor } = await import("../src/app/api/places+api");
  assert.equal(viewboxFor("40.71,-74.01"), "-74.51,41.21,-73.51,40.21");
  for (const near of [null, "", "40.7128,-74.0060", "abc", "91,0", "40,-181"]) assert.equal(viewboxFor(near), null);
});
