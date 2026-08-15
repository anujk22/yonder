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

const DEMO_PRICES: Record<string, { bountyCents: number; observerRewardCents: number; platformFeeCents: number }> = {
  'pier2:availability': { bountyCents: 125, observerRewardCents: 100, platformFeeCents: 25 },
  'joes:queue': { bountyCents: 165, observerRewardCents: 140, platformFeeCents: 25 },
  'unionsq:accessibility': { bountyCents: 115, observerRewardCents: 90, platformFeeCents: 25 },
  'nikesoho:stock_check': { bountyCents: 210, observerRewardCents: 185, platformFeeCents: 25 },
};

export const priceQuery = (placeId: string, queryType: QueryType, deadlineMinutes: number) => {
  const demo = DEMO_PRICES[`${placeId}:${queryType}`];
  if (demo) {
    const urgency = deadlineMinutes <= 5 ? 1.35 : deadlineMinutes <= 15 ? 1.1 : 1;
    const observerRewardCents = Math.round(demo.observerRewardCents * (urgency / 1.1));
    return {
      bountyCents: observerRewardCents + demo.platformFeeCents,
      observerRewardCents,
      platformFeeCents: demo.platformFeeCents,
    };
  }

  const observersNearby = OBSERVERS_NEARBY[placeId] ?? 0;
  const supply = observersNearby >= 8 ? 0.8 : observersNearby >= 3 ? 1 : 1.9;
  const urgency = deadlineMinutes <= 5 ? 1.35 : deadlineMinutes <= 15 ? 1.1 : 1;
  const bountyCents = Math.round(BASE[queryType] * supply * urgency);
  const platformFeeCents = Math.max(15, Math.round(bountyCents * 0.2));
  return { bountyCents, observerRewardCents: bountyCents - platformFeeCents, platformFeeCents };
};

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
