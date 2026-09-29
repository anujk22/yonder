# Inputs needed to finish Yonder

The source is prepared; account setup and real-device evidence require the owner's accounts. For the September 30 deadline, prioritize **Next Gen**. The [RevenueCat handoff](../shipaton/REVENUECAT_SETUP.md) and [optional pilot handoff](INVITED_PILOT.md) contain the exact steps.

| Input or action | Exact value or result needed |
| --- | --- |
| Next Gen RevenueCat purchase | Configure entitlement `yonder_plus`, a current offering with a Lifetime Test Store product, and public `EXPO_PUBLIC_REVENUECAT_TEST_KEY` (`test_…`) in a **native debug build**. Supply the RevenueCat **Project ID** (not an API key) for the Devpost field. Observe a successful purchase, restore, entitlement-backed collection unlock and dashboard event. An [organizer Manager confirmed Test Store is sufficient for Next Gen](https://revenuecat-shipaton-2026.devpost.com/forum_topics/44695-next-gen-eligibility-is-a-test-store-only-purchase-sufficient). |
| Next Gen submission | Send Saf a private invitation through Devpost Manage Team; have him accept it and confirm both founders' student eligibility. Change the signed-in Devpost account from its current personal email to a qualifying academic email and reverify it; fill the additional academic-email field, publish tested source, provide a real public video under two minutes, 1024 × 1024 icon, 1179 × 2556 frame-free screenshot, and verify the final Devpost **Submitted** state. |
| Optional invited pilot | Set `EXPO_PUBLIC_SUPABASE_URL` and public `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`), apply the SQL migration, add two Auth users to `public.pilot_members`, and configure private SMTP plus the email-code template. This is not a Next Gen submission gate. |
| Optional public iOS category | Configure the Apple non-consumable `com.anujkakumanu.yonder.plus.lifetime` and public `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` (`appl_…`); prove an Apple sandbox purchase and release the qualifying build in the US before the deadline. |

Never ship the Test Store key in a release build. Do not share Supabase secret/service-role keys, database passwords, SMTP credentials, Apple credentials, RevenueCat secret keys, or one-time email codes in chat or source.
