export function GET() {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Yonder Privacy Policy</title>
<style>body{max-width:42rem;margin:3rem auto;padding:0 1.25rem;font:16px/1.6 system-ui,sans-serif;color:#242a23;background:#f7f7f0}h1{line-height:1.2}h2{margin-top:2rem}a{color:#365d45}</style></head>
<body><h1>Yonder Privacy Policy</h1><p>Updated September 29, 2026</p>
<p>Yonder operates this service. For questions or privacy requests, <a href="mailto:anujkakumanu@gmail.com">email Yonder support</a>.</p>
<h2>Information you choose to use</h2>
<p>If you search for a place, Yonder sends the words you enter to its server, which forwards the search to OpenStreetMap Nominatim or a configured geocoding provider. You can search without granting device-location access.</p>
<p>If you allow foreground location, Yonder uses it on your device to center the map and show your position. The current app does not send your device location to Yonder's place-search server.</p>
<p>Saved places, collections and custom pins are stored on your device. They do not sync to a Yonder account. The App Store release has no account registration, shared requests, camera capture or in-app purchases.</p>
<h2>Server storage and providers</h2>
<p>Yonder's server caches place-search terms in memory to limit repeated provider requests. Search results are refreshed after 24 hours; old entries can remain in memory until replaced, evicted or the server restarts. Hosting and place-data providers may process request URLs and technical logs under their own policies. The platform map provider may process map and location data under its own policy.</p>
<h2>Your choices</h2>
<p>You can decline or turn off location permission in iOS Settings. You can remove collections within the app; removing a collection leaves its saved places intact. Removing the app removes its locally saved data. Contact Yonder support at the email above for deletion or access requests about information processed by the service; do not send passwords, card details or sensitive photos.</p>
<p><a href="/support">Support</a></p></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
