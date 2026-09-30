// Deploy: supabase functions deploy notify-check --no-verify-jwt
// Then add a Database Webhook on public.pilot_requests (UPDATE) that POSTs here with header
// `x-yonder-secret: <NOTIFY_WEBHOOK_SECRET>`.
// Secrets: NOTIFY_WEBHOOK_SECRET, ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY.
import { checkUpdateMessage } from "./message.ts";

Deno.serve(async (request) => {
  const secret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  if (!secret || request.headers.get("x-yonder-secret") !== secret) return new Response("Unauthorized", { status: 401 });
  const { record, old_record } = await request.json();
  const message = record ? checkUpdateMessage(old_record, record) : null;
  if (!message) return new Response("skipped");
  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${Deno.env.get("ONESIGNAL_REST_API_KEY")}` },
    body: JSON.stringify({
      app_id: Deno.env.get("ONESIGNAL_APP_ID"),
      target_channel: "push",
      include_aliases: { external_id: [message.userId] },
      headings: { en: message.heading },
      contents: { en: message.body },
      data: message.data,
    }),
  });
  if (!response.ok) {
    console.error("OneSignal", response.status, await response.text());
    return new Response("Retry later", { status: 502 });
  }
  return new Response("sent");
});
