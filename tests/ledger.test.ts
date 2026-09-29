/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import { addBountyToTab, bankArrival, canPostBounty, emptyTab, settleTab, TAB_MAX_AGE_MS } from '../src/lib/ledger';

const t0 = new Date(2026, 8, 29, 10, 0).getTime(); // Tuesday 10:00

test('new posters are charged per bounty until two charges succeed', () => {
  let tab = addBountyToTab(emptyTab(), 'q1', 200, t0);
  tab = addBountyToTab(tab, 'q2', 200, t0);
  assert.deepEqual(tab.charges.map(c => c.amountCents), [200, 200]);
  assert.equal(tab.openCents, 0);
  tab = addBountyToTab(tab, 'q3', 200, t0);
  assert.equal(tab.charges.length, 2);
  assert.equal(tab.openCents, 200);
  assert.deepEqual(tab.openQueryIds, ['q3']);
});

test('a trusted tab is charged once it reaches $5, covering every bounty on it', () => {
  let tab = addBountyToTab(addBountyToTab(emptyTab(), 'a', 200, t0), 'b', 200, t0);
  tab = addBountyToTab(tab, 'q1', 200, t0);
  tab = addBountyToTab(tab, 'q2', 200, t0);
  assert.equal(tab.openCents, 400);
  tab = addBountyToTab(tab, 'q3', 200, t0);
  assert.equal(tab.openCents, 0);
  assert.deepEqual(tab.charges.at(-1), { id: tab.charges.at(-1)!.id, amountCents: 600, queryIds: ['q1', 'q2', 'q3'], at: t0 });
});

test('the same bounty is never billed twice', () => {
  let tab = addBountyToTab(emptyTab(), 'q1', 200, t0);
  tab = addBountyToTab(tab, 'q1', 200, t0);
  assert.equal(tab.charges.length, 1);
  assert.equal(tab.openCents, 0);
});

test('a small tab is charged after seven days', () => {
  let tab = addBountyToTab(addBountyToTab(emptyTab(), 'a', 200, t0), 'b', 200, t0);
  tab = addBountyToTab(tab, 'q1', 200, t0);
  assert.equal(settleTab(tab, t0 + TAB_MAX_AGE_MS - 1).openCents, 200);
  const settled = settleTab(tab, t0 + TAB_MAX_AGE_MS);
  assert.equal(settled.openCents, 0);
  assert.equal(settled.charges.at(-1)!.amountCents, 200);
});

test('posters cannot owe more than $10 across their tab and open requests', () => {
  const tab = { ...emptyTab(), openCents: 600 };
  assert.equal(canPostBounty(tab, 200, 200), true);
  assert.equal(canPostBounty(tab, 250, 200), false);
});

test('Scout payouts land the same business day before 3pm, otherwise the next one', () => {
  const day = (d: number, h: number) => new Date(2026, 8, d, h, 0).getTime();
  const arrives = (sent: number) => { const date = new Date(bankArrival(sent)); return [date.getDate(), date.getHours()]; };
  assert.deepEqual(arrives(day(29, 14)), [29, 23]); // Tuesday before cutoff
  assert.deepEqual(arrives(day(29, 16)), [30, 23]); // Tuesday after cutoff
  assert.deepEqual(arrives(new Date(2026, 9, 2, 16).getTime()), [5, 23]); // Friday after cutoff -> Monday
  assert.deepEqual(arrives(new Date(2026, 9, 3, 11).getTime()), [5, 23]); // Saturday -> Monday
});
