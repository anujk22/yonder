import test from "node:test";
import assert from "node:assert/strict";
import { purchaseKey, purchaseWasCancelled } from "../src/lib/purchasePolicy";

test("release builds never use Test Store or secret keys", () => {
  const base = { platform: "ios", development: false, expoGo: false };
  assert.equal(purchaseKey({ ...base, testKey: "test_example" }), null);
  assert.equal(purchaseKey({ ...base, appleKey: "test_example" }), null);
  assert.equal(purchaseKey({ ...base, appleKey: "sk_secret" }), null);
  assert.equal(purchaseKey({ ...base, appleKey: "appl_public", testKey: "test_example" }), "appl_public");
});

test("only a native development build can select Test Store", () => {
  const base = { platform: "ios", development: true, expoGo: false, testKey: "test_example" };
  assert.equal(purchaseKey(base), "test_example");
  assert.equal(purchaseKey({ ...base, expoGo: true }), null);
  assert.equal(purchaseKey({ ...base, platform: "web" }), null);
  assert.equal(purchaseKey({ ...base, development: false, platform: "android", googleKey: "goog_public" }), "goog_public");
});

test("purchase cancellation is distinguished from payment failures", () => {
  assert.equal(purchaseWasCancelled({ userCancelled: true }), true);
  assert.equal(purchaseWasCancelled({ userCancelled: false }), false);
  assert.equal(purchaseWasCancelled(new Error("Payment failed")), false);
  assert.equal(purchaseWasCancelled(null), false);
});
