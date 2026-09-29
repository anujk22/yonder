export function GET() {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Yonder Privacy Policy</title>
<style>body{max-width:42rem;margin:3rem auto;padding:0 1.25rem;font:16px/1.6 system-ui,sans-serif;color:#242a23;background:#f7f7f0}h1{line-height:1.2}h2{margin-top:2rem}a{color:#365d45}</style></head>
<body><h1>Yonder Privacy Policy</h1><p>Updated September 27, 2026</p>
<p>Yonder operates this service. For questions or privacy requests, <a href="mailto:anujkakumanu@gmail.com">email Yonder support</a>.</p>
<h2>Information you choose to use</h2>
<p>If you search for a place, Yonder sends the words you enter to its server, which forwards the search to OpenStreetMap Nominatim or a configured geocoding provider. You can search without granting device-location access.</p>
<p>If you allow foreground location, Yonder uses it on your device to center the map, show your position and check proximity in an optional device-check demonstration. The current app does not send your device location to Yonder's place-search server.</p>
<p>Yonder uses your camera only when you choose the device capture path. Camera photos stay on your device and are not uploaded by the current app. Saved places, collections, custom pins, demo requests, demo balances and demo answers are stored on your device. They do not sync to a Yonder account.</p>
<h2>Server storage and providers</h2>
<p>Yonder's server caches place-search terms in memory to limit repeated provider requests. Search results are refreshed after 24 hours; old entries can remain in memory until replaced, evicted or the server restarts. Hosting and place-data providers may process request URLs and technical logs under their own policies. The platform map provider may process map and location data under its own policy. The local demo does not dispatch requests to other users.</p>
<h2>Optional invited live pilot</h2>
<p>In a build connected to the invited pilot, Supabase processes your email address, sign-in codes and account information. Invited members can send shared checks containing a selected place name and map coordinates, a public landmark, a structured question and expiry time. A participant can claim a check and submit a self-reported answer and optional text note. The pilot also stores request status and timestamps, account identifiers, reports and blocks. Other invited members can see open checks; the requester and assigned observer can see their shared check. The pilot does not upload camera photos or pay observers. An answer is not independently verified.</p>
<p>Live checks remain in the pilot database after they expire or close; there is no scheduled deletion period yet. Deleting your live account in the app removes that account and its associated live checks, reports and blocks. Supabase and hosting providers may retain technical or security logs under their own policies. See <a href="https://supabase.com/privacy">Supabase's privacy policy</a>.</p>
<h2>Optional Yonder Plus purchases</h2>
<p>Builds with Yonder Plus enabled use RevenueCat and the platform app store to process and restore purchases. RevenueCat processes an app-generated customer identifier, purchase and entitlement records, and technical information needed to operate the SDK. Yonder does not receive your card number. Saved collection names, place lists, camera photos and precise device location are not sent to RevenueCat by our integration. See <a href="https://www.revenuecat.com/privacy/">RevenueCat's privacy policy</a> and your app store's policy for their processing practices.</p>
<p>Plus unlocks additional local collections. It does not purchase observations or pay scouts. Older preview builds may not offer Plus. Test Store builds are labeled and do not charge real money.</p>
<h2>Your choices</h2>
<p>You can decline or turn off location and camera permissions in iOS Settings. You can remove collections within the app. Removing the app removes its locally saved data; it does not delete a live account or purchase records. The live pilot includes an in-app Delete live account action. Purchase records held by RevenueCat and the store are separate. Contact us at the email above for deletion or access requests about information processed for Yonder; include enough detail for us to identify the request, and do not email passwords, one-time codes, card details or sensitive photos. Store transaction records may be retained by the store under its own requirements.</p>
<p><a href="/support">Support</a></p></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
