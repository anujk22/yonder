# Submission copy — review against the recorded build

**September 29 App Store status:** earlier iOS 1.0 build 7 is **Rejected** for Guideline 2.1.0 App Completeness / Information Needed. The [unsent Apple response draft](APP_REVIEW_RESPONSE_2026-09-29.md) addresses that submitted build, which lacks the newer RevenueCat and Supabase source features. Do not describe either source feature as present in build 7.

**Title:** Yonder — ask someone already there

**Tagline:** Ask someone already there before you make the trip.

**Primary category:** Next Gen. Both builders report being 19 and second-year college students. Verify the academic email on Devpost and add both actual team members.

## Inspiration

Maps can tell you where a basketball court is. They cannot reliably tell you whether there is room to play right now. We started Yonder around that gap: small, time-sensitive questions that someone already at a place could answer.

## What it does today

Yonder is a native mobile product preview with real map exploration, submitted place search, saved places and custom pins. Collections organize saved places on the device. One collection is free. The current source implements a RevenueCat-backed Yonder Plus entitlement for additional collections; the Test Store dashboard is configured, and native transaction verification is still pending. Replace this status only after verification.

The main Ask and Observe path demonstrates the proposed request-and-answer experience using explicitly labeled local samples. The separate device-check path uses foreground location and an in-app camera capture. It does not dispatch to another user, independently verify evidence, upload the photo, or settle a payment. Source also includes an optional, invite-only Supabase pilot for free shared place checks and self-reported text answers. That pilot still needs account configuration and a verified two-device exchange; we have not launched a live observer network.

## RevenueCat

Yonder Plus is an auto-renewing monthly or yearly subscription on entitlement `yonder_plus`, with a 1 week free trial. The app reads the offering and prices from RevenueCat, purchases through the SDK, listens for entitlement changes, restores purchases, and opens subscription management. A RevenueCat webhook syncs Plus to the database, which enforces the longer check windows and higher open-check limit. See `REVENUECAT_SETUP.md`. Native Test Store purchase, restore and webhook sync are **unverified** until recorded; replace this note with date, environment and evidence link. Never describe Test Store purchases as revenue.

## Design

We use a map-first layout and a small yellow Scout character to make an unfamiliar interaction approachable. Illustrations establish categories without pretending to be current venue photographs. The capture path separates sample evidence from device evidence, and the paid feature states its one-time price and local-storage limits directly.

## How we built it

Expo SDK 57, React Native, Expo Router and TypeScript; Zustand with local persistence; native platform maps and a Leaflet web preview; OpenStreetMap-backed place search; Supabase Auth/Postgres/RLS for the optional invited pilot; RevenueCat for the Plus purchase integration. The repository includes local-state tests and a disposable-Postgres test of pilot database policies and actions.

## What remains

Deploying and proving the invited cross-device pilot, observer recruitment, operational abuse review, evidence verification, notifications and any observer settlement remain open. We have no users or revenue to report at present. The earlier App Store preview build was rejected with an information request; this submission must identify the exact recorded/source version.

## Final fields to fill

- Both team members and qualifying academic email: owner to verify.
- Public repository URL and final commit: https://github.com/anujk22/yonder — revision `493602e` passed a clean public-clone check.
- Public YouTube/Vimeo URL: pending final native recording and edit.
- 1024-square icon and 1179×2556 frame-free screenshot: capture/verify from final build.
- RevenueCat evidence: dashboard setup complete; native purchase, restore and entitlement proof pending.
- App Store URL: include as a qualifying store release only when publicly available with the required integration.

Do not submit placeholders. If the hosted pilot passes a two-device test, replace its unverified status with the observed flow and actual limitations. Do not imply that a branded animation shows working software.
