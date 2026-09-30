# Yonder submission film (1:55)

Layout: YC-style background, the phone recording in the centre, one speaker bubble bottom left. Four turns: Saf, Anuj, Saf, Anuj.

Every line below was checked against the screen it plays over (web walkthrough of `main`, Sept 30). The phone take is recorded first, without voices, by the agent in `RECORDING_AUTOPILOT.md`. You then record webcam and voice while watching that take, so speech follows the screen exactly.

**Record the whole take in one native development build** (`npx expo run:ios --device`, see the runbook). It's the only build that has the sample tour, live checks and the Test Store purchase together. TestFlight builds can't make a Test Store purchase.

Screen text is in quotes and must be on screen while the line is spoken.

## 0:00–0:10 Trailer (no bubble)

Generated shots, music only. Text: "Is a hoop free right now?" then "yonder. Ask someone already there." Label the shots "concept animation".

## 0:10–0:36 Saf: the problem, and asking

| Time | Phone | Saf says |
| --- | --- | --- |
| 0:10 | Onboarding 1: "Ask someone already there." (mascot) | Hey, I'm Saf, that's Anuj, and we're college students. Ever crossed town for a court and found it packed? Maps tell you where a place is, not what's happening there now. |
| 0:20 | Next, then the dark page: "Or be the Scout." | Yonder lets you ask someone already there. |
| 0:23 | Next, then "Maybe later", then the Explore landing: "Good plans. Better intel." | *(no line, let it breathe)* |
| 0:25 | "Take the NYC sample tour", then the Pier 2 card: "Are any basketball courts free?" | Pick a place, ask one question, |
| 0:28 | "Try the local demo", tap the court question, "See answer options" | |
| 0:31 | Options: "How do you want to know?" with "Post a bounty" and a free "Two courts are open · Sample · 1 day ago" | then choose how fresh you need it. A day-old answer is free. Need it right now? Post a bounty. Anuj, who actually answers? |

## 0:36–1:02 Anuj: the Scout

| Time | Phone | Anuj says |
| --- | --- | --- |
| 0:36 | Tap "Post a bounty", then "Your question has a place." with "demo, no card charged" | Someone already there. Bounties are a demo in this build: no card charged, no one dispatched. Here's their side. |
| 0:42 | "Try the example observer journey", then the task: "WHAT TO LOOK FOR" 01 to 03, and the line about faces | The Scout is anyone already there. They get a short checklist of what to look for, and clear rules: keep faces out of frame, skip anything unsafe. |
| 0:52 | "Explore an example", "Let's take a look.", "Open demo camera", the reticle locks, "Capture three sample frames" | Capture happens live, in the app. No camera-roll uploads. |
| 0:57 | Verifying ("Preparing an example answer"), then the answer: "One court is available." with "Example answer · not live" and "Created 0s ago" | And the asker gets an answer that says exactly how old it is. Saf? |

## 1:02–1:27 Saf: accessibility (live, free)

This segment uses the **real** live flow, so the account must be signed in before recording and production Supabase must have the accessibility migration. The demo request screen for this place shows a $2 bounty, which would contradict "free", so don't use it here.

| Time | Phone | Saf says |
| --- | --- | --- |
| 1:02 | Explore tab, sample tour, "All 12 places", "14 St - Union Sq Station", card: "Is the elevator working right now?" | Some questions matter more than others. Is the elevator working? For a wheelchair user, that decides whether the trip happens at all. |
| 1:11 | "Ask for a free place check", then select "Is the step-free entrance or elevator working?" and "15 min" | So accessibility is a built-in check, and live checks are free. |
| 1:17 | "Send check", then the check screen | Someone nearby answers yes or no. Every answer shows how old it is and is labelled self-reported, because trust is the product. Now Anuj gets to talk about money. |

## 1:27–1:55 Anuj: the business and the vision

| Time | Phone | Anuj says |
| --- | --- | --- |
| 1:27 | Settings gear, then Settings | How does Yonder make money? Asking and answering stay free, so the network can grow. |
| 1:32 | "Explore Yonder Plus", then monthly and yearly plans with "1 week free" | Yonder Plus is a monthly or yearly subscription on RevenueCat, with a one-week free trial, for people who plan ahead. |
| 1:39 | "Start 1 week free", the Test Store sheet, confirm, "Welcome to Plus." | That's a Test Store purchase, and our server, not the app, decides who has Plus. |
| 1:45 | Back to the check screen, then Explore, "Ask for a free place check": "KEEP IT OPEN FOR" now shows "1 hr" and "2 hr" | Plus keeps checks open for up to two hours. |
| 1:49 | Explore map, then the end card added in edit: yonder. · Ask someone already there. · github.com/anujk22/yonder | **Anuj:** Waze made roads live by asking drivers. We're doing it for every place. **Saf** (bubble cuts back for the last line): Yonder. Ask someone already there. |

## Balance and tone

- Speaking time is roughly equal: Saf has two turns plus the final line, Anuj has two turns. Each turn is about 60 to 70 words over 25 seconds, a relaxed pace.
- Each turn ends by handing to the other person ("Anuj, who actually answers?", "Saf?", "Now Anuj gets to talk about money."), so it plays as a conversation, not two monologues.
- Keep energy up: smile on the handoffs, and look at the phone when it does something (the mode colour change, "Welcome to Plus.").

## Hackathon requirements this film covers

| Requirement | Where |
| --- | --- |
| Next Gen: students, a video, open source | Saf's intro line; end card shows github.com/anujk22/yonder |
| RevenueCat purchase (Test Store is accepted for Next Gen) | 1:39 purchase, said out loud as a Test Store purchase |
| Design | Onboarding, mascot, transitions, answer cards on screen throughout |
| Peace Prize | 1:02 live, free accessibility check |
| HAMM | 1:27 free core plus a subscription with a trial, enforced on the server |
| OneSignal | Not shown on camera (push can't be recorded in this build). Cover it in the written submission with the App ID and campaign screenshots. |

## What changed from script v3, and why

- **"You only pay when someone answers"** is gone from Saf's first turn. The screen says bounties are a demo, and Anuj says so on the next screen.
- **"A little help. A better day."** is gone. When you start from your own request, the app goes from capture straight to the answer and skips that screen. It only appears on the Scout board path.
- **Accessibility uses the live, free check.** The demo shows a $2 bounty for the elevator. The live check is really free and really an accessibility question type.
- **"Keep a dollar plus three percent" and "fifty-cent fresh answers" are cut.** The app labels paid fresh answers "a future idea". Say "paid bounties are next" only if there's time.
- **Onboarding is used, not skipped.** Its first page is the opening shot, so Saf's problem statement plays over it.

Never claim users, revenue, payouts, verified answers or App Store approval.
