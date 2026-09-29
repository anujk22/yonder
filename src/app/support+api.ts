export function GET() {
  return new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Yonder Support</title>
<style>body{max-width:42rem;margin:3rem auto;padding:0 1.25rem;font:16px/1.6 system-ui,sans-serif;color:#242a23;background:#f7f7f0}h1{line-height:1.2}a{color:#365d45}</style></head>
<body><h1>Yonder Support</h1>
<p>Need help with Yonder or want to report a problem? <a href="mailto:anujkakumanu@gmail.com">Email Yonder support</a>.</p>
<p>Yonder lets you explore mapped places and save places and custom pins on your device. The local Ask and Observe demonstration does not contact another person, verify an answer, transfer money, or pay a reward.</p>
<p>Some builds also connect an invited live pilot. Sign in with an invited email to send a free shared check or answer one from another participant. If you cannot receive a code, confirm that your invitation is active and contact support. Answers are self-reported, may never arrive, and do not earn money. You can report a check, block a participant, or delete your live account inside the pilot.</p>
<p>Collections are free and stay on this device. Buying the latest answer to a question is a one-time in-app purchase for that answer; it unlocks the answer right away. If a purchase is pending, allow the store to finish processing. Use the app store's refund process for refund requests. Bounties and Scout payouts are simulated in this build and never charge a card or send money.</p>
<p>For place-search or map problems, include your device model, iOS version, app version, and what you tried. Please do not send photos or precise location details unless they are needed to explain the issue.</p>
<p><a href="/privacy">Privacy policy</a></p></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
