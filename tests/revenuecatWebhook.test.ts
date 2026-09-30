import test from "node:test";
import assert from "node:assert/strict";
import { eventUserIds, plusRow } from "../supabase/functions/revenuecat-webhook/sync";

const user = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";

test("webhook syncs only Yonder account ids named by the event", () => {
  assert.deepEqual(eventUserIds({ app_user_id: "$RCAnonymousID:abc" }), []);
  assert.deepEqual(eventUserIds({ app_user_id: user, original_app_user_id: user, aliases: ["$RCAnonymousID:abc", user] }), [user]);
  assert.deepEqual(eventUserIds({ transferred_from: [user], transferred_to: [other] }), [user, other]);
});

test("Plus rows follow RevenueCat's current entitlement state", () => {
  const now = Date.parse("2026-10-01T00:00:00Z");
  assert.deepEqual(plusRow({ entitlements: { yonder_plus: { expires_date: "2026-11-01T00:00:00Z" } } }, now), { expires_at: "2026-11-01T00:00:00Z" });
  assert.deepEqual(plusRow({ entitlements: { yonder_plus: { expires_date: null } } }, now), { expires_at: null });
  assert.equal(plusRow({ entitlements: { yonder_plus: { expires_date: "2026-09-01T00:00:00Z" } } }, now), null);
  assert.equal(plusRow({ entitlements: {} }, now), null);
  assert.equal(plusRow({}, now), null);
});
