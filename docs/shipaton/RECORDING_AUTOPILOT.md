# Runbook: record the phone take with a computer-use agent

This file is the human's setup. The agent's instructions are in `AGENT_PROMPT.md`. The agent drives an iPhone through the macOS **iPhone Mirroring** window while the screen is recorded. It records **phone only, no voices**. Voices and webcam are recorded afterwards over this take, following `VIDEO_PLAN.md`.

The phone take runs from **T+0:00 to T+1:45**. In the edit it sits at 0:10 to 1:55, after the trailer.

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

## After the take

- The human stops the recording in Recordly.
- Cancel the live check from segment 3.
- Restore: the recording account now has Plus. For a second take, use a fresh account, or keep segment 4 from the first take.
- Voices: play the take and record webcam and voice while reading `VIDEO_PLAN.md`. Its timings are the take's timings plus 0:10.
