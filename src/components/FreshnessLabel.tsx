import { useEffect, useMemo, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

import { formatAge, freshness, freshnessColor } from '@/lib/freshness';
import { useActiveTheme } from '@/lib/store';
import { type } from '@/lib/theme';

export function FreshnessLabel({ observedAt, ttlSeconds, prefix = 'Verified ', style }: { observedAt: number; ttlSeconds: number; prefix?: string; style?: StyleProp<TextStyle> }) {
  const theme = useActiveTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo(() => freshness(observedAt, ttlSeconds, now), [now, observedAt, ttlSeconds]);
  return <Text style={[type.mono, { color: freshnessColor(value.band, theme) }, style]}>{prefix}{formatAge(value.ageSeconds)}</Text>;
}
