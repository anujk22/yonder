# iOS release status (September 26, 2026)

**September 29 update:** App Store Connect now shows iOS 1.0, build 1.0.0 (7) as **Rejected**, with Guideline 2.1.0 App Completeness / Information Needed. Apple's message requests a physical-device recording and contextual answers; the visible message does not identify a crash or ban the local demo. See the [unsent response draft](docs/shipaton/APP_REVIEW_RESPONSE_2026-09-29.md). The checks and status below are the September 26 snapshot for **build 7**, not a description of the newer RevenueCat/Supabase working tree.

Submitted build 7 works as a **local product preview**. Its map, saved places and community pins are useful on one device. Requests, answers, dispatch, credits and rewards are simulated or local; no user can send a request to another user in that build. The store description and review notes must describe this accurately.

See [APP_STORE_MATERIALS.md](APP_STORE_MATERIALS.md) for listing copy, App Review notes, and the privacy inventory.

## Confirmed checks

- Expo SDK 57 / React Native 0.86; `npm run typecheck`, `npm run lint`, all 14 tests (`node --import tsx --test tests/*.test.ts`), and `npx expo export --platform ios` passed. The API-only web export also passes.
- Build 7 uses the green 3D Scout image at `assets/brand/concepts/yonder-scout-green-3d-v2.png` for the iOS icon. The icon was inspected inside the signed IPA.
- The [Expo project](https://expo.dev/projects/ccf2b54b-6734-43f5-8877-8a038e1c9703) is linked. `eas.json` has simulator preview and App Store production profiles; both resolve `EXPO_PUBLIC_API_URL=https://yonder.expo.app` through EAS environments.
- The API-only service is deployed at `https://yonder.expo.app`. `/support`, `/privacy`, and `/api/places` returned HTTP 200 in production on September 26; the public pages display Yonder as the contact. `/api/nearby` reproducibly returned HTTP 503 with upstream `Overpass HTTP 521`, so the release app no longer calls it.
- The simulator build launched on iOS 27 and supplied the real iPhone screenshot uploaded to App Store Connect. Camera and location permission flows remain unverified. The Xcode license is accepted.
- [iOS 1.0.0 build 6](https://expo.dev/projects/ccf2b54b-6734-43f5-8877-8a038e1c9703/builds/65061d03-2179-4af1-9d82-ace42b1fb4cc) was submitted to Apple, then [submission 5f047066](https://appstoreconnect.apple.com/apps/6815955359/distribution/reviewsubmissions/details/5f047066-0e37-4961-90f6-33764ccc9600) was canceled to replace its icon.
- [iOS 1.0.0 build 7](https://expo.dev/projects/ccf2b54b-6734-43f5-8877-8a038e1c9703/builds/d0b0ac4a-d45e-42e4-b645-f8e45491d63a) with the corrected icon was submitted in [submission be1405a5](https://appstoreconnect.apple.com/apps/6815955359/distribution/reviewsubmissions/details/be1405a5-e424-4865-95c9-ab237678b48a) on September 26, 2026; Apple showed **Waiting for Review** at this snapshot.

## Release decisions and follow-up

1. The chosen free first-release scope is a personal place map with local saved places and custom pins; Ask and Observe remain visible as clearly labeled demonstrations. A live requester-to-observer service would need authenticated shared requests, evidence storage/review, abuse controls and dependable hosting before it can be depicted as live.
2. Apple Developer team `9C6DA2SDJ7` registered `com.anujkakumanu.yonder`. App Store Connect app ID `6815955359` is titled “Yonder, Ask Someone There”; `app.json` and `eas.json` use the verified identifiers. Build 7 is attached to the submitted version 1.0; the older builds are superseded.
3. Expo CLI is authenticated, and EAS CLI 24.8.0 is installed temporarily at `/private/tmp/yonder-eas-cli/node_modules/.bin/eas`. Apple signing and App Store Connect upload credentials are ready. The app is free, configured for public U.S. availability, and set to release automatically after Apple approves it.
4. The release app no longer invokes hosted nearby discovery. The unused prototype route still returns 503 from production hosting and needs a managed provider before it can be restored. Place search calls public Nominatim; its one-request-per-second limit applies to the whole app, while the current limiter is only per server process. Use a suitable provider or shared limiter before traffic exceeds a small pilot.
5. The updated [privacy](https://yonder.expo.app/privacy) and [support](https://yonder.expo.app/support) pages are live. App Privacy is published, one real iPhone screenshot is uploaded, and review notes explain the demos. Place-search queries are forwarded to Nominatim; the in-memory cache's 24-hour freshness limit is **not** a deletion guarantee.
6. RevenueCat is absent. This free first release alone does not satisfy standard Shipaton categories. A later update must be publicly live before the September 30, 2026 deadline with a genuine RevenueCat-powered purchase or RevenueCat Ads. Choose an actual benefit, configure its App Store in-app purchase and RevenueCat offering, implement and test the purchase/restoration flow, and give judges a free trial or promo code. Do not represent simulated credits as purchases.

## Build and upload sequence for future updates

Follow [Expo's EAS setup](https://docs.expo.dev/build/setup/) and [iOS build process](https://docs.expo.dev/build-reference/ios-builds/):

```sh
npm ci
npx expo install --check
npx expo-doctor
eas config -p ios -e production
eas build --platform ios --profile production
eas submit --platform ios
```

Review the generated `eas.json`, bundle ID, resolved Expo config and production environment before building. Run the build interactively on the owner's terminal for private Apple authentication; do not enter the Apple password or two-factor code in chat. `eas submit` uploads a build for App Store Connect processing; public release and Shipaton eligibility require the subsequent App Review and release steps. See [Expo's build configuration](https://docs.expo.dev/build-reference/build-configuration/) and [EAS environment variables](https://docs.expo.dev/eas/environment-variables/).
