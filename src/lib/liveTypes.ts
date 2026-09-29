export type LiveQuestionKind = "open_now" | "queue" | "availability";
export type LiveStatus = "open" | "claimed" | "answered" | "cancelled";
export type LiveReportReason = "unsafe" | "spam" | "inaccurate";

export const LIVE_QUESTIONS: Record<LiveQuestionKind, string> = {
  open_now: "Is this place open right now?",
  queue: "About how many minutes is the wait?",
  availability: "Is there room available right now?",
};

export type LiveRequest = {
  id: string;
  requester_id: string;
  observer_id: string | null;
  place_name: string;
  latitude: number;
  longitude: number;
  landmark: string;
  question_kind: LiveQuestionKind;
  status: LiveStatus;
  created_at: string;
  expires_at: string;
  answered_at: string | null;
  answer: string | null;
  note: string | null;
};

export type NewLiveRequest = {
  placeName: string;
  latitude: number;
  longitude: number;
  landmark: string;
  questionKind: LiveQuestionKind;
  deadlineMinutes: number;
};

export const liveExpired = (request: LiveRequest, now = Date.now()) =>
  now >= Date.parse(request.expires_at);

export function liveAnswerLabel(request: LiveRequest) {
  if (request.answer === null) return "No observation yet";
  if (request.answer === "unsure") return "Couldn’t tell";
  if (request.question_kind === "queue") return `About ${request.answer} minutes`;
  return request.answer === "yes" ? "Yes" : "No";
}
