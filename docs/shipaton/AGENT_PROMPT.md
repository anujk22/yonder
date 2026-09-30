# Prompt for the recording agent (paste everything below the line)

The human does the setup in `RECORDING_AUTOPILOT.md` (development build, sign-in, clean state, iPhone Mirroring open), starts the recording in Recordly, then says "go". When the script changes, edit only the **Timeline** and the **Length** line. Phone T is film time minus 10 s.

---

You are operating a Mac to record a demo of an iPhone app called Yonder. The iPhone is shown on the Mac in the **iPhone Mirroring** window, and a screen recording (Recordly) is already capturing that window. Nobody touches the mouse but you. Voices are recorded later to match this take exactly, so **the timings below are hard deadlines, not suggestions.**

**Length:** T+0:00 to **T+1:47**. The take must end by T+1:47.

## Timing is the whole job

- **Marks.** Each row's T is a mark: the moment the click must land, within ±0.3 s. Not before, not after.
- **When "go" arrives,** start a precise clock. That instant is T+0:00. Check the clock often; never estimate time from memory.
- **Think during holds, never at a mark.** Screenshots and reasoning take seconds, so do them in advance. For every row:
  1. **Arm, at least 3 s before the mark:** take a screenshot, find the target, and scroll it into view if needed. Confirm the previous row's Expect text is on screen.
  2. **Approach, about 1.2 s before the mark:** start a natural mouse move to the target and arrive about 0.2 s early. Keep still.
  3. **Click on the mark,** once.
  4. **Settle:** leave the pointer still until you arm the next row.
- **Rows marked "~"** depend on the app, for example the answer appearing after an animation. Arm them as soon as that screen appears and click about 0.3 s after it settles.
- **Being late is the failure to avoid, so arm earlier.** If you're still late by more than 0.3 s, click immediately and don't skip the step. Then take the lost time out of the next holds marked "short ok", so you're back on the marks within two rows.
- **Holds are part of the timing.** A screen held until 1:01 must stay untouched until 1:01. Never tap early to "save time".

## Natural mouse movement

- Every move is a smooth, human-looking glide: slightly curved, easing in and out, about 0.5 to 0.9 s long.
- No teleporting, jitter, zig-zags, circling or hovering around.
- Go straight to the target. Don't pass over other buttons if you can avoid it.
- Between rows the pointer stays still wherever it last clicked, until you approach the next target.
- **Scrolling:** slow and deliberate, with small scroll steps inside the phone screen. Only scroll while arming, never during someone's hold on an important screen, and never during the last 1.5 s before a mark.
- The pointer never leaves the iPhone Mirroring window during the take. Don't click outside it, switch apps, or touch Recordly.

## Safety

- **Never tap:** "Delete my account", "Sign out", "Use my location", "Cancel this request", "Cancel live check", or anything not in the Timeline.
- **Stop and tell the human** instead of improvising if:
  - an error message appears;
  - an Expect text is missing 3 s after its click;
  - a system alert, permission prompt or sign-in screen appears;
  - you fall more than 3 s behind a mark.
- **At T+1:47,** report "take complete" with the actual click time of every row, then do nothing more.

## Timeline

| T (mark) | Click | Expect | Hold until next mark |
| --- | --- | --- | --- |
| 0:00 | (nothing) | "Ask someone already there." | to 0:10 |
| 0:10 | "Next" | "Or be the Scout." (dark page) | to 0:12 |
| 0:12 | "Next" | "Fresh, and clear about it." | to 0:13.5 |
| 0:13.5 | "Maybe later" | "Good plans. Better intel." | to 0:15 |
| 0:15 | "Take the NYC sample tour" | "Pier 2 Basketball Courts", "Are any basketball courts free?" | to 0:17.5 |
| 0:17.5 | "Try the local demo" (small link under the yellow button) | "What would you like to know?" | to 0:19 |
| 0:19 | "Are any basketball courts free? ↗" | question filled in | to 0:20.5 |
| 0:20.5 | "See answer options" (arm by scrolling down) | "How do you want to know?", "Post a bounty", "Two courts are open" | to 0:26 |
| 0:26 | "Post a bounty" | "Your question has a place." | to 0:32 |
| 0:32 | "Try the example observer journey" | "WHAT TO LOOK FOR" | to 0:42 |
| 0:42 | "Explore an example" | "Let's take a look." | to 0:43.5 |
| 0:43.5 | "Open demo camera" | "PRACTICE OBSERVATION" | to 0:45.5 |
| 0:45.5 | the large capture button at the bottom | "PREPARING AN EXAMPLE ANSWER", about 4 s | until the next screen |
| ~0:50 | only if "A little help. A better day." shows: "See the example answer" | "One court is available." | to 0:52 |
| 0:52 | "Explore" (bottom bar) | map | to 0:53 (short ok) |
| 0:53 | only if visible: "Take the NYC sample tour" | tour card | to 0:54 (short ok) |
| 0:54 | "All 12 places" | "THE NYC SAMPLE TOUR" | to 0:55 (short ok) |
| 0:55 | "14 St - Union Sq Station" (arm by scrolling the list) | "Is the elevator working right now?" | to 1:01 |
| 1:01 | "Ask for a free place check" | "WHAT SHOULD SOMEONE CHECK?" | to 1:02.5 |
| 1:02.5 | "Is the step-free entrance or elevator working?" | option highlighted | to 1:04 |
| 1:04 | "15 min" | highlighted | to 1:07 |
| 1:07 | "Send check" (arm by scrolling down) | the check screen for 14 St - Union Sq Station | to 1:17 |
| 1:17 | "Explore" (bottom bar) | map | to 1:18 |
| 1:18 | the gear icon, top right | "Settings" | to 1:21 |
| 1:21 | "Explore Yonder Plus" | plans with "1 week free" | to 1:28 |
| 1:28 | "Start 1 week free" | purchase sheet | to 1:29.5 |
| 1:29.5 | the sheet's purchase or confirm button | "Welcome to Plus." | to 1:34 |
| 1:34 | "Explore" (bottom bar) | Union Sq card "Is the elevator working right now?"; if it's not there, click "All 12 places", then "14 St - Union Sq Station", as fast as naturally possible | to 1:35.5 (short ok) |
| 1:35.5 | "Ask for a free place check" | "KEEP IT OPEN FOR" with "1 hr" and "2 hr" (scroll them into view right after this screen opens) | to 1:41 |
| 1:41 | "Explore" (bottom bar) | map | to 1:47 |
| 1:47 | (nothing) | report "take complete" | |
