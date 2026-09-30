# RevenueCat: Yonder Plus subscription

Asking and answering checks are free. **Yonder Plus** is a monthly or yearly subscription on the `yonder_plus` entitlement. It adds:

- 1 and 2 hour check windows (free: up to 30 minutes)
- up to 10 open checks at once (free: 3)
- unlimited collections (free: 1)

The first two are enforced by the database (`has_plus()` in `supabase/migrations/20261001000000_accessibility_and_plus.sql`). The client only shows the options. The server learns about Plus from a RevenueCat webhook, so a modified app can't grant itself Plus.

## Dashboard configuration

1. Project **Yonder** (`4850e856`), Test Store app:
   - Product `yonder_plus_monthly`: auto-renewing, 1 month, $2.99, **1-week free trial**.
   - Product `yonder_plus_annual`: auto-renewing, 1 year, $19.99, **1-week free trial**.
2. Attach both to the existing entitlement **`yonder_plus`**. The old `yonder_plus_lifetime` can stay attached so earlier testers keep Plus.
3. In the **current** offering (`default`), add packages **`$rc_monthly`** and **`$rc_annual`** with those products, and remove `$rc_lifetime`. The paywall reads `packageType` MONTHLY and ANNUAL, prices and trial terms from the offering, and never hardcodes a price.
4. The Test Store public key (`test_…`) goes in `EXPO_PUBLIC_REVENUECAT_TEST_KEY` in `.env.local`. Never put a secret `sk_…` key in the client.

## Server sync (webhook)

The app calls `Purchases.logIn(<Supabase user id>)` after sign-in, so RevenueCat's app user id is the Yonder account id.

1. Deploy the function:

   ```sh
   supabase functions deploy revenuecat-webhook --no-verify-jwt
   supabase secrets set REVENUECAT_WEBHOOK_AUTH="<long random string>" REVENUECAT_SECRET_KEY="<v1 secret key>"
   ```

2. Apply the migrations (`supabase db push`).
3. In RevenueCat → Integrations → Webhooks:
   - URL: `https://<project>.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization header: the same `REVENUECAT_WEBHOOK_AUTH` value.

On every event, the function reads the subscriber's current state from RevenueCat and upserts or deletes `plus_members`. Retries and out-of-order events therefore converge on the same result. Anonymous (not signed-in) purchasers are skipped until they sign in: `logIn` merges their purchase into the account and triggers a new event.

**Privacy note:** tying purchases to the account means purchase history is now linked to the user's identity. Update the privacy page and store privacy answers before a build with this code ships.

## Run a native development build

```sh
npm ci
cp .env.example .env.local   # fill the public keys
npx expo run:ios             # or: npx expo run:android
```

Expo Go and the web preview cannot purchase. Test Store keys only activate in development native builds.

## Evidence to record (native, Test Store)

- **Paywall:** Settings → Explore Yonder Plus shows the monthly and yearly plans, with prices and "1 week free" from the offering.
- **Cancel:** cancelling the Test Store sheet unlocks nothing and shows no error.
- **Trial start:**
  - completing the purchase shows "Welcome to Plus";
  - Collections now allows a second collection;
  - the new-check screen offers 1 hr and 2 hr.
- **Server sync:**
  - `plus_members` has the user's row with the expiry;
  - a 1 hr check is accepted;
  - an 11th open check is refused.
- **Restore:** Settings → Restore purchases brings Plus back after reinstalling.
- **Manage subscription:** opens the store's subscription page.

Test Store purchases are sandbox data, not revenue. An organizer [confirmed Test Store is enough for Next Gen](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient).

Sources: [Expo installation](https://www.revenuecat.com/docs/getting-started/installation/expo), [Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store), [identifying users](https://www.revenuecat.com/docs/customers/identifying-customers), [webhooks](https://www.revenuecat.com/docs/integrations/webhooks).
