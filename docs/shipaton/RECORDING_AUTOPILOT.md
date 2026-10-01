# Runbook: record the phone take

The app plays the whole take by itself. It records **phone only, no voices**. Voices and webcam are recorded afterwards over this take, following `VIDEO_PLAN.md`.

The phone take runs from **T+0:00 to T+1:47**. In the edit it sits at 0:10 to 1:57, after the 10 s opening animation.

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

Hidden button: in Settings, **press and hold the "Your Yonder" title for 1.5 s**. It exists in development, preview and TestFlight preview builds, never in the App Store build.

1. Start the screen recording, open Settings and hold the title. You can start from any screen; the take resets the demo and replays the intro itself.
2. If something isn't ready, a "Before you record" alert lists it: live checks not connected, not signed in, the account already has Plus, purchases unavailable,. Fix it, or choose "Run anyway".
3. The app goes to onboarding page 1. That frame is **T+0**; place it at film 0:10 in the edit. The first tap is at T+0:10.0 (film 0:20).
4. **One tap is yours.** The purchase sheet is native (Test Store in a development build, Apple's sandbox in TestFlight), so the app can't press it. Confirm it when it appears, at about T+1:33.5 (film 1:43.5); in TestFlight, confirm with Face ID or your password as quickly as you can. The take waits up to 30 s for Plus, then carries on.
5. A small dot with a ring marks every tap the app makes.
6. At T+1:47 an alert lists each tap's planned and actual time. Trim it off the recording.

To stop a take early, touch the screen with two fingers. The timeline is `takeSteps` in `src/lib/autopilot.ts`; edit timings there.

## After the take

- Stop the screen recording.
- Cancel the live check from the take.
- Restore: the recording account now has Plus. For a second take, use a fresh account.
- Voices: play the take and record webcam and voice while reading `VIDEO_PLAN.md`. Its timings are the take's timings plus 0:10.
