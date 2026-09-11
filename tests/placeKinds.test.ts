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
