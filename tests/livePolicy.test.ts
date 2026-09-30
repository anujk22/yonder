import test from "node:test";
import assert from "node:assert/strict";
import { validLiveAnswer, validLiveConfiguration, validateLiveRequest, liveErrorMessage } from "../src/lib/livePolicy";
import type { NewLiveRequest } from "../src/lib/liveTypes";

test("live client accepts public configuration and rejects secret keys and insecure remote URLs", () => {
  assert.equal(validLiveConfiguration("https://example.supabase.co", "sb_publishable_example"), true);
  assert.equal(validLiveConfiguration("http://localhost:54321", "sb_publishable_example"), true);
  for (const key of [undefined, "", "sb_secret_example", "service_role", "sk_secret"]) {
    assert.equal(validLiveConfiguration("https://example.supabase.co", key), false);
  }
  for (const url of [undefined, "invalid", "http://example.com", "https://user:password@example.com"]) {
    assert.equal(validLiveConfiguration(url, "sb_publishable_example"), false);
  }
});

test("live requests require bounded place snapshots, supported questions and deadlines", () => {
  const input: NewLiveRequest = { placeName: "Public court", latitude: 40, longitude: -74, landmark: "West entrance", questionKind: "availability", deadlineMinutes: 10 };
  assert.doesNotThrow(() => validateLiveRequest(input));
  for (const changes of [{ latitude: NaN }, { latitude: 91 }, { longitude: Infinity }, { placeName: " " }, { landmark: "x".repeat(181) }, { deadlineMinutes: 0 }, { deadlineMinutes: 120 }, { placeName: "Follow my ex" }]) {
    assert.throws(() => validateLiveRequest({ ...input, ...changes }));
  }
});

test("observations accept only answers appropriate to their question", () => {
  for (const value of ["0", "1", "240", "unsure"]) assert.equal(validLiveAnswer("queue", value), true);
  for (const value of ["-1", "241", "1.5", "01", "1e2", "yes", ""]) assert.equal(validLiveAnswer("queue", value), false);
  for (const kind of ["open_now", "availability"] as const) {
    for (const value of ["yes", "no", "unsure"]) assert.equal(validLiveAnswer(kind, value), true);
    assert.equal(validLiveAnswer(kind, "15"), false);
  }
});

test("backend errors explain recovery without exposing database details", () => {
  assert.match(liveErrorMessage({ code: "42501", message: "private SQL details" }), /invitation/);
  assert.match(liveErrorMessage({ message: "request expired" }), /expired/);
  assert.match(liveErrorMessage(new Error("Failed to fetch")), /connection/);
  assert.doesNotMatch(liveErrorMessage({ message: "SQL secret internal table stack" }), /secret|SQL|stack/);
});

test("accessibility checks take yes/no answers and Plus unlocks longer windows", async () => {
  const { timeAgo, timeLeft, distanceLabel, sortByDistance } = await import("../src/lib/liveTypes");
  for (const value of ["yes", "no", "unsure"]) assert.equal(validLiveAnswer("accessibility", value), true);
  assert.equal(validLiveAnswer("accessibility", "10"), false);
  const input: NewLiveRequest = { placeName: "Station", latitude: 40, longitude: -74, landmark: "", questionKind: "accessibility", deadlineMinutes: 60 };
  assert.throws(() => validateLiveRequest(input));
  assert.doesNotThrow(() => validateLiveRequest(input, true));
  assert.throws(() => validateLiveRequest({ ...input, deadlineMinutes: 240 }, true));

  const now = Date.parse("2026-10-01T12:00:00Z");
  assert.equal(timeAgo("2026-10-01T11:59:40Z", now), "just now");
  assert.equal(timeAgo("2026-10-01T11:56:00Z", now), "4 min ago");
  assert.equal(timeAgo("2026-10-01T09:00:00Z", now), "3 hr ago");
  const request = { expires_at: "2026-10-01T12:17:30Z" } as Parameters<typeof timeLeft>[0];
  assert.equal(timeLeft(request, now), "18 min left");
  assert.equal(timeLeft({ ...request, expires_at: "2026-10-01T11:00:00Z" }, now), "Closed");
  assert.equal(distanceLabel(42), "40 m away");
  assert.equal(distanceLabel(3200), "2.0 mi away");
  const near = { latitude: 40.001, longitude: -74 } as Parameters<typeof timeLeft>[0];
  const far = { latitude: 41, longitude: -74 } as Parameters<typeof timeLeft>[0];
  assert.deepEqual(sortByDistance([far, near], { latitude: 40, longitude: -74 }), [near, far]);
  assert.deepEqual(sortByDistance([far, near], null), [far, near]);
});
