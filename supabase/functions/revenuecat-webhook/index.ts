// Deploy: supabase functions deploy revenuecat-webhook --no-verify-jwt
// Secrets: REVENUECAT_WEBHOOK_AUTH (the Authorization value set in RevenueCat) and
// REVENUECAT_SECRET_KEY (a v1 secret API key). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided.
import { createClient } from "npm:@supabase/supabase-js@2";
import { eventUserIds, plusRow } from "./sync.ts";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sync(userId: string) {
  const response = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("REVENUECAT_SECRET_KEY")}` },
  });
  if (!response.ok) throw new Error(`RevenueCat ${response.status}`);
  const { subscriber } = await response.json();
  const row = plusRow(subscriber);
  const { error } = row
    ? await admin.from("plus_members").upsert({ user_id: userId, ...row, updated_at: new Date().toISOString() })
    : await admin.from("plus_members").delete().eq("user_id", userId);
  // A deleted Yonder account has no auth user left to reference.
  if (error && error.code !== "23503") throw error;
}

Deno.serve(async (request) => {
  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (!expected || request.headers.get("Authorization") !== expected) return new Response("Unauthorized", { status: 401 });
  const { event } = await request.json();
  try {
    await Promise.all(eventUserIds(event ?? {}).map(sync));
  } catch (error) {
    console.error(error);
    return new Response("Retry later", { status: 500 });
  }
  return new Response("ok");
});
