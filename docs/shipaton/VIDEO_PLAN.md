# Yonder submission film (about 1:57)

Layout: YC-style background, the phone recording in the centre, one speaker bubble bottom left. Caption by the bubble: **Safwan & Anuj · Rutgers University**.

The phone take is recorded first, without voices, by the agent in `AGENT_PROMPT.md`. Its clock runs 10 s behind the film: phone T+0:00 is film 0:10. Voices and webcam are recorded afterwards while watching the take. Record the take in the development build (`RECORDING_AUTOPILOT.md`).

## 0:00–0:10 Trailer (no bubble)

Generated shots, music only, labelled "concept animation". Text: "Is a hoop free right now?" then "yonder. Ask someone already there."

## 0:10–0:36 Saf: the problem and asking

| Film | Phone | Saf says |
| --- | --- | --- |
| 0:10 | Onboarding 1, "Ask someone already there." (mascot) | Hi, we're Safwan and Anuj, students at Rutgers. Ever crossed town for a court and found it packed? Maps tell you where a place is, not what's happening there now. |
| 0:20 | Next, the dark page "Or be the Scout.", Next, "Maybe later", Explore landing "Good plans. Better intel." | So we built Yonder: ask someone who's already there. |
| 0:25 | "Take the NYC sample tour", Pier 2 card "Are any basketball courts free?", "Try the local demo", tap the court question, "See answer options" | Pick a place, ask one question, |
| 0:31 | Options, "How do you want to know?", with "Post a bounty" and the free "Two courts are open · Sample · 1 day ago" | then choose how fresh you need it. A day-old answer is free. Need it right now? Post a bounty. Anuj, who actually answers? |

## 0:36–1:02 Anuj: the Scout

| Film | Phone | Anuj says |
| --- | --- | --- |
| 0:36 | Tap "Post a bounty", then "Your question has a place." with "demo, no card charged" | Someone already there: a Scout. The bounty runs as a demo in this build, so here's their side. |
| 0:42 | "Try the example observer journey", task "WHAT TO LOOK FOR" 01 to 03, and the line about faces | They get a short checklist of what to look for, and clear rules: keep faces out of frame, skip anything unsafe. |
| 0:52 | "Explore an example", "Let's take a look.", "Open demo camera", reticle locks, "Capture three sample frames" | Capture happens live, in the app. No camera-roll uploads. |
| 0:57 | "Preparing an example answer", then "One court is available." with "Example answer · not live" and "Created 0s ago" | And the asker gets an answer that says exactly how old it is. Saf? |

## 1:02–1:27 Saf: accessibility (live, free check; be signed in before recording)

| Film | Phone | Saf says |
| --- | --- | --- |
| 1:02 | Explore, sample tour, "All 12 places", "14 St - Union Sq Station", card "Is the elevator working right now?" | Some questions matter more than others. Is the elevator working? For a wheelchair user, that decides whether the trip happens at all. |
| 1:11 | "Ask for a free place check", select "Is the step-free entrance or elevator working?" and "15 min" | So accessibility is a built-in check, and live checks are free. |
| 1:17 | "Send check", then the check screen | Someone nearby answers yes or no, labelled self-reported, because trust is the product. Anuj, how does this make money? |

## 1:27–1:57 Anuj: the business and the vision

| Film | Phone | Anuj says |
| --- | --- | --- |
| 1:27 | Settings gear, then Settings | Right now, asking is free while the network grows. |
| 1:31 | "Explore Yonder Plus", monthly and yearly plans with "1 week free" | Yonder Plus is a monthly or yearly subscription on RevenueCat, with a one-week free trial, for people who plan ahead. |
| 1:38 | "Start 1 week free", Test Store sheet, confirm, "Welcome to Plus." | That's a Test Store purchase, and our server, not the app, decides who has Plus. |
| 1:44 | Explore, "Ask for a free place check": "KEEP IT OPEN FOR" now shows "1 hr" and "2 hr" | Plus keeps checks open for two hours. Next, paid bounties for everyone: the Scout gets paid, Yonder keeps a dollar plus three percent. |
| 1:51 | Explore map, then the end card (added in edit): yonder. · Ask someone already there. · github.com/anujk22/yonder | **Anuj:** Waze made roads live by asking drivers. We're doing it for every place. **Saf** (bubble cuts back): Yonder. Ask someone already there. |

Push line: only if OneSignal is configured before submitting, Anuj may add "and you get a push the moment it's answered" at 0:57. Otherwise leave it out.

Fee note: `src/lib/pricing.ts` charges $1 plus 3% of the amount above the $2 minimum. "A dollar plus three percent" is a fair roadmap line; say "planned" if a judge asks, because paid bounties aren't live.

## Hackathon requirements this film covers

| Requirement | Where |
| --- | --- |
| Next Gen: students, a video, open source | Saf's intro line and the caption; end card shows github.com/anujk22/yonder |
| RevenueCat purchase (Test Store is accepted for Next Gen) | 1:39 purchase, said out loud as a Test Store purchase |
| Design | Onboarding, mascot, transitions, answer cards on screen throughout |
| Peace Prize | 1:02 live, free accessibility check |
| HAMM | 1:27 free core plus a subscription with a trial, enforced on the server |
| OneSignal | Not shown on camera (push can't be recorded in this build). Cover it in the written submission with the App ID and campaign screenshots. |

## What changed from script v3, and why

- **"You only pay when someone answers"** is gone from Saf's first turn. The screen says bounties are a demo, and Anuj says so on the next screen.
- **"A little help. A better day."** is gone. When you start from your own request, the app goes from capture straight to the answer and skips that screen. It only appears on the Scout board path.
- **Accessibility uses the live, free check.** The demo shows a $2 bounty for the elevator. The live check is really free and really an accessibility question type.
- **"Fifty-cent fresh answers" is cut.** The app labels paid fresh answers "a future idea". "A dollar plus three percent" stays, framed as what comes next.
- **Onboarding is used, not skipped.** Its first page is the opening shot, so Saf's problem statement plays over it.

Never claim users, revenue, payouts, verified answers or App Store approval.
