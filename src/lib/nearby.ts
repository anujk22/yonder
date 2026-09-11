import { kindFromTags } from "./placeKinds";
import { Place, QueryType } from "./places";
import { distanceMeters } from "./geo";
export type OSMElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};
export function placesFromOSM(
  elements: OSMElement[],
  latitude: number,
  longitude: number,
): Place[] {
  const seen = new Set<string>();
  return elements
    .flatMap((row): Place[] => {
      const tags = row.tags || {};
      const lat = row.lat ?? row.center?.lat;
      const lng = row.lon ?? row.center?.lon;
      if (
        !tags.name ||
        lat === undefined ||
        lng === undefined ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180 ||
        tags.access === "private"
      )
        return [];
      const key = `${tags.name.toLowerCase()}-${lat.toFixed(4)}-${lng.toFixed(4)}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const categories: QueryType[] = tags.shop
        ? ["stock_check", "queue"]
        : tags.leisure
          ? ["crowd", "condition"]
          : ["queue", "open_closed"];
      return [
        {
          id: `osm-${row.type}-${row.id}`,
          name: tags.name,
          kind: kindFromTags(tags),
          area:
            [tags["addr:street"], tags["addr:city"], tags["addr:state"]]
              .filter(Boolean)
              .join(", ") ||
            (tags.leisure
              ? "Outdoor place"
              : tags.shop
                ? "Local shop"
                : "Food & drink"),
          lat,
          lng,
          status: "public",
          geofenceM: 75,
          categories,
        },
      ];
    })
    .sort(
      (a, b) =>
        distanceMeters(
          { latitude, longitude },
          { latitude: a.lat, longitude: a.lng },
        ) -
        distanceMeters(
          { latitude, longitude },
          { latitude: b.lat, longitude: b.lng },
        ),
    )
    .slice(0, 30);
}
