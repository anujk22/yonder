# Yonder submission film (about 1:57)

Layout: YC-style background, the phone recording in the centre, one speaker bubble bottom left. Caption by the bubble: **Safwan & Anuj · Rutgers University**.

The film is one take, recorded in TestFlight. The app plays itself (`RECORDING_AUTOPILOT.md`) and Saf and Anuj speak live over it. **The film starts when you tap "Play the demo"**. Nobody speaks before that. Onboarding page 1 appears 0.7 s later.

The times below count from the button press and show when each line starts. They were checked against a timed run of the app: each line's key words are on screen while it's spoken, at about 170 words a minute. Read along to the screen rather than to a clock. If you fall behind, shorten the line rather than rushing it.

## Script

| Time from press | Speaker | On screen | Line |
| --- | --- | --- | --- |
| 0:01 | Saf | Onboarding 1, "Ask someone already there." | Is this item still in stock? How long's the line? Is the elevator working? Maps can't tell you. Someone already there can, and if they can see it, you can ask it. |
| 0:17 | Anuj | "Or be the Scout.", "Fresh, and clear about it.", "Good plans. Better intel." | That's Yonder. Hi, we're Safwan and Anuj, and we're students at Rutgers University. |
| 0:23 | Saf | Pier 2 card, the question, "$2.50", "Scout gets $1.48" | Take a court. You pick a place, ask a question and choose a bounty. |
| 0:28 | Saf | "How do you want to know?", "Post a bounty", free "Two courts are open · 1 day ago" | Older answers are free. For a fresh photo, post a bounty. |
| 0:32.5 | Anuj | "Confirm your bounty", "Demo · you won't be charged", then "Your question has a place." | You're billed only if someone answers, and this demo charges nothing. Whoever answers is a Scout. |
| 0:38.5 | Anuj | "WHAT TO LOOK FOR" 01–03, "…out of frame. Skip anything that feels unsafe." | Here's their view: a short checklist, faces kept out of frame, and they can skip anything that feels unsafe. |
| 0:48 | Anuj | "Let's take a look.", then "PRACTICE OBSERVATION", "No camera-roll uploads." | This is a practice camera. Real checks use the in-app camera, never the camera roll. |
| 0:56 | Anuj | "One court is available.", "Example answer · not live", "Created Xs ago" | One court is available. |
| 0:59 | Saf | Map, sample tour, Union Sq card "Is the elevator working right now?" | Courts are just one kind of place. For someone using a wheelchair, a working elevator can decide whether the trip is possible. |
| 1:07.5 | Saf | Live check form: the four questions, "No charge during early access", the elevator question, "15 min" | Live checks ask if it's open, how long the wait is, if there's room, or if the elevator works. They're free during early access. |
| 1:13.5 | Saf | The check screen, "OPEN" | A Scout nearby answers, with how old the answer is. Answers are self-reported, never verified. |
| 1:24.5 | Anuj | Settings, "HOW PAYMENTS WORK" (bounty, Scout paid out, platform fee) | Our business model has two parts. On bounties, the Scout gets paid and Yonder keeps a platform fee. |
| 1:33 | Anuj | Plus perks and plans, "1 week free" | Second, Yonder Plus: longer check windows, more open checks, and a one-week free trial. |
| 1:38.5 | Anuj | Apple's sandbox purchase sheet (Saf confirms it with Face ID), "Welcome to Plus.", "Confirming Plus on Yonder's server…" | This purchase runs through RevenueCat in Apple's sandbox. Our server confirms Plus access. |
| 1:45.5 | Anuj | Live check form with "1 hr" and "2 hr" | Plus keeps your check open for up to two hours. |
| 1:49 | Anuj | Map | We want every trip to start with an answer instead of a guess. |
| 1:54 | Saf | Map; end card added in edit: yonder. · Go with confidence. · github.com/anujk22/yonder | Yonder. Go with confidence. |

The take ends at 1:53.7 and its timing report pops up at 1:58.7. Cut the film right after the tagline, before the report.

After the purchase the app waits for Face ID and for Yonder's server to confirm Plus, and everything after 1:38.5 moves back by that wait. Follow the screen, not the clock: start "Plus keeps your check open…" when the 1 hr and 2 hr options appear. There are about 4 s to spare before 2:00.

## Why the lines say what they say

- **Two payment flows, named on screen.** The photo bounty flow is a demo and charges nothing. Live checks are really free during early access. The lines say "fresh photo, post a bounty" and "live checks are free" so they don't seem to contradict each other.
- **The fee is real logic.** `src/lib/pricing.ts` keeps $1 plus 3% of anything above the $2 minimum. The script says "platform fee" with no amount, framed as the business model, because bounty payments are simulated in this build.
- **Plus is enforced on the server.** The 1 and 2 hour windows and the 10 open checks are allowed only for rows in `plus_members`, which only the RevenueCat webhook writes. The 1 hr / 2 hr options at 1:45.5 are the visible proof.
- **The breadth is real.** The four live check questions at 1:07.5 are the four in `src/lib/liveTypes.ts`, and all four are on the form while Saf lists them. The demo map's places include coffee, parks, groceries, pizza, shops and transit as well as courts. The opening questions are examples of what you can ask. They don't claim a Scout is standing by anywhere.
- **"Self-reported"** matches the label on screen. Answers are never presented as verified.

## Hackathon requirements this film covers

| Requirement | Where |
| --- | --- |
| Next Gen: students, a video, open source | Anuj's intro and the caption; end card shows github.com/anujk22/yonder |
| RevenueCat purchase | 1:38.5, a RevenueCat purchase in Apple's sandbox (TestFlight), said out loud as a sandbox purchase |
| Design | Onboarding, mascot, transitions, answer cards on screen throughout |
| Peace Prize | 0:59 live accessibility check (free during early access) |
| HAMM | 1:24.5 bounties with a platform fee, plus a subscription with a trial, enforced on the server |
| OneSignal | Not shown on camera. Cover it in the written submission with the App ID and campaign screenshots. |

Never claim users, revenue, payouts, verified answers or App Store approval, and never name any company in the narration except RevenueCat.
