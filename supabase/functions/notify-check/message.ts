// Pure message builder for the check-update push, shared with the Node unit tests.
type Check = {
  id: string;
  requester_id: string;
  place_name: string;
  question_kind: string;
  status: string;
  answer: string | null;
};

function answerText(check: Check) {
  if (check.answer === "unsure") return "They couldn’t tell";
  if (check.question_kind === "queue") return `About ${check.answer} min wait`;
  return check.answer === "yes" ? "Yes" : "No";
}

/** The push for a status change the asker cares about, or null for anything else. */
export function checkUpdateMessage(before: Check | null, after: Check) {
  if (!before || before.status === after.status) return null;
  const base = { userId: after.requester_id, data: { check_id: after.id } };
  if (after.status === "claimed" && before.status === "open")
    return { ...base, heading: "Someone’s checking", body: `A Scout is on the way to look at ${after.place_name}.` };
  if (after.status === "answered")
    return { ...base, heading: `${after.place_name}: ${answerText(after)}`, body: "Your check was answered. Tap to see how fresh it is." };
  return null;
}
