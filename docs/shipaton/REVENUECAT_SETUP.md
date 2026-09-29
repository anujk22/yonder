# Yonder Plus: finish the purchase integration

Implemented in this checkout. Account configuration and native transactions remain unverified.

## Dashboard configuration

1. Create/sign into your own RevenueCat account and create project **Yonder**.
2. Create entitlement `yonder_plus`.
3. In the project's Test Store, create a **non-consumable / lifetime** product `yonder_plus_lifetime` and attach it to `yonder_plus`.
4. Create an offering named `default`, make it current, add the Lifetime package (`$rc_lifetime`), and attach that product. The app reads this package's localized price; it does not invent a price.
5. Copy the Test Store **public SDK key** (`test_…`) into `EXPO_PUBLIC_REVENUECAT_TEST_KEY` in `.env.local`, using `.env.example` as a starting point. Never use a secret `sk_…` key in the client.

Recommended initial production price: US $2.99, one-time; configure regional prices in the store. This is a product recommendation, not a requirement or a configured price.

## Run an actual native development build

```sh
npm ci
cp .env.example .env.local
# Fill the public SDK key, then:
npx expo run:ios
# Or, on a configured Android development machine:
npx expo run:android
```

The first native build needs the usual Xcode/CocoaPods or Android toolchain. Expo Go and the web preview deliberately cannot purchase. Restart Metro after changing keys; installing the SDK requires rebuilding the native app. On this Mac, select `/Applications/Xcode.app/Contents/Developer` as `DEVELOPER_DIR` if the system points at command-line tools.

Test Store keys are accepted only in development native builds. `eas build --profile preview` currently produces a release-mode simulator build: do not expect its Test Store key to activate. Use the debug build above for Test Store. Never ship a Test Store key as the Apple key.

## Required evidence, in order

- Fresh installation: create one collection without paying. A second prompts Plus.
- Open Plus: actual configured price appears. Cancel the store dialog: no entitlement and no second collection.
- Complete a test purchase: `yonder_plus` appears active in RevenueCat and a second collection can be created.
- Restart the app: Plus is recognized; collection membership remains.
- Restore on a fresh installation using the same store context. Plus returns; local collections are not restored from RevenueCat.
- Refund/revoke in the test environment, refresh customer info: creating additional collections is blocked; existing lists remain available.
- Offline/missing offering: no fabricated price or successful purchase. Restore and retry report a useful result.
- Save the native recording and dashboard event timestamp. Label test transactions as test transactions; they are not revenue.

Do not mark these passed on the strength of unit tests or web screenshots. In a [Shipaton Devpost discussion](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient), an organizer Manager explicitly confirmed that **Test Store is enough for Next Gen**. The September 29 recheck resolves the earlier uncertainty about that category; the purchase, entitlement-backed unlock and dashboard evidence still need to happen in a native debug build. Test Store purchases are sandbox data, not revenue, and a Test Store key must never ship in a release build.

## Production iOS (needed for a store-based category)

Create the non-consumable `com.anujkakumanu.yonder.plus.lifetime` in App Store Connect; complete its localization, pricing, review screenshot and required agreements. Add the iOS app `com.anujkakumanu.yonder` to RevenueCat, configure Apple's credentials there, import the product, and attach it to the same entitlement and Lifetime package. Put only its `appl_…` public key in the production EAS environment. Remove the Test Store key from that environment. Verify in Apple sandbox before submitting the new binary and IAP.

Build 7 already submitted to Apple does not include this integration. Its approval alone cannot prove RevenueCat compliance. Do not cancel that submission just to run a Test Store demo. A new binary and reviewed IAP are a separate release step.

Before releasing: deploy the updated privacy/support pages, align App Store privacy disclosures with the actual RevenueCat configuration, and provide judge access where required. Check RevenueCat's current Apple privacy guidance rather than copying the old preview's disclosures.

Sources: [Expo installation](https://www.revenuecat.com/docs/getting-started/installation/expo), [Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store), [organizer Next Gen answer](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient), [rules](https://revenuecat-shipaton-2026.devpost.com/rules).
