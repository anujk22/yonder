/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, StoreApi } from 'zustand/vanilla';
import { createYonderState } from '../src/lib/state';
import { validateLocation, distanceMeters } from '../src/lib/geo';
import { sameQuestion } from '../src/lib/queryMatching';
import { splitBounty } from '../src/lib/pricing';
import { freshness } from '../src/lib/freshness';

const target = { latitude: 40.6975, longitude: -73.9975 };
const now = 100000;
const fix = { ...target, accuracy: 10, timestamp: now };
test('device check rejects stale, inaccurate, mocked, invalid and outside readings', () => {
  assert.equal(validateLocation(fix,target,75,now).valid,true);
  assert.equal(validateLocation({...fix,timestamp:now-31000},target,75,now).valid,false);
  assert.equal(validateLocation({...fix,accuracy:51},target,75,now).valid,false);
  assert.equal(validateLocation({...fix,mocked:true},target,75,now).valid,false);
  assert.equal(validateLocation({...fix,latitude:NaN},target,75,now).valid,false);
  assert.equal(validateLocation({...fix,latitude:41},target,75,now).valid,false);
  assert.equal(validateLocation({...fix,timestamp:now+6000},target,75,now).valid,false);
  // Being barely inside is insufficient when GPS uncertainty crosses the boundary.
  assert.equal(validateLocation({...fix,latitude:target.latitude+0.0006,accuracy:15},target,75,now).valid,false);
  assert.ok(Math.abs(distanceMeters(target,{...target,latitude:target.latitude+0.001})-111.19)<1);
});
test('freshness boundary and price normalization', () => {
  assert.equal(freshness(0,300,224000).band,'FRESH');
  assert.equal(freshness(0,300,225000).band,'AGING');
  assert.equal(freshness(0,300,300000).band,'STALE');
  for(const cents of [NaN,Infinity,-500,151,250]) { const price=splitBounty(cents);assert.ok(Number.isFinite(price.bountyCents));assert.ok(price.bountyCents>=150);assert.equal(price.observerRewardCents+price.platformFeeCents,price.bountyCents); }
});
test('answer reuse preserves the exact question including sizes', () => {
  assert.equal(sameQuestion('How long is the line at Joe’s Pizza?',"How long is the line at Joe's Pizza?"),true);
  assert.equal(sameQuestion('Is size 10 in stock?','Is size 11 in stock?'),false);
});
const draft = (store: StoreApi<ReturnType<typeof createYonderState>>, place='pier2', question='Are any basketball courts free?') => {
  store.getState().setResolvedPlace(place);store.getState().setDraftQuestion(question);return store.getState().createDraftQuery()!;
};
test('request completion charges once and never mixes reward into requester balance', () => {
  const store=createStore(createYonderState); const id=draft(store);store.getState().postActiveQuery();store.getState().acceptActiveTask();store.getState().updateQueryState(id,'VERIFYING');
  const answer=store.getState().completeObservation();assert.ok(answer);assert.equal(store.getState().walletCents,1850);assert.equal(store.getState().earnedCents,120);
  assert.equal(store.getState().completeObservation(),null);assert.equal(store.getState().walletCents,1850);assert.equal(store.getState().earnedCents,120);
});
test('device capture cannot create a simulated verified answer or payout', () => {
  const store=createStore(createYonderState);const id=draft(store);store.getState().postActiveQuery();store.getState().setCaptureMode('device');store.getState().updateQueryState(id,'VERIFYING');assert.equal(store.getState().completeObservation(),null);assert.equal(store.getState().walletCents,2000);assert.equal(store.getState().earnedCents,0);
});
test('cached answers charge only once and reject a different question', () => {
  const store=createStore(createYonderState);draft(store,'nikesoho','Is the black Pegasus 41 in a 10 at Nike SoHo?');store.getState().chooseCachedAnswer('seed-nike-stock',15);assert.equal(store.getState().walletCents,1985);store.getState().chooseCachedAnswer('seed-nike-stock',15);assert.equal(store.getState().walletCents,1985);
  draft(store,'nikesoho','Is the black Pegasus 41 in a 11 at Nike SoHo?');store.getState().chooseCachedAnswer('seed-nike-stock',15);assert.equal(store.getState().walletCents,1985);
});
test('insufficient credits, cancellation and released tasks keep the ledger consistent', () => {
  const store=createStore(createYonderState);store.setState({walletCents:200});const id=draft(store);store.getState().postActiveQuery();const second=draft(store);store.getState().postActiveQuery();assert.equal(store.getState().queries.find(q=>q.id===second)?.state,'DRAFT');
  store.getState().cancelQuery(id);store.getState().postActiveQuery();assert.equal(store.getState().queries.find(q=>q.id===second)?.state,'OPEN');
  store.getState().releaseActiveTask('try later');assert.equal(store.getState().queries.find(q=>q.id===second)?.isNew,true);
  store.getState().blockActivePlace();store.getState().blockActivePlace();assert.equal(store.getState().walletCents,200);
});
test('unsafe and blocked requests cannot be created through the store', () => {
  const store=createStore(createYonderState);assert.equal(draft(store,'applesq'),null);assert.equal(draft(store,'pier2','Follow my ex'),null);
});
test('unknown questions produce no confident sample and no charge', () => {
  const store=createStore(createYonderState);const id=draft(store,'wsp','Is it crowded?');store.getState().postActiveQuery();store.getState().updateQueryState(id,'VERIFYING');assert.ok(store.getState().completeObservation());assert.equal(store.getState().walletCents,2000);assert.equal(store.getState().earnedCents,0);
});
