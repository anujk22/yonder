import type { PlaceKind } from "./places";

/** Prefer provider tags over a store-name guess, with a neutral fallback. */
export function kindFromTags(
  tags: Record<string, string | undefined>,
): PlaceKind {
  if (
    [
      "supermarket",
      "convenience",
      "greengrocer",
      "grocery",
      "health_food",
      "deli",
    ].includes(tags.shop ?? "")
  )
    return "grocery";
  if (tags.sport === "basketball" || tags.leisure === "pitch")
    return tags.sport === "basketball" ? "court" : "park";
  if (
    tags.railway ||
    tags.public_transport ||
    ["bus_station", "ferry_terminal"].includes(tags.amenity ?? "")
  )
    return "transit";
  if (tags.amenity === "cafe") return "coffee";
  if (
    [
      "restaurant",
      "fast_food",
      "food_court",
      "bar",
      "pub",
      "ice_cream",
    ].includes(tags.amenity ?? "")
  )
    return "pizza";
  if (tags.shop) return "shop";
  if (tags.leisure || tags.landuse === "recreation_ground") return "park";
  return "map";
}
