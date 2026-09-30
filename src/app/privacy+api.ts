export function GET() {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Yonder Privacy Policy</title>
<style>body{max-width:42rem;margin:3rem auto;padding:0 1.25rem;font:16px/1.6 system-ui,sans-serif;color:#242a23;background:#f7f7f0}h1{line-height:1.2}h2{margin-top:2rem}a{color:#365d45}</style></head>
<body><h1>Yonder Privacy Policy</h1><p>Updated September 29, 2026</p>
<p>Yonder operates this service. For questions or privacy requests, <a href="mailto:anujkakumanu@gmail.com">email Yonder support</a>.</p>
<h2>Information you choose to use</h2>
<p>If you search for a place, Yonder sends the words you enter to its server, which forwards the search to OpenStreetMap Nominatim or a configured geocoding provider. You can search without granting device-location access.</p>
<p>If you allow foreground location, Yonder uses it on your device to center the map and show your position. The current app does not send your device location to Yonder's place-search server.</p>
<p>Saved places, collections and personal pins are stored on your device. They do not sync to a Yonder account. Explore and Saved work without an account.</p>
<h2>Accounts and community checks</h2>
<p>Community checks use an email account. Supabase processes your email and authentication credentials and assigns an account identifier. You sign in with a one-time code sent to your email. Your sign-in session is stored on your device; your email is not shown to other community members.</p>
<p>When you send a check, Yonder sends the selected public place's name and coordinates, optional landmark, question and expiry time to Supabase. Shared records include the requester and responding Scout's account identifiers, status, timestamps, answer and optional note. Open checks are visible to signed-in community members; the requester and responding Scout can see their check and answer. These coordinates identify the selected place, not a live feed of your device location. Answers are self-reported, with no photo or GPS verification.</p>
<p>Reports store the check identifier, reporter identifier, reason and review status. Blocks store the participating account identifiers. Yonder uses this information to moderate content and restrict interactions. Shared checks do not upload photos, dispatch Scouts or process payments; bounty payments are a demo in this build.</p>
<h2>Yonder Plus purchases</h2>
<p>If you subscribe to Yonder Plus, the App Store or Google Play processes your payment; Yonder never receives your card details. RevenueCat processes the purchase record (product, dates, subscription status and store transaction identifiers). When you are signed in, the purchase is associated with your Yonder account identifier so Plus benefits apply to your community checks; Yonder stores whether and until when your account has Plus.</p>
<h2>Notifications</h2>
<p>If you allow notifications, OneSignal processes a push token for your device and your Yonder account identifier so Yonder can tell you when someone is checking or has answered your check, and send occasional service messages. You can turn notifications off in your device settings at any time.</p>
<h2>Optional local demo</h2>
<p>Some preview builds include a separate, clearly labeled local demo with sample requests, answers, bounties and earnings. No one is dispatched or paid. Its optional device-check path uses foreground location and captures three camera frames. Those photos and location readings stay on the device and are not uploaded or independently verified. The sample path works without camera or location permission.</p>
<h2>Server storage and providers</h2>
<p>Yonder's server caches place-search terms in memory to limit repeated provider requests. Search results are refreshed after 24 hours; old entries can remain in memory until replaced, evicted or the server restarts. Hosting and place-data providers may process request URLs and technical logs under their own policies. The platform map provider may process map and location data under its own policy.</p>
<p>Supabase stores account, shared-check and safety records for the service in its U.S. East region. Shared checks stop appearing in the app after 30 days. Older records can remain stored until cleanup or account deletion. Contact support for access or deletion requests.</p>
<p>Supabase records authentication and security events, such as sign-ins, email verification, token refreshes and account deletion. These technical records can include your account identifier, IP address, user-agent information about your device or browser, and timestamps. They are used for security, abuse prevention and troubleshooting. Provider authentication, security and technical logs follow separate retention settings and policies and may remain after your account and shared records are deleted.</p>
<h2>Your choices</h2>
<p>You can decline or turn off camera and location permissions in iOS Settings. You can remove collections within the app; removing a collection leaves its saved places intact. Removing the app removes its locally saved data, but does not delete your shared account or server records.</p>
<p>To delete your account, open Settings, choose Delete account, then confirm. An active Plus subscription is managed and cancelled through your store account. This deletes the account and shared checks you requested or answered, along with associated reports and blocks. Signing out does not delete an account. Contact Yonder support at the email above for privacy requests or if you cannot sign in; do not send passwords, card details or sensitive photos.</p>
<p><a href="/support">Support</a></p></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
