# Yonder submission film (about 1:58)

Layout: YC-style background, the phone recording in the centre, one speaker bubble bottom left. Caption by the bubble: **Safwan & Anuj · Rutgers University**.

The film is one take, recorded in TestFlight. The app plays itself (`RECORDING_AUTOPILOT.md`) and Saf and Anuj speak live over it. Tap "Play the demo", then start the recording on onboarding page 1 ("Ask someone already there."). **That frame is 0:00.** Nobody speaks for the first 10 s.

The times below are when each line starts. They were checked against a full timed run of the demo (all 33 taps on their marks): each line's key words are on screen for the whole time it's spoken, at a relaxed 160 words a minute with a breath between lines. Every line ends before the next one starts; the tightest is Anuj's intro at 0:18, which has 12 s for about 11 s of speech.

## Script

| Time | Speaker | On screen | Line |
| --- | --- | --- | --- |
| 0:10 | Saf | Onboarding 1, "Ask someone already there." | Is this item still in stock? How long's the line? Is the elevator working? Maps can't tell you. |
| 0:18 | Anuj | Onboarding 1, then onboarding 2 and 3 (from 0:20.5), then the map (0:24) | Someone already there can, and that's why we built Yonder. If they can see it, you can ask it. Hi, we're Safwan and Anuj, and we're students at Rutgers University. |
| 0:30 | Saf | Pier 2 card and the question; "$2.50" and "Scout gets $1.48" from 0:34.5 | Take a court. You pick a place, ask a question and choose a bounty. |
| 0:36.5 | Saf | "How do you want to know?", "Post a bounty", free "Two courts are open · 1 day ago" | Older answers are free. For a fresh photo, post a bounty. |
| 0:41.5 | Anuj | "Confirm your bounty", "Demo · you won't be charged", then "Your question has a place." (0:45) | You're billed only if someone answers, and this demo charges nothing. Whoever answers is a Scout. |
| 0:48.5 | Anuj | "WHAT TO LOOK FOR" 01–03, "…out of frame. Skip anything that feels unsafe." | Here's their view: a short checklist, faces kept out of frame, and they can skip anything that feels unsafe. |
| 0:56 | Anuj | "Let's take a look.", then "PRACTICE OBSERVATION", "No camera-roll uploads." (0:57.3) | This is a practice camera. Real checks only use the in-app camera. |
| 1:03.5 | Anuj | "One court is available.", "Example answer · not live" | One court is available. |
| 1:06 | Saf | Map, "All 12 places" (1:07.4), Union Sq card "Is the elevator working right now?" (1:08.3) | Courts are just one kind of place. For someone in a wheelchair, a working elevator decides whether the trip is possible. |
| 1:14.5 | Saf | Live check form: the four questions, "No charge during early access" | Live checks ask if it's open, how long the wait is, if there's room, or if the elevator works. They're free during early access. |
| 1:25 | Saf | The check screen, "OPEN", "self-reported" | A Scout nearby answers. Every answer shows its age and is labelled self-reported. |
| 1:32 | Anuj | Settings, "HOW PAYMENTS WORK" (bounty, Scout paid out, platform fee) | Our business model has two parts. On bounties, the Scout gets paid and Yonder keeps a platform fee. |
| 1:38 | Anuj | Plus perks and plans, "1 week free" | Second, Yonder Plus: longer check windows, more open checks, and a one-week free trial. |
| 1:44 | Anuj | Apple's sandbox purchase sheet (Saf confirms with Face ID straight away), "Welcome to Plus.", "Confirming Plus on Yonder's server…" | This purchase runs through RevenueCat in Apple's sandbox. Our server confirms Plus access. |
| 1:52* | Anuj | Live check form with "1 hr" and "2 hr" | Plus keeps your check open for up to two hours. |
| 1:56* | Saf | Map; end card added in edit: yonder. · Go with confidence. · github.com/anujk22/yonder | Yonder. Go with confidence. |

\* After the purchase the app waits for Face ID and for Yonder's server to confirm Plus. The times marked * assume both are done by 1:49.6, which is 5.5 s after the sheet is tapped open. If they take longer, the rest moves back by the difference. Start "Plus keeps your check open…" when the 1 hr and 2 hr options appear, not by the clock. Any extra wait is silence on "Confirming Plus on Yonder's server…", and you can cut it out in the edit.

The take ends at 1:59 and its timing report pops up at 2:04. Stop recording after the tagline, before the report.

## Why the lines say what they say

- **Two payment flows, named on screen.** The photo bounty flow is a demo and charges nothing. Live checks are really free during early access. The lines say "fresh photo, post a bounty" and "live checks are free" so they don't seem to contradict each other.
- **The fee is real logic.** `src/lib/pricing.ts` keeps $1 plus 3% of anything above the $2 minimum. The script says "platform fee" with no amount, framed as the business model, because bounty payments are simulated in this build.
- **Plus is enforced on the server.** The 1 and 2 hour windows and the 10 open checks are allowed only for rows in `plus_members`, which only the RevenueCat webhook writes. The 1 hr / 2 hr options at 1:52 are the visible proof.
- **The breadth is real.** The four live check questions at 1:14.5 are the four in `src/lib/liveTypes.ts`, and all four are on the form while Saf lists them. The demo map's places include coffee, parks, groceries, pizza, shops and transit as well as courts. The opening questions are examples of what you can ask. They don't claim a Scout is standing by anywhere.
- **"Self-reported"** matches the label on screen. Answers are never presented as verified.

## Hackathon requirements this film covers

| Requirement | Where |
| --- | --- |
| Next Gen: students, a video, open source | Anuj's intro and the caption; end card shows github.com/anujk22/yonder |
| RevenueCat purchase | 1:44, a RevenueCat purchase in Apple's sandbox (TestFlight), said out loud as a sandbox purchase |
| Design | Onboarding, mascot, transitions, answer cards on screen throughout |
| Peace Prize | 1:06 and 1:14.5 live accessibility check (free during early access) |
| HAMM | 1:32 bounties with a platform fee, plus a subscription with a trial, enforced on the server |
| OneSignal | Not shown on camera. Cover it in the written submission with the App ID and campaign screenshots. |

Never claim users, revenue, payouts, verified answers or App Store approval, and never name any company in the narration except RevenueCat.
