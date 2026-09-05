import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { LocationFix } from './geo';
export function useLiveLocation() {
  const [fix, setFix] = useState<LocationFix | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const generation = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = useCallback(() => { generation.current++; subscription.current?.remove(); subscription.current = null; if (timeout.current) clearTimeout(timeout.current); setActive(false); setLoading(false); setFix(null); }, []);
  useEffect(() => () => { generation.current++; subscription.current?.remove(); if (timeout.current) clearTimeout(timeout.current); }, []);
  useFocusEffect(useCallback(() => () => stop(), [stop]));
  const start = useCallback(async () => {
    stop(); const current = generation.current; setLoading(true); setError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (generation.current !== current) return;
      if (!permission.granted) { setError('Location access is off. You can still search for any place. Enable location in your browser or device settings to try again.'); setLoading(false); return; }
      setActive(true);
      timeout.current = setTimeout(() => { if (generation.current === current) { stop(); setError('Your location could not be found. Try again near a window or outdoors.'); } }, 20000);
      const watch = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 }, value => {
        if (generation.current !== current) return;
        if (timeout.current) clearTimeout(timeout.current);
        setFix({ latitude: value.coords.latitude, longitude: value.coords.longitude, accuracy: value.coords.accuracy ?? Infinity, timestamp: value.timestamp, mocked: value.mocked }); setLoading(false); setError('');
      }, message => { if (generation.current === current) { stop(); setError(`Location unavailable. ${message}`); } });
      if (generation.current !== current) watch.remove(); else subscription.current = watch;
    } catch { if (generation.current === current) { stop(); setError('Location is unavailable. Check your device permissions and try again.'); } }
  }, [stop]);
  return { fix, error, loading, active, start, stop };
}
