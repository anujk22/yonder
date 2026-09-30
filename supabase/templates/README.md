# Auth email templates

Yonder signs people in with a 6-digit email code. Supabase sends two emails for that flow:

| Supabase template | File | Subject |
| --- | --- | --- |
| Confirm signup (first code for a new email) | `confirm-signup.html` | `Your Yonder code: {{ .Token }}` |
| Magic Link (code for an existing account) | `sign-in-code.html` | `Your Yonder code: {{ .Token }}` |

Paste each file into **Authentication → Email Templates** in the Supabase dashboard. Both use `{{ .Token }}`, so no links are sent.

The logo loads from `https://yonder.expo.app/email/yonder-scout.png` (`public/email/`), so deploy the web app before switching templates.

## Delivery

Supabase's built-in email sender is rate-limited and meant for development. Before inviting real people, set **Authentication → SMTP Settings** to a transactional provider (for example Resend or Postmark) with a verified sending domain and a sender like `Yonder <hello@your-domain>`. Then raise the auth email rate limit to match.

Set **Authentication → Providers → Email → Email OTP length** to 6 so the code matches the app's input.
