import type { Place, QueryType } from "./places";
import { isUnsafeQuestion } from "./safety";

export const SPOT_KINDS = [
  { kind: "park", label: "Park", object: "outside" },
  { kind: "court", label: "Courts", object: "basketball" },
  { kind: "pizza", label: "Food", object: "food" },
  { kind: "coffee", label: "Coffee", object: "coffee" },
  { kind: "grocery", label: "Grocery", object: "grocery" },
  { kind: "shop", label: "Shop", object: "shopping" },
  { kind: "transit", label: "Transit", object: "transit" },
  { kind: "map", label: "Other", object: "map" },
] as const;
export type SpotKind = (typeof SPOT_KINDS)[number]["kind"];
export type SpotDraft = {
  name: string;
  description: string;
  kind: SpotKind;
  coordinate: { latitude: number; longitude: number } | null;
  publicAccess: boolean;
};
export function validateSpot(draft: SpotDraft): string | null {
  const point = draft.coordinate;
  if (
    !point ||
    !Number.isFinite(point.latitude) ||
    !Number.isFinite(point.longitude) ||
    Math.abs(point.latitude) > 85 ||
    Math.abs(point.longitude) > 180
  )
    return "Tap the map to choose an exact spot.";
  if (draft.name.trim().length < 3 || draft.name.trim().length > 60)
    return "Give the spot a name between 3 and 60 characters.";
  if (
    draft.description.trim().length < 20 ||
    draft.description.trim().length > 300
  )
    return "Add 20–300 characters describing landmarks and how to find the spot.";
  if (!SPOT_KINDS.some((item) => item.kind === draft.kind))
    return "Choose a kind of spot.";
  if (isUnsafeQuestion(`${draft.name} ${draft.description}`))
    return "Describe a public place, without targeting a private person.";
  if (!draft.publicAccess) return "Confirm this spot is open to the public.";
  return null;
}
export function createCommunitySpot(
  draft: SpotDraft,
  id: string,
  now = Date.now(),
): Place {
  const error = validateSpot(draft);
  if (error) throw new Error(error);
  const categories: QueryType[] =
    draft.kind === "transit"
      ? ["accessibility", "condition"]
      : ["shop", "grocery"].includes(draft.kind)
        ? ["stock_check", "open_closed"]
        : ["park", "court"].includes(draft.kind)
          ? ["availability", "crowd", "condition"]
          : ["queue", "open_closed"];
  return {
    id: `community-${id}`,
    name: draft.name.trim(),
    area: "Community pin",
    lat: draft.coordinate!.latitude,
    lng: draft.coordinate!.longitude,
    status: "public",
    geofenceM: 50,
    categories,
    communitySpot: {
      description: draft.description.trim(),
      kind: draft.kind,
      verification: "unverified",
      publicAccessConfirmedAt: now,
    },
  };
}
