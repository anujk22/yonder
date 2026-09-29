# Invited live pilot: owner setup

This source includes an optional, shared two-person Ask/Observe pilot. The existing local demo works without an account. The hosted pilot has **not** been deployed or verified against a Supabase project; source checks alone do not establish a working cross-device exchange.

## What the owner needs to configure

1. Create a Supabase project. Copy its **Project URL** and **publishable** `sb_publishable_…` key from the project dashboard into `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (start from [`.env.example`](../../.env.example)). These values are public client configuration. Never put a `service_role`/secret key, database password, or SMTP credential in an `EXPO_PUBLIC_` variable or in chat. Rebuild or restart the app after changing them.
2. Apply [`20260927000000_pilot_shared_checks.sql`](../../supabase/migrations/20260927000000_pilot_shared_checks.sql) once in the project's SQL Editor. It creates the invited-member table, shared requests, reports, blocks, row-level policies and authenticated RPCs. Use a fresh project or inspect existing schema before applying it; this is a migration, not an idempotent seed script.
3. In **Authentication → Users**, create or invite at least two distinct email users controlled by the two testers. Copy their user UUIDs. Add *only those UUIDs* to the pilot allowlist in SQL Editor, replacing both placeholders:

   ```sql
   insert into public.pilot_members (user_id, active)
   values ('FIRST_AUTH_USER_UUID', true), ('SECOND_AUTH_USER_UUID', true)
   on conflict (user_id) do update set active = excluded.active;
   ```

   The app calls `signInWithOtp` with `shouldCreateUser: false`, and the database requires active membership for live actions. Disable open signups in the project Auth settings as another guard. Keep the allowlist small and use disposable accounts for deletion tests.
4. Configure email delivery **privately in Supabase**. The app expects a numeric email code and verifies it with `verifyOtp(type: "email")`; the Magic Link email template must include `{{ .Token }}`. Supabase's default mail service only sends to project-team addresses and is limited to two messages per hour. New free-tier projects using that default mail service cannot customize Auth email templates. For external pilot/judge email addresses, configure custom SMTP with a suitable sender, then test delivery and the code template before inviting users. Do not send SMTP credentials to the app or this repository. See [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), and the [free-tier template change](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier).

The exact account inputs needed for a configured build are the **Supabase Project URL** and **public publishable key**. The owner also needs two invited Auth users and their allowlist rows in the same project; those UUIDs are setup data, not app environment variables. Never share one-time codes or private credentials in source or chat.

## Prove the pilot works

Use two separate physical devices or independent app installations signed in as the two users. On A, select a place and create a live check; on B, refresh the pilot board, claim and answer it; on A, refresh and inspect the answer. Confirm an outsider account cannot read or act, a requester cannot claim their own check, an expired check cannot be answered, and cancellation, release, report and block behave as shown. Use a disposable account to test **Delete live account**, which deletes that user's shared checks and Auth user. No photo is uploaded by this pilot; the answer is a self-reported text observation. Do not describe this as physically verified or paid work.

The SQL does not currently schedule deletion for expired, answered or cancelled checks. Account deletion removes the user's records; otherwise an operator must establish and carry out a retention policy before expanding beyond the small pilot. Deploy the updated privacy/support pages and align store disclosures with this data flow before giving people access.

## Shipaton inputs outside this pilot

The pilot does not configure purchases or submit the contest entry. [RevenueCat setup](../shipaton/REVENUECAT_SETUP.md) lists the exact `yonder_plus` entitlement, Lifetime offering/package, Test Store or Apple product, public SDK key, and native purchase/restore evidence needed. A production iOS entry also needs a configured App Store Connect in-app purchase and a qualifying native build; the pending build 7 lacks RevenueCat. For Next Gen, the founders must confirm their academic Devpost email/team eligibility, publish tested source, provide a real public video under two minutes, a 1024 × 1024 icon, a 1179 × 2556 frame-free screenshot, and verify the final Devpost status. See [eligibility recheck](../shipaton/ELIGIBILITY_RECHECK.md) for current evidence and limits.
