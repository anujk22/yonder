export function GET() {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Yonder Support</title>
<style>body{max-width:42rem;margin:3rem auto;padding:0 1.25rem;font:16px/1.6 system-ui,sans-serif;color:#242a23;background:#f7f7f0}h1{line-height:1.2}a{color:#365d45}</style></head>
<body><h1>Yonder Support</h1>
<p>Need help with Yonder or want to report a problem? <a href="mailto:anujkakumanu@gmail.com">Email Yonder support</a>.</p>
<p>Yonder lets you search U.S. places, explore the map, save places and personal pins, and organize saved places into free unlimited collections on your device. No account or purchase is required. Lists do not sync between devices.</p>
<p>Open Saved → Organize into collections to create a list, add or remove its saved places, rename it, or remove it. Removing a collection does not remove your saved places. Location permission is optional for centering the map; search works without it.</p>
<p>For place-search or map problems, include your device model, iOS version, app version, and what you tried. Please do not send photos or precise location details unless they are needed to explain the issue.</p>
<p><a href="/privacy">Privacy policy</a></p></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
