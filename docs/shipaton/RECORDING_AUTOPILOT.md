# Runbook: record the phone take with a computer-use agent

This file is written for a computer-use agent (for example GPT 6.1 Sol) that controls a Mac. The agent drives an iPhone through the macOS **iPhone Mirroring** window while the screen is recorded. It records **phone only, no voices**. Voices and webcam are recorded afterwards over this take, following `VIDEO_PLAN.md`.

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

7. **Recording.** Start the recording yourself: Cmd+Shift+5, "Record Selected Portion" drawn tightly around the mirroring window, then Record. Then tell the agent "go". The agent's T+0 is when it receives "go".

## Part B: rules for the agent

- **Before each tap, read the screen** and confirm the target text in quotes is visible. Never tap blind coordinates from an older screenshot.
- **Timing.**
  - Keep a clock from T+0 and never act before a step's time.
  - If you're late, don't skip steps and don't rush the holds: do the next step as soon as you can, then continue.
  - The editor trims dead time. A wrong screen costs a whole take; a late tap costs nothing.
- **Holds matter more than taps.** After each step, keep the pointer still and off the phone screen, so no cursor sits over the app.
- **Scroll** only when the target isn't visible. Use short scrolls inside the mirroring window.
- **Never tap** these:
  - "Delete my account" or "Sign out";
  - anything in Settings other than the steps below;
  - "Use my location";
  - a system permission prompt ("Don't Allow" is fine if one appears).
- **Stop and report** instead of improvising if:
  - an error message appears;
  - a screen doesn't match the expected text for more than 5 seconds;
  - a system alert you don't recognise appears.

## Part C: timeline

Screen text is in quotes. "Tap X" means: find the visible text X in the mirroring window and click its centre.

### Segment 1: asking (T+0:00 to 0:26)

| T | Action | Expect on screen | Then hold |
| --- | --- | --- | --- |
| 0:00 | none | Onboarding "Ask someone already there." | until 0:10 |
| 0:10 | Tap "Next" | Dark page "Or be the Scout." | until 0:13 |
| 0:13 | Tap "Next" | "Fresh, and clear about it." | 0.5 s |
| 0:13.5 | Tap "Maybe later" | Explore: "Good plans. Better intel." | until 0:15 |
| 0:15 | Tap "Take the NYC sample tour" | Card "Pier 2 Basketball Courts", "Are any basketball courts free?" | until 0:18 |
| 0:18 | Tap "Try the local demo" (small link under the yellow button) | "LOCAL DEMO REQUEST", "What would you like to know?" | 1 s |
| 0:19.5 | Tap "Are any basketball courts free? ↗" | Question filled in | 0.5 s |
| 0:20 | Tap "See answer options" (scroll down if needed) | "How do you want to know?", "Post a bounty", "Two courts are open" | until 0:26 |

### Segment 2: the Scout (T+0:26 to 0:52)

| T | Action | Expect | Then hold |
| --- | --- | --- | --- |
| 0:26 | Tap "Post a bounty" | "Your question has a place.", "demo, no card charged" | until 0:32 |
| 0:32 | Tap "Try the example observer journey" | "DEMO TASK · NO LIVE DISPATCH", "WHAT TO LOOK FOR" | until 0:42 |
| 0:42 | Tap "Explore an example" | "Let's take a look." | 1.5 s |
| 0:43.5 | Tap "Open demo camera" | "PRACTICE OBSERVATION", "Show the full playing surface of the courts" | 2 s (reticle locks) |
| 0:45.5 | Tap the capture button at the bottom (labelled "Capture three sample frames") | Capture, then "PREPARING AN EXAMPLE ANSWER" for about 4 s | wait for the next screen |
| ~0:50 | If "A little help. A better day." shows, tap "See the example answer". Otherwise do nothing. | "One court is available.", "Example answer · not live" | until 0:52 |

### Segment 3: accessibility, live (T+0:52 to 1:17)

| T | Action | Expect | Then hold |
| --- | --- | --- | --- |
| 0:52 | Tap "Explore" in the bottom bar | Explore map | 1 s |
| 0:53 | If "Take the NYC sample tour" is visible, tap it | Tour card | 1 s |
| 0:54 | Tap "All 12 places" | "THE NYC SAMPLE TOUR" list | 1 s |
| 0:55 | Tap "14 St - Union Sq Station" (scroll the list if needed) | Card "Is the elevator working right now?" | until 1:01 |
| 1:01 | Tap "Ask for a free place check" | "What do you want to know?", "WHAT SHOULD SOMEONE CHECK?" | 1 s |
| 1:02 | Tap "Is the step-free entrance or elevator working?" | That option selected | 1 s |
| 1:03 | Tap "15 min" under "KEEP IT OPEN FOR" | Selected | until 1:07 |
| 1:07 | Tap "Send check" (scroll if needed) | The check screen for 14 St - Union Sq Station, open | until 1:17 |

If a sign-in card appears at 1:01, stop: the account isn't signed in (Part A.3).

### Segment 4: Plus (T+1:17 to 1:45)

| T | Action | Expect | Then hold |
| --- | --- | --- | --- |
| 1:17 | Tap "Explore" in the bottom bar, then the gear icon at the top right | "Settings" | until 1:22 |
| 1:22 | Tap "Explore Yonder Plus" | Monthly and yearly plans, "1 week free" | until 1:29 |
| 1:29 | Tap "Start 1 week free" | Test Store purchase sheet | 1.5 s |
| 1:30.5 | Tap the sheet's confirm or purchase button | "Welcome to Plus." | until 1:35 |
| 1:35 | Tap "Explore" in the bottom bar. If the Union Sq card isn't showing, repeat 0:54 and 0:55 quickly. | Union Sq card | 0.5 s |
| ~1:36 | Tap "Ask for a free place check" | "KEEP IT OPEN FOR" with "1 hr" and "2 hr" (scroll so they're visible) | until 1:39 |
| 1:39 | Tap "Explore" in the bottom bar | Explore map | until 1:45 |
| 1:45 | Report "take complete" to the human | | |

## After the take

- The human stops the recording (Cmd+Ctrl+Esc, or the stop icon in the menu bar).
- Cancel the live check from segment 3.
- Restore: the recording account now has Plus. For a second take, use a fresh account, or keep segment 4 from the first take.
- Voices: play the take and record webcam and voice while reading `VIDEO_PLAN.md`. Its timings are the take's timings plus 0:10.
