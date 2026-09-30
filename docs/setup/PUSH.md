# Push notifications (OneSignal)

Askers get a push when a Scout claims their check ("Someone’s checking") and when it's answered ("Pier 2 courts: Yes"). Tapping the notification opens the check.

## App

- `react-native-onesignal` with `onesignal-expo-plugin`, configured in `app.config.ts`.
  - The APNs environment is `production` for the EAS `production` profile and `development` otherwise.
  - No notification service extension and no OneSignal location module, so builds need no extra bundle ID.
- `EXPO_PUBLIC_ONESIGNAL_APP_ID` in `.env.local` / the EAS environment. It's a public identifier.
- `src/lib/push.ts`:
  - starts OneSignal and calls `OneSignal.login(<Supabase user id>)` on sign-in and `logout()` on sign-out;
  - asks for permission only right after someone posts their first check.

Push needs a native build (not Expo Go or web) and the Apple push key uploaded in OneSignal → Settings → Push & In-App → Apple iOS.

## Server

1. Deploy the function:

   ```sh
   supabase functions deploy notify-check --no-verify-jwt
   supabase secrets set NOTIFY_WEBHOOK_SECRET="<long random string>" ONESIGNAL_APP_ID="<app id>" ONESIGNAL_REST_API_KEY="<REST API key>"
   ```

2. Supabase → Database → Webhooks → new webhook:
   - table `public.pilot_requests`, event **Update**;
   - type HTTP request, POST to `https://<project>.supabase.co/functions/v1/notify-check`;
   - header `x-yonder-secret: <NOTIFY_WEBHOOK_SECRET>`.

`supabase/functions/notify-check/message.ts` decides what to send. Status changes other than claim and answer send nothing.

## Campaigns to deploy from the OneSignal dashboard

- **Welcome** (Journey, on first session): "Ask someone already there. Pick a place and tap Ask." Sent 1 hour after install if no check was posted.
- **Weekend nudge** (recurring, Saturday 10am local): "Heading out? Check the court, the line or the elevator before you go." Only to users active in the last 30 days.

Record the OneSignal App ID and a screenshot of each deployed campaign for the Shipaton entry.
