# Next Apple submission — September 29, 2026

This is a preparation package, not proof of submission or approval. Shipaton closes September 30 at 11:45 p.m. Pacific / October 1 at 2:45 a.m. EDT. Apple controls review timing. The Next Gen organizer accepts RevenueCat Test Store evidence, so complete that contest evidence independently of Apple review.

## Current facts and remaining gates

- App Store Connect app `6815955359`, bundle ID `com.anujkakumanu.yonder`, iOS version 1.0/build 7 was rejected for 2.1.0 Information Needed. The six-answer draft in `APP_REVIEW_RESPONSE_2026-09-29.md` describes that binary, which has no RevenueCat or invited pilot.
- New source has `react-native-purchases` 10.10.2; the local native dependency lock includes RevenueCat 5.90.2. Plus unlocks additional **local collections** with one non-consumable purchase. One collection, map search and saving places are free. Restore recovers Plus, not deleted collections.
- RevenueCat project `4850e856` has Test Store app `app98d2f2dbaa`, product `yonder_plus_lifetime` (US $2.99), entitlement `yonder_plus`, and current offering `default` / `$rc_lifetime`. An actual transaction is still unverified. These are Test Store records, not Apple product records.
- At initial inspection, EAS production had the API URL but no Apple public SDK key. Safari confirmed the Paid Apps Agreement is **New**, not Active. The owner is completing that agreement and any required banking/tax setup. Apple IAP and RevenueCat Apple credentials remain unconfigured.
- Root deployed and promoted deployment `gpo6kko0di` to `yonder.expo.app`; its unauthenticated Node checks returned privacy/support HTTP 200 with Plus text and place-search HTTP 200 with results. Signed-out Safari and the submitted device still need checking. Another tool's HTTP 403 is not evidence that the deployment is broken.

## Configure Apple and RevenueCat before the production binary

1. **Business:** verify the Paid Apps Agreement is **Active**, with required banking and tax information complete. Apple requires this even for sandbox IAP tests. Account Holder action may be necessary. [Apple setup](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases/).
2. **Monetization → In-App Purchases:** inspect for an existing matching product before creating one. Use the following minimal record; Apple product IDs cannot be edited or reused after deletion. Add English (U.S.) localization, price, availability and applicable tax category; clear every Missing Metadata field. [Apple fields](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information/).

| Field | Value |
| --- | --- |
| Type | Non-Consumable |
| Reference name | Yonder Plus Lifetime |
| Product ID | `com.anujkakumanu.yonder.plus.lifetime` |
| Display name | Yonder Plus |
| Description | Unlock additional local place collections. |
| Initial U.S. price | $2.99; confirm the selected Apple price point |
| Availability | United States, matching the app listing |
| Review screenshot | Actual iPhone Plus screen showing benefit and loaded localized Apple price |

The review screenshot is used by Apple only; it is not the optional 1024 × 1024 promotional image. Take it from the real Apple-configured build, not the Test Store notice or an unavailable price screen.

3. **RevenueCat → Yonder → Apps:** add Apple App Store app with exact bundle ID `com.anujkakumanu.yonder` and Apple app ID `6815955359`. Configure its **In-App Purchase key**: account owner generates/downloads the `.p8` under App Store Connect Users and Access → Integrations → In-App Purchase, uploads it directly to RevenueCat and supplies Key ID / Issuer ID. Confirm **Valid credentials**. React Native SDK ≥8 requires this for StoreKit 2 transaction processing. Keep the private key out of source, chat and client environment. [Required IAP key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration).
4. Add the Apple product in RevenueCat, attach it to `yonder_plus`, and map it to the Lifetime package `$rc_lifetime` in current offering `default`. The optional **App Store Connect API key** is a separate App Manager-or-higher credential for product/price import; it does not replace the required IAP key. Manual product configuration avoids adding that optional credential solely for import. [Import key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration).
5. Configure the RevenueCat-provided Apple Server Notification URL for both Production and Sandbox in Apple's App Information; use V2. This makes one-time refunds update automatically. [Notification setup](https://www.revenuecat.com/docs/platform-resources/server-notifications/apple-server-notifications).
6. Put only the Apple app's **public** `appl_…` SDK key in production EAS `EXPO_PUBLIC_REVENUECAT_APPLE_KEY`; retain `EXPO_PUBLIC_API_URL=https://yonder.expo.app`. Do not put a `test_…` or secret key in production. Do not enable the unverified Supabase pilot just to finish this release. Environment values are compiled into the binary; rebuild after setting them. [Release checklist](https://www.revenuecat.com/docs/test-and-launch/launch-checklist).

