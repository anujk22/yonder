# Runbook: record the phone take

The app plays the whole take by itself. It records **phone only, no voices**. Voices and webcam are recorded afterwards over this take, following `VIDEO_PLAN.md`.

The phone take runs from **T+0:00 to T+1:47**. In the edit it sits at 0:10 to 1:57, after the 10 s opening animation.

## Setup

1. **Build.** The take is in every build with the demo screens: development, preview, and TestFlight preview (`eas build --profile testflight-preview`). It is not in the App Store build, which has no demo screens. Record the film in a development build, because only a development build uses RevenueCat's Test Store, which the 1:42 line names. In a TestFlight preview build, Plus is a free App Store sandbox purchase instead, so that line won't match:

   ```sh
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer   # once; this Mac points at CommandLineTools
   cd ~/Documents/ChatGPT/Yonder-next && npx expo run:ios --device
   ```

   Keep Metro running. This replaces the TestFlight copy of Yonder on the phone. It has no effect on App Store review.

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
2. If something isn't ready, a "Before you record" alert lists it: live checks not connected, not signed in, the account already has Plus, purchases unavailable, or not the Test Store. Fix it, or choose "Run anyway".
3. The app goes to onboarding page 1. That frame is **T+0**; place it at film 0:10 in the edit. The first tap is at T+0:10.0 (film 0:20).
4. **One tap is yours.** The Test Store purchase sheet is native, so the app can't press it. Confirm it when it appears, at about T+1:33.5 (film 1:43.5). The take waits up to 30 s for Plus, then carries on.
5. A small dot with a ring marks every tap the app makes.
6. At T+1:47 an alert lists each tap's planned and actual time. Trim it off the recording.

To stop a take early, touch the screen with two fingers. The timeline is `takeSteps` in `src/lib/autopilot.ts`; edit timings there.

## After the take

- Stop the screen recording.
- Cancel the live check from the take.
- Restore: the recording account now has Plus. For a second take, use a fresh account.
- Voices: play the take and record webcam and voice while reading `VIDEO_PLAN.md`. Its timings are the take's timings plus 0:10.
