import { distanceMeters } from "./geo";

export type LiveQuestionKind = "open_now" | "queue" | "availability" | "accessibility";
export type LiveStatus = "open" | "claimed" | "answered" | "cancelled";
export type LiveReportReason = "unsafe" | "spam" | "inaccurate";

export const LIVE_QUESTIONS: Record<LiveQuestionKind, string> = {
  open_now: "Is this place open right now?",
  queue: "About how many minutes is the wait?",
  availability: "Is there room available right now?",
  accessibility: "Is the step-free entrance or elevator working?",
};

export const LIVE_QUESTION_KINDS = Object.keys(LIVE_QUESTIONS) as LiveQuestionKind[];

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

/** "just now", "4 min ago", "2 hr ago", or a short date for anything older than a day. */
export function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} hr ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Remaining time before a check closes, rounded up to the minute. */
export function timeLeft(request: LiveRequest, now = Date.now()) {
  const minutes = Math.ceil((Date.parse(request.expires_at) - now) / 60_000);
  return minutes <= 0 ? "Closed" : `${minutes} min left`;
}

export function distanceLabel(meters: number) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m away`;
  const miles = meters / 1609.34;
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi away`;
}

/** Nearest first when a position is known; otherwise newest first, as the server returns them. */
export function sortByDistance(requests: LiveRequest[], from: { latitude: number; longitude: number } | null) {
  if (!from) return requests;
  return [...requests].sort((a, b) => distanceMeters(from, a) - distanceMeters(from, b));
}