## Verify and prepare the review evidence

Build the new production binary, upload it, wait for processing, and test that exact build through TestFlight on a physical iPhone. Confirm the new build number; do not assume it is 8. TestFlight uses sandbox purchases, not real revenue.

- Fresh install → Explore → search/save a place → **Saved → Organize into collections** → create the free collection → **Explore Yonder Plus**.
- Show the localized Apple price, cancel once with no unlock, then complete an Apple sandbox purchase. Confirm `yonder_plus` active in RevenueCat and create a second collection.
- Relaunch, verify Plus and local lists; exercise Restore purchases with the same Apple purchase context. Verify no fake price/unlock after network failure. Record actual results and limits.
- Capture the Plus review screenshot and an unedited physical-device recording on the latest available iOS, beginning at launch. Show free discovery, collection gate, purchase, unlock and restore, plus the clearly labeled local Ask/Observe demo. Record device model, exact iOS version, date and exact build. Do not use the contest film as a substitute for Apple's requested recording.
- Open privacy/support links and test search on that device. The unavailable invited-pilot links are now guarded by `liveConfigured`; the local Ask/Observe demonstrations stay visible and explicitly labeled. Keep Supabase unconfigured in this submission.

## Privacy and review text

For this purchase implementation, RevenueCat is configured with no custom `appUserID`, email/customer attributes, IDFA collection or advertising integration in source. In App Privacy, disclose **Purchases → Purchase History**, used for **Analytics** and **App Functionality**. RevenueCat permits **not linked to identity** for anonymous IDs with no way to identify the user, and does not inherently track across apps for advertising. Confirm dashboard integrations do not change those answers. RevenueCat alone does not require card information, location or diagnostics disclosures. Reassess the complete app's search/hosting/map collection separately; do not select “Data Not Collected.” The bundled SDK privacy manifest does not replace App Store Connect answers. [RevenueCat privacy guidance](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy).

Use this IAP review note after testing:

> Yonder Plus is a one-time non-consumable that unlocks additional named place collections on this device. One collection, searching and saving places are free. Open Saved → Organize into collections; create a first collection, then tap Explore Yonder Plus. The purchase button displays the localized App Store price. Restore purchases is on that screen. Plus does not buy observations or pay observers. Collections do not sync; restore recovers the purchase entitlement only. No Yonder account is required.

Update all six Apple answers to the **new selected binary** before sending: replace build-7 purchase/service statements with verified Plus behavior; describe the pilot as disabled if absent; add the correct recording and permission details; confirm U.S. behavior and third-party material licenses. Do not send the old six-answer draft unchanged or claim unsupported rights clearance.

## Submit the complete package

Apple's current workflow requires the **first non-consumable and the app version in the same draft submission**. Add the IAP for review, include the app version with the new selected build, ensure both appear together, then Submit for Review. Resolve the existing rejection in App Review using Apple's displayed edit/update/resubmit flow; do not create a second app record. Confirm the visible submitted status for both items and save its timestamp. [First-IAP submission](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/), [unresolved issues](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/manage-a-submission-with-unresolved-issues/).

After the complete submission is in review, a truthful expedited-review request may cite the Shipaton event, its exact deadline and Yonder's participation. Apple accepts event-related requests at its discretion; no approval time is guaranteed. Continue the Next Gen source/video submission while Apple reviews. [Apple App Review and expedited requests](https://developer.apple.com/app-store/review/).
