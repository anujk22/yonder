# Handoff: maximize Yonder's Shipaton prize chances

For Anuj's Claude Code session. Written 2026-09-29 by Saf's session. **Deadline: Wednesday, Sept 30, 11:45pm PDT.**

Read this whole file before changing anything. Repo rules still apply: `AGENTS.md` says to read the Expo SDK 57 docs before writing code.

## 1. What changed today (already on `main`)

Saf's session merged two commits into `main` (`3e7f8ce`, `24e3ec9`). **Pull before doing anything.**

- **Yonder Plus is gone.** Collections are free and unlimited. `src/app/plus.tsx` and `src/lib/purchaseStore.ts` were deleted. `yonder_plus` / `yonder_plus_lifetime` are no longer used by the app.
- **New pricing** (`src/lib/pricing.ts`):
  - an answer to the same question from a day or more ago is **free**;
  - the latest answer (less than 24h old) costs **50¢**, a real RevenueCat consumable `yonder_recent_answer` (`src/lib/purchases.ts`, used in `src/app/ask/options.tsx`);
  - a new bounty is **$2 minimum**, raisable in 50¢ steps. Yonder keeps **$1 + 3% of anything above $2**; the Scout gets the rest.
- **Simulated money movement** (`src/lib/ledger.ts`, `src/lib/payments.ts`). Demo credits were replaced by:
  - a poster **tab**, charged at $5 or after 7 days; new posters are charged per bounty; $10 owed limit;
  - per-answer **same-day bank payouts** to Scouts.
  - Nothing moves real money; the plan is Stripe for collection and Dwolla for payouts. The fee math is in `docs/PAYMENTS.md`.
- `docs/shipaton/REVENUECAT_SETUP.md` was rewritten for the consumable.
- Checks: `npm test` (35 pass), `npm run typecheck` and `npm run lint` are clean. The web demo flow was verified end to end. **The native 50¢ purchase has not been tested on a device yet.**

Commit as yourself (Anuj). Saf's session commits as `safwansain21` on branch `pricing-bounty-model`. Pull before editing and keep commits small so the two sessions don't collide.

## 2. Which prizes we can realistically target

We plan to have a public App Store listing before the deadline. That opens categories beyond Next Gen, but **only if the published build is the current app** (the rules require it to "function as depicted in the video and/or text description"). Build 8 still has the old Plus paywall, so it is **not** the build to publish.

| Category | Fit | What it needs |
|---|---|---|
| **Next Gen** (primary) | Strong | Video + public repo with license (MIT is detected; GitHub About description is still empty). Judged on idea, working progress, **thoughtful RevenueCat use**, and product and technical care. |
| **HAMM** | Good | Live app + description of the monetization strategy. Rewards **multiple revenue streams**, a well-crafted paywall and scalability. |
| **Peace Prize** | Good if §4.2 ships | Live app + description of the social benefit. Accessibility checks are the story. |
| **Design Award** | Decent | Live app + description of standout design: 3D Scout art, category objects, mode transitions (`ART_DIRECTION.md`). |
| **Keep Them Coming Back (OneSignal, $25k 1st)** | Good fit, riskier | Live app with OneSignal integrated, ≥1 deployed campaign, OneSignal App ID. |
| Layers, Catvertising, Grand Prize, BuildInPublic, Viral, Replit, Kotlin, Galaxy, Stripe Funnels, Game, Influencer | Skip | Need traction, social history, other platforms or SDKs we don't have time for. |

Every non-Next-Gen category also requires **a free trial or a promo code** so judges can unlock the in-app purchase.

## 3. The critical path (do these first, in order)

All code that should be in the store build must land **before** the build is made. Apple review takes about a day, so freeze features within a few hours.

1. **RevenueCat dashboard** (project `4850e856`):
   - Test Store: consumable `yonder_recent_answer`, $0.50.
   - Add it to the **current** offering as a custom package.
   - Remove `$rc_lifetime` from the offering.
2. **Verify on a physical iPhone** with a debug build (`npx expo run:ios`, Test Store key in `.env.local`):
   - Explore → NYC sample tour → Pier 2 courts → Ask → options screen shows three choices.
   - Tap the $0.50 latest answer → purchase sheet → confirm → answer opens with a "Latest answer purchased" receipt.
   - Cancelling does nothing and shows no error.
   - **Screen-record this.** It is the RevenueCat beat in the video.
3. **App Store Connect** (app `6815955359`, bundle `com.anujkakumanu.yonder`):
   - create the consumable IAP (closest Apple price is $0.49);
   - import it into RevenueCat and put the `appl_` public key in the production EAS env;
   - make sure no Test Store key ships;
   - leave the old Plus IAP unused.
