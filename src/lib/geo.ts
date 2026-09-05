export type LocationFix = { latitude: number; longitude: number; accuracy: number; timestamp: number; mocked?: boolean };
export function distanceMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const radians = (value: number) => value * Math.PI / 180;
  const lat = radians(b.latitude-a.latitude); const lng = radians(b.longitude-a.longitude);
  const h = Math.sin(lat/2)**2 + Math.cos(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.sin(lng/2)**2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1-h)));
}
export function validateLocation(fix: LocationFix | null, target: { latitude: number; longitude: number }, radius: number, now = Date.now()) {
  if (!fix) return { valid: false, distance: null, reason: 'Share your location to check your distance.' };
  if (![fix.latitude, fix.longitude, fix.accuracy, fix.timestamp, target.latitude, target.longitude, radius].every(Number.isFinite) || Math.abs(fix.latitude) > 90 || Math.abs(fix.longitude) > 180 || fix.accuracy < 0 || radius <= 0) return { valid: false, distance: null, reason: 'A valid location reading is required.' };
  const distance = distanceMeters(fix, target);
  if (fix.mocked) return { valid: false, distance, reason: 'Mock location detected. Use a real device location.' };
  if (now-fix.timestamp > 30000 || fix.timestamp-now > 5000) return { valid: false, distance, reason: 'Location is out of date. Get a new reading.' };
  if (fix.accuracy > Math.min(radius/2, 50)) return { valid: false, distance, reason: 'Location accuracy is too low. Try outdoors.' };
  if (distance + fix.accuracy > radius) return { valid: false, distance, reason: `Move within ${radius} m of the place. Your accuracy circle must fit inside.` };
  return { valid: true, distance, reason: `Within the check area · accuracy ±${Math.round(fix.accuracy)} m` };
}
