/** Explicit local demo adapter. Never accepts credentials or sends payment requests.
 * Real escrow, payout and merchant verification belong on an authenticated server.
 */
export const shopify = {
  async createBountyEscrow(params: { queryId: string; bountyCents: number; observerRewardCents: number; platformFeeCents: number; placeName: string; question: string }) {
    return { queryId: params.queryId, status: 'DEMO_ONLY' as const };
  },
  async releaseObserverPayout(params: { queryId: string; answerId: string; observerRewardCents: number; platformFeeCents: number }) {
    return { queryId: params.queryId, status: 'DEMO_ONLY' as const };
  },
  async refundBounty(queryId: string, reason: string) {
    return { queryId, reason, status: 'DEMO_ONLY' as const };
  },
  async verifyMerchantLocations(): Promise<{ id: string; name: string }[]> {
    return [];
  },
};
