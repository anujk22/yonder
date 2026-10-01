# Yonder submission film (about 1:59)

Layout: YC-style background, the phone recording in the centre, one speaker bubble bottom left. Caption by the bubble: **Safwan & Anuj · Rutgers University**.

The phone take is recorded first, without voices: the app plays it by itself (`RECORDING_AUTOPILOT.md`). Its clock runs 10 s behind the film: phone T+0:00 is film 0:10. Voices and webcam are recorded afterwards while watching the take.

Times below are film times, when each line starts. They were checked against a timed run of the app: each line's key words are on screen while it's spoken, at about 170 words a minute. Read along to the take rather than to a clock.

## 0:00–0:10 Opening animation

Generated shots, labelled "concept animation". The example is still being chosen. It has to fit in these 10 s; anything longer pushes the whole film past 2:00. Saf's hook question plays over the animation instead of after it.

## Script

| Film | Speaker | On screen | Line |
| --- | --- | --- | --- |
| ~0:02 | Saf | Opening animation | [Hook question; depends on the opening example.] |
| 0:10 | Saf | Onboarding 1, "Ask someone already there." | [Second sentence; for courts: "Finding the court is easy. Knowing whether you can play is harder."] |
| 0:20 | Anuj | "Or be the Scout.", "Fresh, and clear about it.", "Good plans. Better intel." | Yonder lets you ask someone already there. Hi, we're Safwan and Anuj, and we're students at Rutgers University. |
| 0:26.5 | Saf | Pier 2 card, the question, "$2.50", "Scout gets $1.48" | You pick a place, ask a question and choose a bounty. |
| 0:31.5 | Saf | "How do you want to know?", "Post a bounty", free "Two courts are open · 1 day ago" | Older answers are free. For a fresh photo, post a bounty. |
| 0:36 | Anuj | "Confirm your bounty", "Demo · you won't be charged", then "Your question has a place." | You're billed only if someone answers, and this demo charges nothing. Whoever answers is a Scout. |
| 0:42 | Anuj | "WHAT TO LOOK FOR" 01–03, "…out of frame. Skip anything that feels unsafe." | Here's their view: a short checklist, faces kept out of frame, and they can skip anything that feels unsafe. |
| 0:51.5 | Anuj | "Let's take a look.", then "PRACTICE OBSERVATION", "No camera-roll uploads." | This is a practice camera. Real checks use the in-app camera, never the camera roll. |
| 0:59.5 | Anuj | "One court is available.", "Example answer · not live", "Created Xs ago" | One court is available, posted seconds ago. |
| 1:02.5 | Saf | Map, sample tour, Union Sq card "Is the elevator working right now?" | Knowing before you go can matter more than an empty court. For someone using a wheelchair, a working elevator can determine whether the trip is possible. |
| 1:11 | Saf | Live check form, "No charge during early access", the elevator question, "15 min" | Accessibility is one of our live checks, and live checks are free during early access. |
| 1:17 | Saf | The check screen, "OPEN" | A Scout nearby answers yes or no, and every answer shows how old it is. Answers are labelled self-reported, never presented as verified. |
| 1:28 | Anuj | Settings, "HOW PAYMENTS WORK" (bounty, Scout paid out, platform fee) | Our business model has two parts. On bounties, the Scout gets paid and Yonder keeps a platform fee. |
| 1:36.5 | Anuj | Plus perks and plans, "1 week free" | Second, Yonder Plus: longer check windows, more open checks, and a one-week free trial. |
| 1:42 | Anuj | "TEST STORE" note, purchase sheet, "Welcome to Plus.", "Confirming Plus on Yonder's server…" | This purchase uses RevenueCat's Test Store. Our server confirms Plus access. |
| 1:49 | Anuj | Live check form with "1 hr" and "2 hr" | Plus keeps your check open for up to two hours. |
| 1:52.5 | Anuj | Map | We want every trip to start with an answer instead of a guess. |
| 1:57.5 | Saf | End card (added in edit): yonder. · Go with confidence. · github.com/anujk22/yonder | Yonder. Go with confidence. |

## Why the lines say what they say

- **Two payment flows, named on screen.** The photo bounty flow is a demo and charges nothing. Live checks are really free during early access. The lines say "fresh photo, post a bounty" and "live checks are free" so they don't seem to contradict each other.
- **The fee is real logic.** `src/lib/pricing.ts` keeps $1 plus 3% of anything above the $2 minimum. The script says "platform fee" with no amount, framed as the business model, because bounty payments are simulated in this build.
- **Plus is enforced on the server.** The 1 and 2 hour windows and the 10 open checks are allowed only for rows in `plus_members`, which only the RevenueCat webhook writes. The 1 hr / 2 hr options at 1:49 are the visible proof.
- **"Posted seconds ago" is accurate.** The answer's age is measured from when the example answer is created, right after capture.
- **"Self-reported"** matches the label on screen. Answers are never presented as verified.

## Hackathon requirements this film covers

| Requirement | Where |
| --- | --- |
| Next Gen: students, a video, open source | Anuj's intro and the caption; end card shows github.com/anujk22/yonder |
| RevenueCat purchase (Test Store is accepted for Next Gen) | 1:42, said out loud as a Test Store purchase |
| Design | Onboarding, mascot, transitions, answer cards on screen throughout |
| Peace Prize | 1:02.5 live accessibility check (free during early access) |
| HAMM | 1:28 bounties with a platform fee, plus a subscription with a trial, enforced on the server |
| OneSignal | Not shown on camera. Cover it in the written submission with the App ID and campaign screenshots. |

Never claim users, revenue, payouts, verified answers or App Store approval, and never name any company in the narration except RevenueCat.
