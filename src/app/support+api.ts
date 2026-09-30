export function GET() {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Yonder Support</title>
<style>body{max-width:42rem;margin:3rem auto;padding:0 1.25rem;font:16px/1.6 system-ui,sans-serif;color:#242a23;background:#f7f7f0}h1{line-height:1.2}a{color:#365d45}</style></head>
<body><h1>Yonder Support</h1>
<p>Need help with Yonder or want to report a problem? <a href="mailto:anujkakumanu@gmail.com">Email Yonder support</a>.</p>
<p>Yonder lets you ask someone already at a public place about opening, the wait, or available room. Community checks are free. Another member can choose to answer; a response is not guaranteed, and answers are self-reported, not photo or GPS verified. Yonder does not dispatch Scouts or offer payments or rewards.</p>
<p>You can also search U.S. places, explore the map, save places and personal pins, and organize saved places into free unlimited collections on your device. Explore and Saved need no account. Lists do not sync between devices.</p>
<p>Open Saved → Organize into collections to create a list, add or remove its saved places, rename it, or remove it. Removing a collection does not remove your saved places. Location permission is optional for centering the map; search works without it.</p>
<h2>Community checks and accounts</h2>
<p>Open a place and choose Request a live check. Sign in with your email and password, select a supported question and expiry time, then send the check. New accounts require email confirmation before signing in. If confirmation or sign-in email does not arrive, check spam and contact support. Requests shows your checks; Scout shows available checks you can answer when you are at the place.</p>
<p>To delete your account, sign in and open Requests or Scout, choose Delete live account, then confirm. This deletes your account and the shared checks you requested or answered, along with associated reports and blocks. Signing out or removing the app does not delete server records.</p>
<h2>Community rules and reports</h2>
<p>Use Yonder for public places and observable conditions. Do not track people, enter restricted areas, or post private, illegal, threatening or abusive content. Answer only from the place and say when you cannot tell. Open a check and use Report to flag unsafe, spam or inaccurate content. After an interaction, you can block the other participant. Contact support for safety concerns or access problems.</p>
<p>Some preview builds also include a clearly labeled local demo with sample requests, answers, bounties and earnings. Demo requests and optional camera/GPS captures stay on your device; no one is dispatched or paid. These samples are separate from shared community checks.</p>
<p>For place-search or map problems, include your device model, iOS version, app version, and what you tried. Please do not send photos or precise location details unless they are needed to explain the issue.</p>
<p><a href="/privacy">Privacy policy</a></p></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