4. **Judge access.** A consumable has no free trial, so either:
   - (a) generate **offer codes** for the consumable (check App Store Connect supports this for consumables on our setup); or
   - (b) ship the Yonder Pass subscription with a free trial (§4.1), which satisfies the rule cleanly.
5. **Build 9 from `main`** (EAS production). Submit with the IAP attached. Answer the open 2.1.0 information request; `docs/shipaton/APP_REVIEW_RESPONSE_2026-09-29.md` has a draft, but update it for the new build. Consider requesting expedited review, citing the event deadline.

### Risk to decide now: selling sample answers

In the current app the answers are **labeled demo samples**. A public build that charges real money for them could be rejected as misleading, and it would be unfair to real buyers. Decide with Saf before submitting. Options:
- keep the purchase but make the paywall copy say plainly that this is a preview and what the buyer gets;
- in the store build, make the Yonder Pass (§4.1) the main purchase and treat the 50¢ answer as a preview;
- use offer codes so judges test it without paying.

Don't hide the demo labels to get through review.

## 4. Features that raise our score (after the critical path)

### 4.1 Yonder Pass subscription with a free trial (Next Gen + HAMM + judge access)

A monthly subscription that makes every latest answer free for frequent askers. It adds subscriptions, an entitlement, a free trial and restore purchases, which is the "thoughtful RevenueCat use" the judges look for. It also gives a third revenue stream alongside answer sales and bounty fees.

- RevenueCat:
  - entitlement `yonder_pass`;
  - an auto-renewing monthly product (suggested $2.99) with a 1-week free trial in both the Test Store and App Store Connect;
  - add it to the current offering.
- Code:
  - in `purchases.ts`, add `hasPass(customerInfo)` and a restore helper;
  - in `ask/options.tsx`, if the Pass is active, the latest answer unlocks without the consumable purchase;
  - add a simple paywall screen: price from the offering, trial terms, restore purchases, and links to the privacy/support pages;
  - `react-native-purchases-ui` for RevenueCat's hosted paywall is optional; it needs a native rebuild, so weigh the risk.
- **Don't** put bounties behind the Pass. Posters should never pay extra fees; that's a product decision Saf made.
- Update `docs/PAYMENTS.md` and `REVENUECAT_SETUP.md`, and add tests for the pricing logic.

### 4.2 Accessibility checks with no Yonder fee (Peace Prize + Next Gen idea)

- Accessibility questions (elevator working, ramp clear, step-free entrance) get a clear category or quick prompt. Sample data already has `unionsq` "Is the Union Sq north elevator working?"
- For `queryType === 'accessibility'`, Yonder takes **no fee**: the Scout gets the full bounty. Implement it in `splitBounty`/`priceQuery` in `src/lib/pricing.ts` with tests, and show "No Yonder fee on accessibility checks" on the bounty card.
- This is the Peace Prize story: a wheelchair user can confirm the elevator works before making the trip.

### 4.3 OneSignal push (only if 3 and 4.1 are safely done)

- `onesignal-expo-plugin` + `react-native-onesignal` (check Expo 57 compatibility first).
- Use case: "Your answer is ready" when a bounty is answered, plus one welcome or re-engagement campaign deployed from the OneSignal dashboard (a single deployed message meets the minimum).
- It needs a native rebuild and must be in the published build. Skip it if it threatens the build 9 timeline.

## 5. Submission package (Devpost)

- **Text description** covering features, the three ways to get an answer, and what is real vs. demo.
- **Per-category descriptions:**
  - **Next Gen:** product thinking, RevenueCat use, tests.
  - **HAMM:** the revenue streams (latest-answer sales about 42¢ net each; bounty fee about 77¢ net per $2 bounty after card and payout costs; Yonder Pass) and why posters never pay extra fees. Numbers are in `docs/PAYMENTS.md`.
  - **Peace Prize:** the accessibility checks.
  - **Design:** the art and motion system.
- **Assets:** 1024×1024 icon and at least one **1179×2556 frame-free screenshot from the native build**.
- **Store URL, the offer code or trial details for judges, and the repo URL.** Add a one-line GitHub About description.
- **Video under 2:00** on YouTube or Vimeo: Higgsfield intro, then Saf and Anuj on camera with split-screen app footage, including the real purchase sheet. Licensed music and sound effects only. Saf's session is updating the script for the new pricing.

## 6. Things never to claim

A live network of Scouts, real payouts or earnings, users, revenue, App Store approval before it happens, verified answers, or the invited live pilot. Bounties, tabs and payouts are simulated: say so.
