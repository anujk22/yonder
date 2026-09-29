# Next Gen source readiness

The source, native assets, setup instructions and MIT license were published on September 29, 2026 at [revision `493602e`](https://github.com/anujk22/yonder/commit/493602e275cd64ea80ea870fc0b3429f039bfb90). A fresh clone of that exact public revision passed installation, both test commands, typecheck, lint and the all-platform export. This verifies source reproducibility; native transactions and physical-device footage remain separate requirements.

## Reproduce from a clean source export

Use Node.js 22.13 or newer, as required by [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/). From this checkout:

```sh
node scripts/source-export.mjs /absolute/path/to/new/yonder-source
cd /absolute/path/to/new/yonder-source
npm ci
npm test
npm run test:backend
npm run lint
npm run typecheck
npx expo export --platform all
```

`source-export.mjs` copies the current tracked and untracked source, required configuration, Supabase migration and disposable-Postgres tests, documentation, and assets into a new directory. It writes `source-manifest.json` with every file's size and SHA-256. Its allowlist excludes `production/` (about 346 MB of film work), generated native folders, dependencies, build output, and local environment files. It rejects private-key file types, files over 5 MB, symlinks, and high-confidence secret patterns in text. This is a guard, not a substitute for reviewing the exact manifest before publication. Public Supabase and RevenueCat client keys may be supplied to a native build through a local `.env.local`; this export intentionally contains only the blank `.env.example`.

The export retains the dated App Store and Shipaton readiness notes linked from the README. They describe the earlier build 7 and should not be read as verification of the newer RevenueCat source. The film production pack is distributed separately and is excluded here.

The published source includes the two previously untracked runtime assets: `assets/brand/concepts/yonder-scout-green-3d-v2.png` (the iOS icon in `app.json`) and `assets/brand/objects/scout-transition.webp` (used by `ModeReveal`). Both are now tracked; the earlier public revision omitted them. The export also includes the MIT `LICENSE` with both the Yonder and upstream Expo notices and the bundled Leaflet license in `src/components/leaflet-LICENSE.txt`.

## Clean-check evidence

On September 27, 2026, an isolated pilot source export with no original `node_modules` or generated Expo files passed `npm ci`, `npx expo install --check`, all 27 unit tests, all 52 disposable-Postgres SQL assertions (`npm run test:backend`), `npm run lint`, `npm run typecheck`, and `npx expo export --platform all`. The export produced Android and iOS bundles, 28 static web routes, and four API routes. A separate earlier clean export also passed `npx expo prebuild --platform ios --no-install`, generating the native iOS project. The first clean typecheck exposed a missing Expo ambient type reference: ignored `expo-env.d.ts` was present only in the working checkout. Adding the source-controlled `src/expo-types.d.ts` resolved both CSS import and `Pressable` state type errors.

The JavaScript bundle and disposable-Postgres checks do not verify a hosted Supabase Auth/PostgREST project, two-device exchange, signed native release, or in-app purchase. A local iOS simulator build needs macOS and the Expo 57-compatible Xcode toolchain; a distributable build needs Apple signing. The checked-in Expo project and Apple team identifiers belong to this app's owner, so forks need their own identifiers and credentials for EAS or store distribution. The working-tree iOS debug build linked the RevenueCat native SDK, but no account configuration or transaction has been verified. Follow the [exact owner inputs](../setup/NEEDED_FROM_YOU.md) for pilot and purchase setup.

## Asset origin

The art documents include ImageGen prompts for the Scout, green iOS icon, and category illustrations; they also document the transition image's ImageGen origin. The September 29 source replaces the demo court photo of undocumented origin with the existing generated basketball illustration at `assets/brand/objects/basketball-vinyl.webp`. It is artwork, not a venue photograph or observation. The undocumented image is excluded from the current source. Existing Expo and Leaflet notices are preserved.
