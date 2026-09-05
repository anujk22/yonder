import { Platform } from 'react-native';
import { Place } from './places';
export async function searchWorldPlaces(input: string): Promise<Place[]> {
  const base = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? '' : 'http://localhost:8081');
  const response = await fetch(`${base}/api/places?q=${encodeURIComponent(input.trim())}`, { signal: AbortSignal.timeout(12000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Search is unavailable. Please try again.');
  return data.places;
}
