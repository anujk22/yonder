# Verification — September 27, 2026

## Passed

- TypeScript: `npm run typecheck`.
- Unit tests: `npm test` — 27 passing, including collections, delayed-storage safety, purchase-key/cancellation policy, live input validation, request deadlines and blocked-place settlement.
- Pilot database: `npm run test:backend` — 52 assertions against a disposable PostgreSQL engine, including RLS and authenticated request actions. This does not exercise hosted Supabase Auth/PostgREST.
- Full application lint: `npm run lint`.
- `npx expo export --platform all` — iOS, Android and server-rendered web bundles exported, with 28 static routes and four API routes.
- A clean source export outside the repository passed `npm ci`, both test commands, typecheck, lint, Expo package alignment and the all-platform export; see [source readiness](SOURCE_READINESS.md).
- Native iOS debug build: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npx expo run:ios --device 4C9920E3-3919-46B4-AC4B-814DAE0E2DA5 --port 8081` — build succeeded, RevenueCat native pods linked, installed in simulator. This required Expo's automatic CocoaPods installation.
- Aligned 18 package versions with SDK 57 using `npx expo install --fix`; `npx expo install --check` then passed. Scoped updates of seven stale local Expo podspecs restored `pod install`. The subsequent native debug rebuild (`--no-install --no-bundler`) succeeded with zero errors/warnings and installed on the iPhone 13 Pro Max simulator.
- Both mode transition directions inspected live: transition-only frontal Scout, no floor shadow, spin or mirroring; normal Scout artwork preserved.
- Chrome runtime: created first free collection by clicking, verified its persistence after a reload, and verified a second collection routes to Plus. Missing configuration presents a disabled purchase button and a free continuation path.
- Narrow Chrome layout (320×775): Saved's empty-state Explore action is visible before decorative artwork; reopening Collections shows the first existing collection and its edit action; Plus states unavailable purchases above its hero. These are browser layout checks, not native touch acceptance.
- Chrome cancellation flow: sample capture → verification → Stop stayed paused for over five seconds (longer than the four-second verification timer). Choosing unsafe retained its confirmation; Done returned to the board with the task open and no earned result. Declining from capture after a staff objection retained its confirmation and removed the blocked place's task from the board (three tasks became two).
- Demo image context: Joe’s Pizza now shows a neutral Scout with “SAMPLE PREVIEW · NO PLACE PHOTO” and a matching sample filmstrip; Pier 2 retains its court sample. Both previews and the first neutral filmstrip frame were inspected in Chrome. The conditional branch applies to all three frames; actual device photo rendering is unchanged.
- In-app browser: keyboard activation works. Its automated pointer clicks did not activate React Native Pressable controls; the same flow responded to native Chrome clicks. No application change was made based solely on that automation behavior.
- PC video ZIP CRC checked; 16 files, including 8 existing reference PNGs. No generation performed.
- Submission icon copied from the generated native asset catalog; dimensions verified at 1024×1024.

## Not verified / still required

- RevenueCat dashboard configuration, actual native purchase, cancellation, restore, refund/revocation, offline behavior and dashboard event.
- Native touch interaction and visual acceptance: simulator is not exposed to the available computer-control app surface. Successful compilation is not an interaction test.
- Physical-device camera/location acceptance and store purchase review.
- Hosted Supabase Auth/PostgREST setup and a two-device shared request/answer: not verified. The invited pilot exists in source, while the main Ask/Observe demo remains local and labeled.
- Publication of the tested local source, a clean checkout of that final public revision, updated hosted privacy/support and store disclosures. See [source readiness](SOURCE_READINESS.md) for the isolated local export checks.
- Required 1179×2556 screenshot from the final matching build, real native film capture/edit, public video and final Devpost submission.
- Student email and team details. A [Shipaton organizer Manager confirmed on the September 29 recheck](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient) that Test Store is enough for Next Gen; the actual native transaction remains unverified above.

The submitted Apple build predates this work. No store submission, source push, backend deployment, external recruitment or final contest submission was performed.

## Dependency audit limitation

The aligned dependency lock still reports 15 npm audit findings (14 moderate, one high). The high finding is `image-size` 1.2.1 under Metro 0.84.4, a build-tool dependency. Its fixed major changes the module interface used by Metro; a blind override is not verified compatible. `npm audit fix --force` proposes an Expo 46 downgrade and was not applied. Dependency alignment and successful builds do not establish that these findings are resolved. The current app does not feed user-uploaded images into Metro's asset parser.
