import { kindFromTags } from "@/lib/placeKinds";
// Server-only proxy: no autocomplete, cache identical queries, one upstream request
// at a time, and enforce Nominatim's application-wide 1 request/second limit.
type CacheEntry = { at: number; places: unknown[] };
const cache = new Map<string, CacheEntry>();
let busy = false;
let lastRequest = 0;
/** "lat,lng" rounded by the client → a ~1° Nominatim viewbox that ranks nearby places first. */
export function viewboxFor(near: string | null) {
  const match = near?.match(/^(-?\d{1,2}(?:\.\d{1,2})?),(-?\d{1,3}(?:\.\d{1,2})?)$/);
  if (!match) return null;
  const [lat, lng] = [Number(match[1]), Number(match[2])];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return `${(lng - 0.5).toFixed(2)},${(lat + 0.5).toFixed(2)},${(lng + 0.5).toFixed(2)},${(lat - 0.5).toFixed(2)}`;
}
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim() || "";
  const viewbox = viewboxFor(params.get("near"));
  if (q.length < 3 || q.length > 160)
    return Response.json(
      { error: "Enter a place and city, between 3 and 160 characters." },
      { status: 400 },
    );
  const key = `${q.toLowerCase()}|${viewbox ?? ""}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < 86400000)
    return Response.json({ places: cached.places });
  if (busy || Date.now() - lastRequest < 1100)
    return Response.json(
      { error: "Search is busy. Please try again in a moment." },
      { status: 429, headers: { "Retry-After": "2" } },
    );
  busy = true;
  lastRequest = Date.now();
  try {
    const url = new URL(
      process.env.GEOCODER_URL || "https://nominatim.openstreetmap.org/search",
    );
    url.search = new URLSearchParams({
      q,
      format: "jsonv2",
      limit: "6",
      addressdetails: "1",
      countrycodes: "us",
      ...(viewbox ? { viewbox } : {}),
    }).toString();
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Yonder/1.0 (+https://yonder.expo.app/support)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) throw new Error("Geocoder unavailable");
    const rows = (await response.json()) as {
      osm_type: string;
      osm_id: number;
      name?: string;
      display_name: string;
      lat: string;
      lon: string;
      type: string;
      class?: string;
      category?: string;
    }[];
    const places = rows
      .filter(
        (r) => Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lon)),
      )
      .map((row) => ({
        id: `osm-${row.osm_type}-${row.osm_id}`,
        name: row.name || row.display_name.split(",")[0],
        kind: kindFromTags({
          [row.class || row.category || "amenity"]: row.type,
        }),
        area: row.display_name,
        lat: Number(row.lat),
        lng: Number(row.lon),
        status: "public",
        geofenceM: 75,
        categories: ["restaurant", "cafe", "fast_food"].includes(row.type)
          ? ["queue", "open_closed"]
          : ["park", "pitch", "leisure"].includes(row.type)
            ? ["crowd", "condition"]
            : ["crowd"],
      }));
    if (cache.size >= 500) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), places });
    return Response.json(
      { places },
      { headers: { "Cache-Control": "private, max-age=86400" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "World search is temporarily unavailable. Try again, or explore the places below.",
      },
      { status: 503 },
    );
  } finally {
    busy = false;
  }
}
