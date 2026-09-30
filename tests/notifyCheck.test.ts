import test from "node:test";
import assert from "node:assert/strict";
import { checkUpdateMessage } from "../supabase/functions/notify-check/message";

const check = { id: "c1", requester_id: "u1", place_name: "Pier 2 courts", question_kind: "availability", status: "open", answer: null };

test("askers are told when a Scout claims and answers their check", () => {
  const claimed = checkUpdateMessage(check, { ...check, status: "claimed" });
  assert.equal(claimed?.userId, "u1");
  assert.equal(claimed?.heading, "Someone’s checking");
  assert.deepEqual(claimed?.data, { check_id: "c1" });
  const answered = checkUpdateMessage({ ...check, status: "claimed" }, { ...check, status: "answered", answer: "yes" });
  assert.equal(answered?.heading, "Pier 2 courts: Yes");
  assert.equal(checkUpdateMessage({ ...check, status: "claimed" }, { ...check, question_kind: "queue", status: "answered", answer: "15" })?.heading, "Pier 2 courts: About 15 min wait");
  assert.equal(checkUpdateMessage({ ...check, status: "claimed" }, { ...check, status: "answered", answer: "unsure" })?.heading, "Pier 2 courts: They couldn’t tell");
});

test("releases, cancellations, inserts and unchanged rows send nothing", () => {
  assert.equal(checkUpdateMessage({ ...check, status: "claimed" }, check), null);
  assert.equal(checkUpdateMessage(check, { ...check, status: "cancelled" }), null);
  assert.equal(checkUpdateMessage(null, check), null);
  assert.equal(checkUpdateMessage(check, { ...check }), null);
});
