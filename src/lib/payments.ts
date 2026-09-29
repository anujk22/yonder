import type { Payout, TabCharge } from '@/lib/ledger';

/** Where bounty money would move. The app only ever calls this interface, so the
 * providers can be swapped without touching the bounty logic.
 *
 * Production plan (docs/PAYMENTS.md): an authenticated server holds the secret
 * keys, charges tabs with Stripe, and pays Scouts with a bank payout provider
 * such as Dwolla (Same Day ACH). None of that runs in this build.
 */
export type PaymentsAdapter = {
  chargeTab(charge: TabCharge): Promise<{ status: 'DEMO_ONLY' }>;
  sendPayout(payout: Payout): Promise<{ status: 'DEMO_ONLY' }>;
};

/** Demo adapter. Never accepts card or bank details and never sends a request. */
export const payments: PaymentsAdapter = {
  async chargeTab() {
    return { status: 'DEMO_ONLY' };
  },
  async sendPayout() {
    return { status: 'DEMO_ONLY' };
  },
};
