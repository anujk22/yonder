/** Pure money bookkeeping for bounties. Nothing here moves money; the payment
 * adapter (payments.ts) is what would talk to Stripe and the payout provider.
 *
 * Posters: bounties go on a running tab that is charged in one card payment,
 * so a single card fee covers several bounties.
 * Scouts: each accepted answer is paid out on its own, the same business day.
 */

export const TAB_CHARGE_AT_CENTS = 500;
export const TAB_MAX_AGE_MS = 7 * 24 * 60 * 60_000;
export const TAB_LIMIT_CENTS = 1000;
// New posters are charged per bounty until their card has succeeded this many times.
export const TRUSTED_AFTER_CHARGES = 2;
// Same Day ACH cutoff, local time. Later payouts land the next business day.
export const SAME_DAY_CUTOFF_HOUR = 15;

export type TabCharge = { id: string; amountCents: number; queryIds: string[]; at: number };

export type Tab = {
  openCents: number;
  openQueryIds: string[];
  openedAt: number | null;
  charges: TabCharge[];
};

export type Payout = { id: string; queryId: string; amountCents: number; sentAt: number; arrivesBy: number };

export const emptyTab = (): Tab => ({ openCents: 0, openQueryIds: [], openedAt: null, charges: [] });

export const isTrustedPoster = (tab: Tab) => tab.charges.length >= TRUSTED_AFTER_CHARGES;

/** Whether a poster can take on another bounty of this size right now.
 * `pendingCents` is what their other open requests would add if answered. */
export const canPostBounty = (tab: Tab, bountyCents: number, pendingCents: number) =>
  tab.openCents + pendingCents + bountyCents <= TAB_LIMIT_CENTS;

const chargeTab = (tab: Tab, now: number): Tab => ({
  openCents: 0,
  openQueryIds: [],
  openedAt: null,
  charges: [...tab.charges, { id: `charge-${now}-${tab.charges.length + 1}`, amountCents: tab.openCents, queryIds: tab.openQueryIds, at: now }],
});

/** Charges the tab if it has reached the threshold or been open too long. */
export const settleTab = (tab: Tab, now: number): Tab =>
  tab.openCents > 0 && (tab.openCents >= TAB_CHARGE_AT_CENTS || (tab.openedAt !== null && now - tab.openedAt >= TAB_MAX_AGE_MS))
    ? chargeTab(tab, now)
    : tab;

/** Adds an answered bounty to the poster's tab. New posters are charged at once. */
export const addBountyToTab = (tab: Tab, queryId: string, bountyCents: number, now: number): Tab => {
  if (tab.openQueryIds.includes(queryId) || tab.charges.some((charge) => charge.queryIds.includes(queryId))) return tab;
  const next: Tab = {
    ...tab,
    openCents: tab.openCents + bountyCents,
    openQueryIds: [...tab.openQueryIds, queryId],
    openedAt: tab.openedAt ?? now,
  };
  return isTrustedPoster(tab) ? settleTab(next, now) : chargeTab(next, now);
};

const isBusinessDay = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;

/** When a payout sent at `sentAt` reaches the Scout's bank (end of that business day). */
export const bankArrival = (sentAt: number) => {
  const date = new Date(sentAt);
  if (!isBusinessDay(date) || date.getHours() >= SAME_DAY_CUTOFF_HOUR) {
    do date.setDate(date.getDate() + 1); while (!isBusinessDay(date));
  }
  date.setHours(23, 59, 0, 0);
  return date.getTime();
};

export const createPayout = (queryId: string, amountCents: number, sentAt: number): Payout => ({
  id: `payout-${queryId}`,
  queryId,
  amountCents,
  sentAt,
  arrivesBy: bankArrival(sentAt),
});
