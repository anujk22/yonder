// Server-only proxy: no autocomplete, cache identical queries, one upstream request
// at a time, and enforce Nominatim's application-wide 1 request/second limit.
type CacheEntry = { at: number; places: unknown[] };
const cache = new Map<string, CacheEntry>();
let busy = false;
let lastRequest = 0;
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (q.length < 3 || q.length > 160) return Response.json({ error: 'Enter a place and city, between 3 and 160 characters.' }, { status: 400 });
  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now()-cached.at < 86400000) return Response.json({ places: cached.places });
  if (busy || Date.now()-lastRequest < 1100) return Response.json({ error: 'Search is busy. Please try again in a moment.' }, { status: 429, headers: { 'Retry-After': '2' } });
  busy = true; lastRequest = Date.now();
  try {
    const url = new URL(process.env.GEOCODER_URL || 'https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({ q, format: 'jsonv2', limit: '6', addressdetails: '1' }).toString();
    const response = await fetch(url, { headers: { 'User-Agent': 'YonderPrototype/2.0 (+https://github.com/anujk22/yonder)', 'Accept': 'application/json' }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error('Geocoder unavailable');
    const rows = await response.json() as { osm_type: string; osm_id: number; name?: string; display_name: string; lat: string; lon: string; type: string }[];
    const places = rows.filter(r => Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lon))).map(row => ({ id: `osm-${row.osm_type}-${row.osm_id}`, name: row.name || row.display_name.split(',')[0], area: row.display_name, lat: Number(row.lat), lng: Number(row.lon), status: 'public', geofenceM: 75, categories: ['restaurant','cafe','fast_food'].includes(row.type) ? ['queue','open_closed'] : ['park','pitch','leisure'].includes(row.type) ? ['crowd','condition'] : ['crowd'] }));
    if (cache.size >= 500) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), places });
    return Response.json({ places }, { headers: { 'Cache-Control': 'private, max-age=86400' } });
  } catch { return Response.json({ error: 'World search is temporarily unavailable. Try again, or explore the places below.' }, { status: 503 }); }
  finally { busy = false; }
}
