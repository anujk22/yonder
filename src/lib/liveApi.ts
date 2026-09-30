import { getLiveClient } from "./liveClient";
import { liveErrorMessage, validateLiveRequest } from "./livePolicy";
import type { LiveReportReason, LiveRequest, NewLiveRequest } from "./liveTypes";

const fields = "id,requester_id,observer_id,place_name,latitude,longitude,landmark,question_kind,status,created_at,expires_at,answered_at,answer,note";
const validId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function getPilotAccess() {
  const { data, error } = await getLiveClient().from("pilot_members").select("active").maybeSingle();
  if (error) throw new Error(liveErrorMessage(error));
  return data?.active === true;
}

export async function listLiveRequests(): Promise<LiveRequest[]> {
  const { data, error } = await getLiveClient().from("pilot_requests").select(fields).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(liveErrorMessage(error));
  return data as LiveRequest[];
}

export async function getLiveRequest(id: string): Promise<LiveRequest | null> {
  if (!validId(id)) return null;
  const { data, error } = await getLiveClient().from("pilot_requests").select(fields).eq("id", id).maybeSingle();
  if (error) throw new Error(liveErrorMessage(error));
  return data as LiveRequest | null;
}

export async function createLiveRequest(input: NewLiveRequest, plus = false): Promise<string> {
  validateLiveRequest(input, plus);
  const { data, error } = await getLiveClient().rpc("pilot_create_request", {
    p_place_name: input.placeName.trim(), p_latitude: input.latitude, p_longitude: input.longitude,
    p_landmark: input.landmark.trim(), p_question_kind: input.questionKind, p_deadline_minutes: input.deadlineMinutes,
  });
  if (error) throw new Error(liveErrorMessage(error));
  return data as string;
}

async function requestAction(name: string, id: string, extra: Record<string, string> = {}) {
  if (!validId(id)) throw new Error("This request link is invalid.");
  const { error } = await getLiveClient().rpc(name, { p_request_id: id, ...extra });
  if (error) throw new Error(liveErrorMessage(error));
}

export const claimLiveRequest = (id: string) => requestAction("pilot_claim_request", id);
export const releaseLiveRequest = (id: string) => requestAction("pilot_release_request", id);
export const cancelLiveRequest = (id: string) => requestAction("pilot_cancel_request", id);
export const answerLiveRequest = (id: string, answer: string, note: string) => {
  if (note.trim().length > 280) return Promise.reject(new Error("Keep the observation note under 280 characters."));
  return requestAction("pilot_answer_request", id, { p_answer: answer.trim(), p_note: note.trim() });
};
export const reportLiveRequest = (id: string, reason: LiveReportReason) => requestAction("pilot_report_request", id, { p_reason: reason });
export async function blockLiveUser(userId: string) {
  if (!validId(userId)) throw new Error("This participant is unavailable.");
  const { error } = await getLiveClient().rpc("pilot_block_user", { p_user_id: userId });
  if (error) throw new Error(liveErrorMessage(error));
}
