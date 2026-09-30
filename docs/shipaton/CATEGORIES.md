# Category entries: requirements and written descriptions

Categories: Next Gen, Design, Peace Prize, OneSignal (Keep Them Coming Back), HAMM. Everything below describes `main` at the latest push. Claims marked **unverified** have not been observed on a device or hosted project. Do not submit them as done until they are.

## Status by category

| Category | In the code | Still owner-only (dashboards, accounts) |
| --- | --- | --- |
| Next Gen | Public repo, video plan, Test Store purchase path | Confirm both builders are active students; record and upload the video; final commit hash |
| Design | Below | Screenshots from the final build |
| Peace Prize | Accessibility check kind, server-enforced; safety, reporting, blocking, deletion | Production Supabase set up (steps below); one recorded two-device accessibility check |
| OneSignal | SDK, plugin, login by account id, push on claim and answer, deep link to the check | Production App ID, APNs key, deploy `notify-check`, DB webhook, at least one campaign, App ID in the submission |
| HAMM | Below | Test Store products and webhook configured; one recorded trial and restore |

## Production Supabase (Peace Prize, and needed by OneSignal and HAMM)

```sh
supabase link --project-ref <ref>
supabase db push        # includes 20261001000000_accessibility_and_plus.sql
supabase functions deploy notify-check --no-verify-jwt
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase secrets set NOTIFY_WEBHOOK_SECRET=... ONESIGNAL_APP_ID=... ONESIGNAL_REST_API_KEY=... \
  REVENUECAT_WEBHOOK_AUTH=... REVENUECAT_SECRET_KEY=...
```

Then: Database Webhook on `public.pilot_requests` (Update) to `notify-check` with header `x-yonder-secret`; Auth email templates from `supabase/templates/`; custom SMTP (the built-in sender is rate limited); RLS stays on. Verify by asking an accessibility check from one account and answering it from another, with screen recording.

## OneSignal

1. Create or choose the **production** OneSignal app; add its App ID as `EXPO_PUBLIC_ONESIGNAL_APP_ID` in the EAS production environment.
2. Upload the APNs auth key (.p8, Key ID, Team ID) under Settings, Push & In-App, Apple iOS.
3. Deploy `notify-check` and the webhook (above).
4. Deploy at least one campaign from the dashboard (copy in `docs/setup/PUSH.md`) and screenshot it.
5. Put the App ID and screenshots in the submission.

Push is **unverified** until a real device receives "Someone's checking" and the answer push from a production-profile build.

## Written description: Design

Yonder answers a question maps can't: is it worth the trip right now? The design goal is that a stranger's answer feels as light as a text from a friend.

- **One character.** Scout, a small yellow mascot, is the only illustration system. It faces the viewer on the landing, the app icon and the email, so the brand reads the same everywhere. The icon ships as light, dark and tinted iOS variants on a soft background instead of a single flat tile.
- **Two modes, one gesture.** Asking and scouting are separate modes. Switching plays a full-screen reveal with its own palette and a spin whose direction reverses on the way back, with a medium haptic. The transition tells you which side of the exchange you're on.
- **Map first.** The home screen is a map with a signal-ring animation around the mascot. Search is biased toward where the map is looking, so results feel local.
- **Plain, honest copy.** Every answer is labelled as self-reported. Times are relative ("12 min ago", "25 min left"), never coordinates. Empty states explain the next step.
- **Calm onboarding.** Three pages: the idea, how it works on a dark page, then location, asked only when the person taps "Use my location". Push is asked only after their first check, never on launch.
- **Accessibility as a question type.** "Is the elevator working?" sits beside "Is there room?" as an ordinary check, with yes/no answers, so no special mode is needed.
- **Sign in without a password.** Email, then a six-digit code, in branded emails with the same mascot.

## Written description: Monetization strategy (HAMM)

Yonder earns on each fresh answer, for every user, and sells a subscription to people who plan ahead.

- **Pay per request (bounties), for everyone.** Need to know right now? Post a bounty, from $2. The Scout who goes and looks gets paid, and Yonder keeps $1 of the $2 minimum plus 3% of anything above it, which covers card processing on larger bounties. The asker is only billed if someone answers. Pricing and splits are in code (`src/lib/pricing.ts`, `docs/PAYMENTS.md`). In this build bounties are simulated: no card is charged and no Scout is paid.
- **Free where it builds the network.** An answer that's a day or more old is free. Live community checks are free today while the network grows. Free answers bring askers, and askers bring paid bounties.
- **Yonder Plus, a monthly subscription** (yearly option, prices read from the RevenueCat offering, never hardcoded): 1 and 2 hour check windows, ten open checks at once, unlimited collections, with a 1 week free trial. It's for people who plan ahead, such as leagues, event organizers and frequent travellers. It doesn't gate asking.
- **Enforced on the server.** A RevenueCat webhook writes `plus_members`, and the database decides deadlines and limits, so a modified client can't grant itself Plus. The webhook reads the current subscriber state on every event, so retries and out-of-order events converge. The RevenueCat app user id is the Yonder account id; restore and manage-subscription are in Settings.
- **What we'll measure:**
  - bounty post rate;
  - answer rate within the deadline;
  - repeat askers;
  - Plus trial starts and trial-to-paid.

  We have no revenue or users to report yet. Test Store purchases are sandbox data.

## Written description: Peace Prize

Free, self-reported checks about access, such as "Is the elevator working?", help people with mobility needs avoid a trip that ends at a broken lift. This isn't verified information and Yonder doesn't claim it is. Answers are labelled self-reported, and reporting, blocking, a shared text filter and in-app account deletion are built in. We have no users or measured impact to report. Do not claim any.
