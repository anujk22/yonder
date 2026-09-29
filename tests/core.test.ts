/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, StoreApi } from 'zustand/vanilla';
import { createYonderState, isQueryExpired } from '../src/lib/state';
import { validateLocation, distanceMeters } from '../src/lib/geo';
import { sameQuestion } from '../src/lib/queryMatching';
import { answerPriceCents, splitBounty } from '../src/lib/pricing';
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
  for(const cents of [NaN,Infinity,-500,151,250,4995]) { const price=splitBounty(cents);assert.ok(Number.isFinite(price.bountyCents));assert.ok(price.bountyCents>=200);assert.equal(price.observerRewardCents+price.platformFeeCents,price.bountyCents); }
});
test('Yonder keeps $1 of a $2 bounty plus 3% of anything above it', () => {
  assert.deepEqual(splitBounty(200),{bountyCents:200,observerRewardCents:100,platformFeeCents:100});
  assert.deepEqual(splitBounty(500),{bountyCents:500,observerRewardCents:391,platformFeeCents:109});
  assert.deepEqual(splitBounty(1000),{bountyCents:1000,observerRewardCents:876,platformFeeCents:124});
  assert.deepEqual(splitBounty(2000),{bountyCents:2000,observerRewardCents:1846,platformFeeCents:154});
});
test('the latest answer from the last day costs 50 cents; a day or more old is free', () => {
  const day=24*60*60_000;
  assert.equal(answerPriceCents(now-60_000,now),50);
  assert.equal(answerPriceCents(now-day+1,now),50);
  assert.equal(answerPriceCents(now-day,now),0);
  assert.equal(answerPriceCents(now-3*day,now),0);
});
test('answer reuse preserves the exact question including sizes', () => {
  assert.equal(sameQuestion('How long is the line at Joe’s Pizza?',"How long is the line at Joe's Pizza?"),true);
  assert.equal(sameQuestion('Is size 10 in stock?','Is size 11 in stock?'),false);
});
const draft = (store: StoreApi<ReturnType<typeof createYonderState>>, place='pier2', question='Are any basketball courts free?') => {
  store.getState().setResolvedPlace(place);store.getState().setDraftQuestion(question);return store.getState().createDraftQuery()!;
};
test('an answered bounty bills the poster once and pays the Scout once', () => {
  const store=createStore(createYonderState); const id=draft(store);store.getState().postActiveQuery();store.getState().acceptActiveTask();store.getState().updateQueryState(id,'VERIFYING');
  const answer=store.getState().completeObservation();assert.ok(answer);
  let {tab,payouts}=store.getState();
  // A new poster is charged right away rather than put on a tab.
  assert.equal(tab.charges.length,1);assert.equal(tab.charges[0].amountCents,200);assert.equal(tab.openCents,0);
  assert.equal(payouts.length,1);assert.equal(payouts[0].amountCents,100);assert.equal(payouts[0].queryId,id);
  assert.equal(store.getState().completeObservation(),null);
  ({tab,payouts}=store.getState());assert.equal(tab.charges.length,1);assert.equal(payouts.length,1);
});
test('device capture cannot create a simulated verified answer or payout', () => {
  const store=createStore(createYonderState);const id=draft(store);store.getState().postActiveQuery();store.getState().setCaptureMode('device');store.getState().updateQueryState(id,'VERIFYING');assert.equal(store.getState().completeObservation(),null);assert.equal(store.getState().tab.charges.length,0);assert.equal(store.getState().payouts.length,0);
});
test('answers unlock only at their tier price and never for a different question', () => {
  const store=createStore(createYonderState);
  let id=draft(store,'nikesoho','Is the black Pegasus 41 in a 10 at Nike SoHo?');
  store.getState().chooseCachedAnswer('seed-nike-stock',15);assert.equal(store.getState().queries.find(q=>q.id===id)?.state,'DRAFT');
  store.getState().chooseCachedAnswer('seed-nike-stock',0);assert.equal(store.getState().queries.find(q=>q.id===id)?.state,'DRAFT');
  store.getState().chooseCachedAnswer('seed-nike-stock',50);
  const bought=store.getState().queries.find(q=>q.id===id)!;assert.equal(bought.state,'ANSWERED');assert.equal(bought.bountyCents,50);assert.equal(bought.observerRewardCents,0);
  id=draft(store,'nikesoho','Is the black Pegasus 41 in a 11 at Nike SoHo?');store.getState().chooseCachedAnswer('seed-nike-stock',50);assert.equal(store.getState().queries.find(q=>q.id===id)?.state,'DRAFT');
  // The basketball courts have both tiers: a recent paid answer and a free one from yesterday.
  id=draft(store);store.getState().chooseCachedAnswer('seed-pier2-yesterday',0);assert.equal(store.getState().queries.find(q=>q.id===id)?.state,'ANSWERED');
  id=draft(store);store.getState().chooseCachedAnswer('seed-pier2-last',50);assert.equal(store.getState().queries.find(q=>q.id===id)?.state,'ANSWERED');
  assert.equal(store.getState().tab.charges.length,0);
});
test('the unpaid-bounty limit, cancellation and released tasks keep the ledger consistent', () => {
  const store=createStore(createYonderState);
  // A trusted poster with $4.50 already on their tab: two open $2 bounties fit under $10, a third doesn't.
  store.setState(s=>({tab:{...s.tab,openCents:450,openedAt:Date.now(),charges:[{id:'c1',amountCents:200,queryIds:['a'],at:0},{id:'c2',amountCents:200,queryIds:['b'],at:0}]}}));
  const id=draft(store);store.getState().postActiveQuery();draft(store);store.getState().postActiveQuery();
  const third=draft(store);store.getState().postActiveQuery();assert.equal(store.getState().queries.find(q=>q.id===third)?.state,'DRAFT');
  store.getState().cancelQuery(id);store.getState().postActiveQuery();assert.equal(store.getState().queries.find(q=>q.id===third)?.state,'OPEN');
  store.getState().releaseActiveTask('try later');assert.equal(store.getState().queries.find(q=>q.id===third)?.isNew,true);
  store.getState().blockActivePlace();store.getState().blockActivePlace();assert.equal(store.getState().tab.openCents,450);assert.equal(store.getState().payouts.length,0);
});
test('request deadline begins when posted and expired requests cannot be accepted', () => {
  const store=createStore(createYonderState);const id=draft(store);
  store.setState(s=>({queries:s.queries.map(q=>q.id===id?{...q,createdAt:Date.now()-11*60_000}:q)}));
  store.getState().postActiveQuery();
  let query=store.getState().queries.find(q=>q.id===id)!;
  assert.equal(query.state,'OPEN');assert.equal(isQueryExpired(query),false);
  assert.ok(Date.now()-query.createdAt<1000);
  store.setState(s=>({queries:s.queries.map(q=>q.id===id?{...q,createdAt:Date.now()-11*60_000}:q)}));
  store.getState().acceptActiveTask();
  query=store.getState().queries.find(q=>q.id===id)!;
  assert.equal(isQueryExpired(query),true);assert.equal(query.state,'OPEN');
  assert.equal(isQueryExpired(store.getState().queries.find(q=>q.id==='seed-pier2')!),false);
});
test('blocking a place closes every outstanding check there', () => {
  const store=createStore(createYonderState);
  const first=draft(store);store.getState().postActiveQuery();
  const second=draft(store);store.getState().postActiveQuery();
  store.getState().setActiveTask(first);store.getState().blockActivePlace();
  assert.equal(store.getState().places.find(p=>p.id==='pier2')?.status,'blocked');
  for(const id of [first,second]) assert.equal(store.getState().queries.find(q=>q.id===id)?.state,'BLOCKED');
  store.getState().setActiveTask(second);store.getState().acceptActiveTask();
  assert.equal(store.getState().queries.find(q=>q.id===second)?.state,'BLOCKED');
});
test('unsafe and blocked requests cannot be created through the store', () => {
  const store=createStore(createYonderState);assert.equal(draft(store,'applesq'),null);assert.equal(draft(store,'pier2','Follow my ex'),null);
});
test('a persisted verifying request at a blocked place cannot settle', () => {
  const store=createStore(createYonderState);const id=draft(store);store.getState().postActiveQuery();
  store.getState().updateQueryState(id,'VERIFYING');
  store.setState(s=>({places:s.places.map(p=>p.id==='pier2'?{...p,status:'blocked' as const}:p)}));
  const answers=store.getState().answers.length;
  assert.equal(store.getState().completeObservation(),null);
  assert.equal(store.getState().answers.length,answers);
  assert.equal(store.getState().tab.charges.length,0);assert.equal(store.getState().payouts.length,0);
});
test('unknown questions produce no confident sample and no charge', () => {
  const store=createStore(createYonderState);const id=draft(store,'wsp','Is it crowded?');store.getState().postActiveQuery();store.getState().updateQueryState(id,'VERIFYING');assert.ok(store.getState().completeObservation());assert.equal(store.getState().tab.charges.length,0);assert.equal(store.getState().payouts.length,0);
});
