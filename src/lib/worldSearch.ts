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
/** `near` biases results toward the visible map area without excluding anything else. */
export function searchWorldPlaces(input: string, near?: { latitude: number; longitude: number; latitudeDelta: number }) {
  const bias = near && near.latitudeDelta < 3 ? `&near=${near.latitude.toFixed(2)},${near.longitude.toFixed(2)}` : "";
  return fetchPlaces(
    `/api/places?q=${encodeURIComponent(input.trim())}${bias}`,
    12000,
  );
}
