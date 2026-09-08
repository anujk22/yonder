import { Platform } from "react-native";
import Constants from "expo-constants";
import { Place } from "./places";
function apiOrigin() {
  const devHost = __DEV__ ? Constants.expoConfig?.hostUri : undefined;
  const base =
    process.env.EXPO_PUBLIC_API_URL ||
    (Platform.OS === "web" ? "" : devHost ? `http://${devHost}` : null);
  if (base === null)
    throw new Error("Place search is not connected in this build.");
  return base.replace(/\/$/, "");
}
async function fetchPlaces(path: string, timeout: number): Promise<Place[]> {
  const response = await fetch(`${apiOrigin()}${path}`, {
    signal: AbortSignal.timeout(timeout),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Search is unavailable. Please try again.");
  return data.places;
}
export function searchWorldPlaces(input: string) {
  return fetchPlaces(
    `/api/places?q=${encodeURIComponent(input.trim())}`,
    12000,
  );
}
export function searchNearbyPlaces(latitude: number, longitude: number) {
  return fetchPlaces(
    `/api/nearby?lat=${latitude.toFixed(3)}&lng=${longitude.toFixed(3)}`,
    23000,
  );
}
