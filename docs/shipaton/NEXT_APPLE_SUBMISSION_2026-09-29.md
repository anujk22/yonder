# Next Apple submission — September 29, 2026

This is a preparation package, not proof of submission or approval. Shipaton closes September 30 at 11:45 p.m. Pacific / October 1 at 2:45 a.m. EDT. Apple controls review timing. The Next Gen organizer accepts RevenueCat Test Store evidence, so complete that contest evidence independently of Apple review.

## Current facts and remaining gates

- App Store Connect app `6815955359`, bundle ID `com.anujkakumanu.yonder`, iOS version 1.0/build 7 was rejected for 2.1.0 Information Needed. The six-answer draft in `APP_REVIEW_RESPONSE_2026-09-29.md` describes that binary, which has no RevenueCat or invited pilot.
- New source has `react-native-purchases` 10.10.2; the local native dependency lock includes RevenueCat 5.90.2. Plus unlocks additional **local collections** with one non-consumable purchase. One collection, map search and saving places are free. Restore recovers Plus, not deleted collections.
- RevenueCat project `4850e856` has Test Store app `app98d2f2dbaa`, product `yonder_plus_lifetime` (US $2.99), entitlement `yonder_plus`, and current offering `default` / `$rc_lifetime`. An actual transaction is still unverified. These are Test Store records, not Apple product records.
- W9 tax information, banking and the Paid Apps Agreement are **Active**, verified in App Store Connect on September 29. The owner generated the required In-App Purchase key and authorized its upload; RevenueCat Apple app `appccfec4b19f` shows **Valid credentials**.
- Apple non-consumable `6817497507`, product ID `com.anujkakumanu.yonder.plus.lifetime`, has U.S. availability, $2.99 pricing and English localization saved. Its review screenshot and notes are still pending.
- RevenueCat freshly loaded entitlement details confirm both the Apple SKU and Test Store product attached to `yonder_plus`; current `default` / `$rc_lifetime` maps the Apple SKU. EAS production contains only `EXPO_PUBLIC_API_URL=https://yonder.expo.app` and the Apple `appl_…` public SDK key. No Test Store key is present at project or account scope; `.env.local` is excluded by `.easignore`'s `.env*.local` rule.
- Production iOS **1.0.0 build 8** started from revision `77d099c` on September 29. EAS ID `e6f6041d-51dc-4035-8367-101ee773234d`, last observed **IN_PROGRESS**; [build status and logs](https://expo.dev/accounts/bluetrox/projects/yonder/builds/e6f6041d-51dc-4035-8367-101ee773234d). No auto-submission was requested. Completion, Apple upload and actual device QA remain pending.
- Dedicated iPhone 18 Pro Max / iOS 27 simulator Debug and Release first/cold launches rendered correctly. A clean, frame-free native Release JPEG (1320 × 2868, no alpha) was accepted in Apple's 6.9-inch screenshot slot. This UI baseline omitted purchase keys; it does not prove build 8 purchases. CUA could not control Device Hub, so native tap-through, purchase/restore and camera/location flows remain unverified. Companion web QA passed real place search/save, collection membership and persistence, local pin creation, clearly labeled Ask/Observe demo navigation, and disabled web purchasing. Simulator/web evidence cannot replace Apple's requested physical-device recording.
- Production and Sandbox server notification URLs are saved to RevenueCat in App Information. The listing description now includes free/local collections, the one-time Plus purchase, U.S. search coverage, and the separation between real Plus purchases and simulated demo credits/rewards.
- Latest hosting deployment is `clr7lgc7zg` at `yonder.expo.app`; the privacy page passed signed-out in-app-browser inspection. Earlier unauthenticated HTTP checks passed privacy/support and place search. Verify links and search in the submitted device build. A clean public clone of revision `83964da` passed installation, tests, typecheck, lint, all-platform export and iOS scene configuration checks.
- App Privacy was updated and published on September 29: Search History for App Functionality, linked to identity; Purchase History for App Functionality and Analytics, not linked to identity; no tracking. Camera and location prompt descriptions now accurately describe optional local device checks and map centering; Expo introspection verified the generated iOS values.

## Configure Apple and RevenueCat before the production binary

1. **Business:** verify the Paid Apps Agreement is **Active**, with required banking and tax information complete. Apple requires this even for sandbox IAP tests. Account Holder action may be necessary. [Apple setup](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/).
2. **Monetization → In-App Purchases:** finish existing product `6817497507`; do not create a duplicate. Confirm applicable tax category and clear every Missing Metadata field. Saved values and the outstanding screenshot are below. [Apple fields](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information/).

| Field | Value |
| --- | --- |
| Type | Non-Consumable |
| Reference name | Yonder Plus Lifetime |
| Product ID | `com.anujkakumanu.yonder.plus.lifetime` |
| Display name | Yonder Plus |
| Description | Unlock additional local place collections. |
| Initial U.S. price | $2.99 saved |
| Availability | United States, matching the app listing |
| Review screenshot | Actual iPhone Plus screen showing benefit and loaded localized Apple price |

The review screenshot is used by Apple only; it is not the optional 1024 × 1024 promotional image. Take it from the real Apple-configured build, not the Test Store notice or an unavailable price screen.

3. **RevenueCat Apple credentials — complete:** Apple app `appccfec4b19f` has exact bundle ID `com.anujkakumanu.yonder`, Apple app ID `6815955359` and **Valid credentials**. React Native SDK ≥8 requires this In-App Purchase key for StoreKit 2 transaction processing. Keep the private key out of source, chat and client environment. [Required IAP key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration).
4. **Product mapping — complete:** the Apple product is attached to `yonder_plus` and mapped to `$rc_lifetime` in current offering `default`. The optional **App Store Connect API key** is a separate credential for product/price import; it does not replace the required IAP key. [Import key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration).
5. **Server notifications — saved:** RevenueCat's destination is configured for both Production and Sandbox in Apple's App Information. The current Apple UI did not expose a notification-version selector; delivery has not been tested. Verify notification delivery during device purchase testing. [Notification setup](https://www.revenuecat.com/docs/platform-resources/server-notifications/apple-server-notifications).
6. **Production environment — complete:** only the Apple public SDK key and API URL are configured; the build CLI confirmed loading those two names. Keep the unverified Supabase pilot disabled. Environment values are compiled into the binary; rebuild after changing them. [Release checklist](https://www.revenuecat.com/docs/test-and-launch/launch-checklist).

## Verify and prepare the review evidence

After EAS build 8 finishes, upload it, wait for processing, and test that exact build through TestFlight on a physical iPhone. TestFlight uses sandbox purchases, not real revenue. Do not resubmit to App Review until device QA, the review screenshot and Apple's requested recording are ready.

- Fresh install → Explore → search/save a place → **Saved → Organize into collections** → create the free collection → **Explore Yonder Plus**.
- Show the localized Apple price, cancel once with no unlock, then complete an Apple sandbox purchase. Confirm `yonder_plus` active in RevenueCat and create a second collection.
- Relaunch, verify Plus and local lists; exercise Restore purchases with the same Apple purchase context. Verify no fake price/unlock after network failure. Record actual results and limits.
- Capture the Plus review screenshot and an unedited physical-device recording on the latest available iOS, beginning at launch. Show free discovery, collection gate, purchase, unlock and restore, plus the clearly labeled local Ask/Observe demo. Record device model, exact iOS version, date and exact build. Do not use the contest film as a substitute for Apple's requested recording.
- Open privacy/support links and test search on that device. The unavailable invited-pilot links are now guarded by `liveConfigured`; the local Ask/Observe demonstrations stay visible and explicitly labeled. Keep Supabase unconfigured in this submission.

## Privacy and review text

For this purchase implementation, RevenueCat is configured with no custom `appUserID`, email/customer attributes, IDFA collection or advertising integration in source. In App Privacy, disclose **Purchases → Purchase History**, used for **Analytics** and **App Functionality**. RevenueCat permits **not linked to identity** for anonymous IDs with no way to identify the user, and does not inherently track across apps for advertising. Confirm dashboard integrations do not change those answers. RevenueCat alone does not require card information, location or diagnostics disclosures. Reassess the complete app's search/hosting/map collection separately; do not select “Data Not Collected.” The bundled SDK privacy manifest does not replace App Store Connect answers. [RevenueCat privacy guidance](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy).

Disclose **Search History → App Functionality** because the place-search server retains readable query terms beyond the request. The cache itself has no user mapping; assess hosting/provider logs before choosing identity linkage. Device-only photos/location/local lists are not collection; Apple says its own MapKit collection is not the developer's disclosure responsibility. [Apple privacy definitions](https://developer.apple.com/app-store/app-privacy-details/).

Use this IAP review note after testing:

> Yonder Plus is a one-time non-consumable that unlocks additional named place collections on this device. One collection, searching and saving places are free. Open Saved → Organize into collections; create a first collection, then tap Explore Yonder Plus. The purchase button displays the localized App Store price. Restore purchases is on that screen. Plus does not buy observations or pay observers. Collections do not sync; restore recovers the purchase entitlement only. No Yonder account is required.

Use `APPLE_REVIEW_REPLACEMENT_DRAFT_2026-09-29.md` for the **new selected binary** after verifying its purchase and physical-device evidence. It remains a draft. Do not send the old build-7 six-answer response unchanged.

## Submit the complete package

Apple's current workflow requires the **first non-consumable and the app version in the same draft submission**. Add the IAP for review, include the app version with the new selected build, ensure both appear together, then Submit for Review. Resolve the existing rejection in App Review using Apple's displayed edit/update/resubmit flow; do not create a second app record. Confirm the visible submitted status for both items and save its timestamp. [First-IAP submission](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/), [unresolved issues](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/manage-a-submission-with-unresolved-issues/).

After the complete submission is in review, a truthful expedited-review request may cite the Shipaton event, its exact deadline and Yonder's participation. Apple accepts event-related requests at its discretion; no approval time is guaranteed. Continue the Next Gen source/video submission while Apple reviews. [Apple App Review and expedited requests](https://developer.apple.com/app-store/review/).
