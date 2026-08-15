# Demo mode

Demo mode makes the complete Ask-to-Observe product loop recordable without live locations, live camera scenes, or network conditions. Turning its flags off restores the preserved real paths where they exist.

- `useStaticMap: true` renders the bundled drawn map. The real `react-native-maps` view, markers, and region callbacks remain in `src/components/MapSurface.native.tsx`.
- `simulateCameraFeed: true` renders the bundled Pier 2 image and deterministic three-frame capture. The real `expo-camera` permission, `CameraView`, and `takePictureAsync` path remains in `src/app/observe/capture.tsx`.
- `usePresetCapture: false` keeps the older Pier-2-only preset branch disabled. With both capture flags off, the real camera path runs in `src/app/observe/capture.tsx`.
- `enableDemoReset: true` enables the 1.5-second Ask-mark reset. When false, the normal in-memory Zustand session in `src/lib/store.ts` is left untouched.
- `skipOnboarding: false` shows the landing screen before Ask; true opens Ask search directly.
- `fastTiming: false` uses the full timings in `src/lib/timing.ts`; true halves them for local iteration.

## Autopilot

`DEMO_FLAGS.autopilotEnabled` is `true` by default. On the landing or Ask screen, tap the invisible 44×44 target in the top-right safe-area corner to start. It resets the in-memory demo, holds on the landing screen for two seconds, opens Ask, searches for `Park`, then runs the basketball-only recording sequence in [`src/lib/autopilot.ts`](src/lib/autopilot.ts): ask about Pier 2, dispatch an observer, capture and verify three frames, show the payout and answer, then reuse the fresh answer for 15 cents. The sequence uses the same press handlers and haptics as a real interaction; its tap ripple is the only recording cue.

Tap with two fingers anywhere to abort immediately. The runner cancels its pending delays and registered screen timers, and does not navigate or show an alert. It is safe to start again from Ask home without reloading. Set `autopilotEnabled` to `false` to mount none of the autopilot trigger, layer, registrations, or abort behavior.

Real logic: local search matching, query compilation, pricing and splits, safety classification, freshness, query/task linkage, and answer creation.

Simulated: observer discovery, approach/geofence progression, verification, payments, and vision analysis. Shopify is presentation-only; there is no Shopify connection or payment processing.
