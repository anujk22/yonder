import { placesFromOSM, OSMElement } from "../../lib/nearby";
const cache = new Map<
  string,
  { at: number; places: ReturnType<typeof placesFromOSM> }
>();
let busy = false;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (
    !params.get("lat") ||
    !params.get("lng") ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    return Response.json(
      { error: "A valid map location is required." },
      { status: 400 },
    );
  // Coarse coordinates are sufficient for discovery; precise GPS stays in the capture flow.
  const latitude = Number(lat.toFixed(3));
  const longitude = Number(lng.toFixed(3));
  const key = `${latitude},${longitude}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < 3600000)
    return Response.json({ places: hit.places });
  if (busy)
    return Response.json(
      { error: "Nearby search is busy. Please try again in a moment." },
      { status: 429 },
    );
  busy = true;
  try {
    const around = `(around:2500,${latitude},${longitude})`;
    const query = `[out:json][timeout:15];(nwr[amenity~"^(cafe|restaurant|fast_food|bar)$"][name]${around};nwr[leisure~"^(park|pitch|sports_centre)$"][name]${around};nwr[shop][name]${around};);out center 150;`;
    const response = await fetch(
      `${process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter"}?data=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "Yonder/2.0 (+https://github.com/anujk22/yonder)",
        },
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!response.ok) throw new Error("Nearby unavailable");
    const data = (await response.json()) as {
      elements?: OSMElement[];
      remark?: string;
    };
    if (!Array.isArray(data.elements) || data.remark)
      throw new Error("Incomplete nearby response");
    const places = placesFromOSM(data.elements, latitude, longitude);
    if (cache.size >= 250) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), places });
    return Response.json(
      { places },
      { headers: { "Cache-Control": "private, max-age=3600" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Nearby places could not be loaded. Search a place and city, or try this area again.",
      },
      { status: 503 },
    );
  } finally {
    busy = false;
  }
}
