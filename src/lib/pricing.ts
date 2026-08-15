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

export const MIN_BOUNTY_CENTS = 150;
const PLATFORM_FEE_RATE = 0.20;

const DEMO_BOUNTIES: Record<string, number> = {
  'pier2:availability': 150,
  'joes:queue': 200,
  'unionsq:accessibility': 150,
  'nikesoho:stock_check': 250,
};

const roundToFiveCents = (cents: number) => Math.round(cents / 5) * 5;

export const splitBounty = (rawBountyCents: number) => {
  const bountyCents = Math.max(MIN_BOUNTY_CENTS, roundToFiveCents(rawBountyCents));
  const platformFeeCents = roundToFiveCents(bountyCents * PLATFORM_FEE_RATE);
  return {
    bountyCents,
    observerRewardCents: bountyCents - platformFeeCents,
    platformFeeCents,
  };
};

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
