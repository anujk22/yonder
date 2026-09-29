# RevenueCat: the latest-answer purchase

Yonder's RevenueCat purchase is a **consumable** that unlocks the most recent answer to a question (answers from the last 24 hours; older ones are free). Collections are free and no longer use RevenueCat. Bounties and Scout payouts are simulated and do not go through RevenueCat; see [pricing and payments](../PAYMENTS.md).

On September 29, 2026, project **Yonder** (`4850e856`) was configured for the earlier Yonder Plus model (entitlement `yonder_plus`, non-consumable `yonder_plus_lifetime`). That setup is now unused by the app and must be updated as below.

## Dashboard configuration

1. In project **Yonder**, open the Test Store and create a **consumable** product `yonder_recent_answer`, priced at US $0.50.
2. Add it to the **current** offering (`default`) as a custom package, for example `recent_answer`. The app finds the package by product identifier and shows its localized price; it never invents one.
3. No entitlement is needed: each purchase unlocks one answer and is consumed.
4. The Test Store **public SDK key** (`test_…`) goes in `EXPO_PUBLIC_REVENUECAT_TEST_KEY` in `.env.local`, using `.env.example` as a starting point. Never use a secret `sk_…` key in the client.
5. Optional clean-up: remove the `$rc_lifetime` package from the current offering so the old Plus product isn't offered anywhere.

## Run an actual native development build

```sh
npm ci
cp .env.example .env.local
# Fill the public SDK key, then:
npx expo run:ios
# Or, on a configured Android development machine:
npx expo run:android
```

The first native build needs the usual Xcode/CocoaPods or Android toolchain. Expo Go and the web preview deliberately cannot purchase. Restart Metro after changing keys; installing the SDK requires rebuilding the native app. On this Mac, select `/Applications/Xcode.app/Contents/Developer` as `DEVELOPER_DIR` if the system points at command-line tools. The app enables Expo SDK 57 scene support for Xcode/iOS 27. If you already have an older generated `ios/` folder, regenerate it with `npx expo prebuild --clean --platform ios` before building; preserve any manual native changes first.

Test Store keys are accepted only in development native builds. `eas build --profile preview` currently produces a release-mode simulator build: do not expect its Test Store key to activate. Use the debug build above for Test Store. Never ship a Test Store key as the Apple key.

## Required evidence, in order

- Fresh installation: Explore → NYC sample tour → basketball courts → Ask. The options screen shows a free answer from yesterday, the latest answer with the store price, and a $2 bounty.
- Tap the latest answer: the Test Store sheet appears with the configured price. Cancel it: nothing unlocks and no error is shown.
- Complete a test purchase: the answer opens with a "Latest answer purchased" receipt, and the transaction appears in the RevenueCat dashboard.
- Buy again for another question: a consumable can be bought repeatedly.
- Offline or missing package: no fabricated price and no unlocked answer; a clear message asks the user to try again.
- Save the native recording and dashboard event timestamp. Label test transactions as test transactions; they are not revenue.

Do not mark these passed on the strength of unit tests or web screenshots. In a [Shipaton Devpost discussion](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient), an organizer Manager explicitly confirmed that **Test Store is enough for Next Gen**. Test Store purchases are sandbox data, not revenue, and a Test Store key must never ship in a release build.

## Production iOS (needed for a store-based category)

Create a consumable In-App Purchase for the latest answer in App Store Connect (Apple's price points below $10 move in 10¢ steps ending in 9, so the closest price is $0.49), complete its localization, review screenshot and agreements, import it into RevenueCat and add it to the current offering. Put only the `appl_…` public key in the production EAS environment and remove the Test Store key.

Before selling answers in a public build, make sure what is sold is real: in demo mode the answers are samples, and charging real money for them would mislead buyers and risks App Review rejection. The earlier Yonder Plus IAP (`com.anujkakumanu.yonder.plus.lifetime`) no longer matches the app; withdraw or leave it unused rather than submitting it with this binary.

Sources: [Expo installation](https://www.revenuecat.com/docs/getting-started/installation/expo), [Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store), [organizer Next Gen answer](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient), [rules](https://revenuecat-shipaton-2026.devpost.com/rules).
