# Runbook: record the phone take

The app can play the whole take by itself (Part C). A computer-use agent (Part B) is the backup. Either way, do the setup in Part A first.

The agent's instructions are in `AGENT_PROMPT.md`. The agent drives an iPhone through the macOS **iPhone Mirroring** window while the screen is recorded. It records **phone only, no voices**. Voices and webcam are recorded afterwards over this take, following `VIDEO_PLAN.md`.

The phone take runs from **T+0:00 to T+1:47**. In the edit it sits at 0:10 to 1:57, after the 10 s opening animation.

## Part A: the human sets up (not the agent)

1. **Build.** Record the whole take in a development build, because only a development build can use the Test Store:

   ```sh
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer   # once; this Mac points at CommandLineTools
   cd ~/Documents/ChatGPT/Yonder-next && npx expo run:ios --device
   ```

   Keep Metro running. This replaces the TestFlight copy of Yonder on the phone. It has no effect on App Store review.

2. **Backend.** Production Supabase must have `20261001000000_accessibility_and_plus.sql` applied (`docs/shipaton/CATEGORIES.md`). Without it, segment 3 fails with an error.

3. **Account.**
   - In the app, sign in (Requests tab, email code) with a **recording account that has never bought Plus**.
   - Rehearse the purchase with a different account.
   - Then Settings, "Replay the intro", so the app shows onboarding page 1.

4. **Clean state.**
   - Cancel any open demo bounties (Requests, open each one, "Cancel this request"). There's a $10 cap on unpaid demo bounties, so about five rehearsals hit it.
   - Cancel any open live checks ("Cancel live check" on the check screen). Free accounts may have only 3 open.

5. **Phone.** Focus / Do Not Disturb on, on the phone and the Mac. Full battery, portrait orientation, light mode.

6. **Mirroring.** Open iPhone Mirroring on the Mac, and don't move or resize the window after the agent's first screenshot.

7. **Recording.** In Recordly, record the iPhone Mirroring window (window or area capture, drawn tightly around it). Turn off any automatic zoom or cursor effects for this take; they can be added in editing. Start recording. Then tell the agent "go". The agent's T+0 is when it receives "go".

## Part B: the agent

Paste `AGENT_PROMPT.md` (below its line) into the agent. It holds the rules and the only copy of the timeline; edit timings there.

## Part C: the built-in take (development builds only)

Hidden button: in Settings, **press and hold the "Your Yonder" title for 1.5 s**. It exists only in development builds, never in TestFlight or App Store builds.

1. Do Part A, steps 1 to 6. You can start from any screen; the take resets the demo and replays the intro itself.
2. Start the screen recording, open Settings and hold the title.
3. If something isn't ready, a "Before you record" alert lists it: live checks not connected, not signed in, the account already has Plus, purchases unavailable, or not the Test Store. Fix it, or choose "Run anyway".
4. The app goes to onboarding page 1. That frame is **T+0**; place it at film 0:10 in the edit. The first tap is at T+0:10.0 (film 0:20).
5. **One tap is yours.** The Test Store purchase sheet is native, so the app can't press it. Confirm it when it appears, at about T+1:33.5 (film 1:43.5). The take waits up to 30 s for Plus, then carries on.
6. A small dot with a ring marks every tap the app makes.
7. At T+1:47 an alert lists each tap's planned and actual time. Trim it off the recording.

To stop a take early, touch the screen with two fingers. The timeline is `takeSteps` in `src/lib/autopilot.ts`, and it matches `AGENT_PROMPT.md`.

## After the take

- The human stops the recording in Recordly.
- Cancel the live check from segment 3.
- Restore: the recording account now has Plus. For a second take, use a fresh account, or keep segment 4 from the first take.
- Voices: play the take and record webcam and voice while reading `VIDEO_PLAN.md`. Its timings are the take's timings plus 0:10.
