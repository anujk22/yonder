# Yonder App Store materials — working draft

**September 29 update:** App Store Connect shows submitted iOS 1.0, build 1.0.0 (7) as **Rejected** under Guideline 2.1.0 App Completeness / Information Needed. Apple's visible message requests six items, including a physical-device recording; it does not identify a crash. See the [unsent build-7 response draft](docs/shipaton/APP_REVIEW_RESPONSE_2026-09-29.md). The material below is the earlier build-7 submission snapshot; the newer RevenueCat/Supabase source is not in that binary.

This is a source-grounded draft for the current repository. Recheck every claim against the submitted binary and its deployed services before submission.

On September 25, 2026, the individual Apple Developer team `9C6DA2SDJ7` registered explicit App ID `com.anujkakumanu.yonder` and created App Store Connect app `6815955359` with SKU `yonder-ios-2026`. These identifiers and the legal Apple seller name are account facts, not public product copy. The public brand is **Yonder**. Support and privacy pages are deployed at `https://yonder.expo.app/support` and `https://yonder.expo.app/privacy`; those exact URLs are saved in App Store Connect. Build 6's review submission was canceled; build 7 with the new icon was submitted to App Review on September 26, 2026 and was **Waiting for Review** at that check.

## Product page draft

- Name: **Yonder, Ask Someone There** (saved in App Store Connect and chosen for this submission)
- Subtitle: **Ask someone already there** (saved in App Store Connect)
- Primary language: English (U.S.)
- Category: Utilities (saved for the current demo-plus-map build)
- Keywords: `on-ground,questions,places,map,local,saved places` (update in App Store Connect)
- Price: free app for the initial release, saved as $0.00 in App Store Connect; payments are deferred
- Availability: United States only for this build, matching the hard-coded U.S. place-search filter
- Copyright: `2026 Yonder` (saved)

**Description saved for the current preview:**

> Yonder is built around a simple question: what is happening at a place right now? Search for a place on the map, save places you care about, and add your own pins on your device.
>
> Ask and Observe are clearly labeled interactive demos of a future on-ground answer experience. In this version, demo questions and observations stay on your device. No request reaches another person, no live answer is delivered, and no real payment or earnings occur.
>
> With your permission, Yonder uses your location to center the map. You can search for a place without sharing your device location.

Do **not** describe live observer dispatch, real answers from other users, paid checks, verified photos, or payouts unless those services exist and work in the submitted build. The current `README.md`, `DEMO_MODE.md`, and in-app About screen explicitly describe the Ask/Observe loop as a local preview. A public release of this preview may still face Apple's completeness and utility review; truthful copy does not guarantee approval.

## App Review notes draft

> This version includes a local demonstration of the Ask/Observe journey. It does not dispatch requests to other people, settle payments, or independently verify photos. Explore and Saved let reviewers search mapped places and keep selections on this device. Place search requires the production API origin. The location button centers the map without requesting nearby results. The optional device-check flow requests camera and foreground location access; the demonstration path can be tried without those permissions.

Replace these notes if the actual release gains live cross-device functionality or RevenueCat purchases. Provide exact navigation steps to each real feature, and a persistent demo account only if login is added. Apple requires in-app purchases to be complete, visible, and functional for review.

## Privacy inventory for submitted build 7

| Data or permission | Current behavior | App Privacy implication to verify |
| --- | --- | --- |
| Foreground device location | Centers the map, shows position, and supports an on-device proximity/capture check. The release app does not send device location to Yonder's server. | Verify any processing by the native platform map provider; do not classify Yonder's unused nearby endpoint as a collection flow in this binary. |
| Place search text | Sent to Yonder's API and forwarded to Nominatim (or the configured geocoder). The server caches query strings. | Evaluate **Search History** collection and partner practices. |
| Saved places, community pins, requests, balances, answers | Persist locally through AsyncStorage. They do not currently sync to a Yonder account. | On-device storage alone is not Apple-defined collection. Reassess if sync or analytics is added. |
| Camera photos and precise capture readings | Used in the device-check path. Photos remain on the device; raw photo URIs and transient location evidence are excluded from persisted app state. | Do not claim photos are uploaded or server-verified. Reassess if evidence upload is added. |
| Purchases and identifiers | No RevenueCat SDK, real purchase, account creation, or authentication exists in build 7. | Inventory RevenueCat data and Apple purchase data before submitting a newer build. |
| Maps | Native uses the platform map provider; web uses OpenStreetMap tiles. | Audit the shipped map provider and its privacy terms before final policy/label. |

The server's 24-hour search period is a **cache freshness window, not a deletion guarantee**: stale entries can remain until replacement, capacity eviction, or process restart. Do not promise a fixed retention period until code and hosting enforce one. Audit production request logs, analytics, crash reporting, provider retention, and any new SDKs before answering App Store Connect privacy questions. Apple requires a publicly accessible privacy policy URL even if the final app does not collect data.

**Privacy policy wording to adapt after that audit:**

> Yonder can use your foreground location, with your permission, to center the map and check your proximity before an in-app photo capture. The current app does not send device location to Yonder's place-search server. When you search for a place, Yonder sends the words you enter to its server and configured geocoder. The server keeps search terms in an in-memory cache; results are refreshed after 24 hours, but entries can remain longer until eviction or restart. Your saved places, community pins, demo requests, balances, and answers are stored on your device. Camera photos and the full-resolution location check are not uploaded by the current app. The current app has no account, real payments, or user-to-user dispatch.

The support/privacy pages label the contact **Yonder support** and use the owner-supplied email address as the working `mailto:` destination. Reconcile policy copy with the final binary and App Privacy answers. Add RevenueCat handling only when a purchase is actually implemented.

## Assets and account fields

- Build 7 iOS icon source: `assets/brand/concepts/yonder-scout-green-3d-v2.png`, 1254 × 1254. The signed IPA was inspected and contains the green 3D Scout icon.
- One real iPhone screenshot has been uploaded to App Store Connect. The actual upload well requests **6.5-inch** iPhone screenshots at **1242 × 2688** or **1284 × 2778** portrait, up to ten. The Shipaton's separate **1179 × 2556** screenshot request does not replace this slot. Screenshots must show the submitted app with demo state labeled honestly.
- App Store Connect had the Yonder-only support/privacy URLs, automatic release after approval, Utilities category, 4+ age rating, Free pricing, U.S. availability, and `2026 Yonder` copyright saved. The App Privacy label and review notes were saved. Build 7 with the corrected icon was **Waiting for Review** at the September 26 check in [submission be1405a5](https://appstoreconnect.apple.com/apps/6815955359/distribution/reviewsubmissions/details/be1405a5-e424-4865-95c9-ab237678b48a). Camera and location permission flows have not been verified on a physical iPhone. The hosted nearby API returned 503 with `Overpass HTTP 521` in EAS logs at the last check, so the release app no longer calls it.
- The individual Apple Developer account's legal seller name is shown by Apple and cannot be changed to a brand in app metadata; only the editable product name, copyright, description, support/privacy pages, and related copy use **Yonder**. Keep private legal/reviewer identity accurate. See [Apple's developer-name guidance](https://developer.apple.com/help/app-store-connect/create-an-app-record/set-your-developer-name).
- A first in-app purchase of each type must be submitted for review with a new app version. The product ID, price, entitlement, trial/promo approach, and RevenueCat configuration must match the implemented paid benefit.

Apple references: [app record](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app), [version metadata and review fields](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information), [screenshots](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications), [privacy details](https://developer.apple.com/app-store/app-privacy-details/), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [first in-app purchase submission](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase).
