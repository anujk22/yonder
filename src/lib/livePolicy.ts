import type { LiveQuestionKind, NewLiveRequest } from "./liveTypes";
import { isUnsafeQuestion } from "./safety";

export function validLiveConfiguration(url: string | undefined, key: string | undefined) {
  if (!url || !key?.startsWith("sb_publishable_")) return false;
  try {
    const parsed = new URL(url);
    return !parsed.username && !parsed.password &&
      (parsed.protocol === "https:" || (parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)));
  } catch { return false; }
}

export function validateLiveRequest(input: NewLiveRequest) {
  if (input.placeName.trim().length < 2 || input.placeName.trim().length > 120)
    throw new Error("Choose a place with a name between 2 and 120 characters.");
  if (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90 || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180)
    throw new Error("Choose a valid point on the map.");
  if (input.landmark.trim().length > 180) throw new Error("Keep the landmark description under 180 characters.");
  if (isUnsafeQuestion(`${input.placeName} ${input.landmark}`))
    throw new Error("Checks are for public places, never private people or security arrangements.");
  if (!["open_now", "queue", "availability"].includes(input.questionKind)) throw new Error("Choose one of the available questions.");
  if (![5, 10, 15, 30].includes(input.deadlineMinutes)) throw new Error("Choose a deadline of 5, 10, 15 or 30 minutes.");
}

export function validLiveAnswer(kind: LiveQuestionKind, answer: string) {
  return answer === "unsure" || (kind === "queue"
    ? /^(0|[1-9]\d{0,2})$/.test(answer) && Number(answer) <= 240
    : answer === "yes" || answer === "no");
}

export function liveErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message :
    typeof error === "object" && error !== null && "message" in error ? String(error.message) : "";
  if (code === "42501" || /pilot access|pilot membership|not a pilot member|not authorized|not permitted/i.test(message))
    return "This action is unavailable for your account. Check your pilot invitation or refresh the request.";
  if (/expired/i.test(message)) return "This check has expired. Refresh to see its current status.";
  if (/limit|too many/i.test(message)) return "You have reached the limit for active checks. Finish or cancel one before continuing.";
  if (/claimed|no longer|not open|not available|already|unavailable|not found|invalid state|cannot answer/i.test(message))
    return "This check has changed or is no longer available. Refresh before trying again.";
  if (/fetch|network|timeout|connection/i.test(message)) return "Couldn’t reach Yonder. Check your connection and try again.";
  return "Couldn’t complete this action. Refresh and try again; if it continues, contact support.";
}
