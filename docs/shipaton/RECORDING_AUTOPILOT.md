# Runbook: record the phone take

The app plays the whole take by itself while Saf and Anuj speak live over it, following `VIDEO_PLAN.md`. Tap "Play the demo", then start recording on onboarding page 1: **that frame is 0:00**. Speaking starts at 0:10. All times below count from that frame.

## Setup

1. **Build.** The take is in every build with the demo screens: development, preview and TestFlight preview. It is not in the App Store build (the `production` profile), which has no demo screens.

   - **TestFlight (the film is recorded here):** build with the `testflight-preview` profile, not `production`, then submit it:

     ```sh
     eas build --platform ios --profile testflight-preview
     eas submit --platform ios --latest
     ```

     Plus is bought through Apple's sandbox here, which is free in TestFlight. RevenueCat's Test Store can't be used, because its key crashes release builds on purpose, and TestFlight builds are release builds.
   - **Development build:** `npx expo run:ios --device` (once: `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`). This one uses RevenueCat's Test Store, which the script doesn't mention, so use it for rehearsing only.

2. **Backend.** Production Supabase must have `20261001000000_accessibility_and_plus.sql` applied (`docs/shipaton/CATEGORIES.md`). Without it, the live check fails with an error.

3. **Account.**
   - In the app, sign in (Requests tab, email code) with a **recording account that has never bought Plus**.
   - Rehearse with a different account first.

4. **Clean state.**
   - Cancel any open demo bounties (Requests, open each one, "Cancel this request"). There's a $10 cap on unpaid demo bounties, so about five rehearsals hit it.
   - Cancel any open live checks ("Cancel live check" on the check screen). Free accounts may have only 3 open.

5. **Phone.** Focus / Do Not Disturb on. Full battery, portrait orientation, light mode.

6. **Recording.** Use the phone's own screen recording (Control Center), or record the phone some other way, as long as the store sheet is captured too.

## The take

Start button: in Settings, scroll to the bottom and tap **Play the demo** (the DEMO card, below Help). It exists in development, preview and TestFlight preview builds, never in the App Store build.

1. Open Settings and tap Play the demo, then start the screen recording once onboarding page 1 is up. You can start from any screen; the take resets the demo and replays the intro itself.
2. If something isn't ready, a "Before you record" alert lists it: live checks not connected, not signed in, purchases unavailable. It no longer warns about an account that already has Plus: the take then skips the purchase, so always record with a fresh account. Fix it, or choose "Run anyway".
3. Onboarding page 1 is 0:00. Saf starts speaking at 0:10. The first tap is at 0:20.5.
4. **One tap is yours.** The purchase sheet is native (Test Store in a development build, Apple's sandbox in TestFlight), so the app can't press it. Confirm it when it appears, at about 1:45; in TestFlight, confirm with Face ID or your password as quickly as you can. The take waits up to 3 min for the purchase and then up to 90 s for Yonder's server to confirm Plus, and every later tap moves back by that wait. Keep talking over "Confirming Plus on Yonder's server…" until the map moves on; any wait past 1:49.6 pushes the end past 2:00, so cut that silence in the edit.
5. A small dot with a ring marks every tap the app makes.
6. Anuj says the tagline at 1:56 and the take ends at 1:59. At 2:04 an alert lists each tap's planned and actual time. Trim it off the recording.

To stop a take early, touch the screen with two fingers. The timeline is `takeSteps` in `src/lib/autopilot.ts`; edit timings there.

## After the take

- Stop the screen recording.
- Cancel the live check from the take.
- Restore: the recording account now has Plus. For a second take, use a fresh account.
- A flubbed line means a retake, and a retake needs a fresh account that has never bought Plus.
