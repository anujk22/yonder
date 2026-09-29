import { OBSERVERS_NEARBY, QueryType } from '@/lib/places';

const BASE: Record<QueryType, number> = {
  availability: 90,
  queue: 100,
  crowd: 80,
  condition: 110,
  stock_check: 140,
  accessibility: 70,
  open_closed: 70,
};

// Bounty economics (see docs/PAYMENTS.md for the fee math behind these numbers).
// Yonder keeps a flat $1 of the minimum $2 bounty. Above the minimum it only adds
// the card processing cost of the extra amount, so Yonder's profit per bounty
// stays the same no matter how large the bounty is.
export const MIN_BOUNTY_CENTS = 200;
export const BASE_FEE_CENTS = 100;
export const FEE_RATE_ABOVE_MIN = 0.03;
export const BOUNTY_STEP_CENTS = 50;

// Answer tiers: the newest answer from the last day is sold through RevenueCat;
// anything at least a day old is free.
export const RECENT_ANSWER_CENTS = 50;
export const FREE_ANSWER_AGE_MS = 24 * 60 * 60_000;

const DEMO_BOUNTIES: Record<string, number> = {
  'pier2:availability': 200,
  'joes:queue': 250,
  'unionsq:accessibility': 200,
  'nikesoho:stock_check': 300,
};

const roundToFiveCents = (cents: number) => Math.round(cents / 5) * 5;

export const platformFeeFor = (bountyCents: number) =>
  BASE_FEE_CENTS + Math.round(Math.max(0, bountyCents - MIN_BOUNTY_CENTS) * FEE_RATE_ABOVE_MIN);

export const splitBounty = (rawBountyCents: number) => {
  const bountyCents = Math.max(MIN_BOUNTY_CENTS, roundToFiveCents(Number.isFinite(rawBountyCents) ? rawBountyCents : MIN_BOUNTY_CENTS));
  const platformFeeCents = platformFeeFor(bountyCents);
  return {
    bountyCents,
    observerRewardCents: bountyCents - platformFeeCents,
    platformFeeCents,
  };
};

export type AnswerTier = 'recent' | 'free';

export const answerTier = (observedAt: number, now = Date.now()): AnswerTier =>
  now - observedAt < FREE_ANSWER_AGE_MS ? 'recent' : 'free';

export const answerPriceCents = (observedAt: number, now = Date.now()) =>
  answerTier(observedAt, now) === 'recent' ? RECENT_ANSWER_CENTS : 0;

export const priceQuery = (placeId: string, queryType: QueryType, deadlineMinutes: number) => {
  const demoBountyCents = DEMO_BOUNTIES[`${placeId}:${queryType}`];
  if (demoBountyCents) {
    // DEMO: deterministic path for recording. Real implementation below.
    const urgency = deadlineMinutes <= 5 ? 1.35 : deadlineMinutes <= 15 ? 1.1 : 1;
    return splitBounty(demoBountyCents * (urgency / 1.1));
  }

  const observersNearby = OBSERVERS_NEARBY[placeId] ?? 0;
  const supply = observersNearby >= 8 ? 0.8 : observersNearby >= 3 ? 1 : 1.9;
  const urgency = deadlineMinutes <= 5 ? 1.35 : deadlineMinutes <= 15 ? 1.1 : 1;
  return splitBounty(BASE[queryType] * supply * urgency);
};

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
