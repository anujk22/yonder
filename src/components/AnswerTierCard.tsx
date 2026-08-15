import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FreshnessLabel } from '@/components/FreshnessLabel';
import { TickingNumber } from '@/components/TickingNumber';
import { formatAge, freshness, freshnessColor } from '@/lib/freshness';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

export type AnswerTierKind = 'last' | 'recent' | 'dispatch';

type AnswerTierCardProps = {
  kind: AnswerTierKind;
  headline: string;
  priceCents: number;
  onPress: () => void;
  index?: number;
  observedAt?: number;
  ttlSeconds?: number;
  subtitle?: string;
  observersNearby?: number;
};

const EYEBROWS: Record<AnswerTierKind, string> = {
  last: 'LAST KNOWN',
  recent: 'SOMEONE CHECKED RECENTLY',
  dispatch: 'SEND SOMEONE NOW',
};

export function AnswerTierCard({
  kind,
  headline,
  priceCents,
  onPress,
  index = 0,
  observedAt,
  ttlSeconds,
  subtitle,
  observersNearby,
}: AnswerTierCardProps) {
  const theme = useActiveTheme();
  const mode = useYonderStore((state) => state.mode);
  const isDispatch = kind === 'dispatch';
  const foreground = kind === 'last' ? theme.inkSoft : theme.ink;

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).springify().damping(18).stiffness(140)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${EYEBROWS[kind]}, ${priceCents === 0 ? 'free' : `$${(priceCents / 100).toFixed(2)}`}, ${headline}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: isDispatch ? theme.accent : theme.border,
            opacity: kind === 'last' ? 0.72 : pressed ? 0.86 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          isDispatch && styles.dispatchCard,
          mode === 'ask' && styles.askShadow,
          mode === 'ask' && { shadowColor: theme.shadow },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[type.micro, { color: isDispatch ? theme.accent : theme.inkSoft }]}>{EYEBROWS[kind]}</Text>
          {priceCents === 0 ? (
            <Text style={[type.mono, styles.price, { color: foreground }]}>FREE</Text>
          ) : (
            <TickingNumber
              value={priceCents}
              duration={620}
              color={isDispatch ? theme.accent : foreground}
              formatter={(value) => `$${(Math.round(value) / 100).toFixed(2)}`}
              style={styles.price}
            />
          )}
        </View>

        <Text style={[type.heading, styles.headline, { color: foreground }]}>{headline}</Text>

        {observedAt !== undefined && ttlSeconds !== undefined ? (
          kind === 'recent' ? (
            <RecentFreshness observedAt={observedAt} ttlSeconds={ttlSeconds} />
          ) : (
            <FreshnessLabel observedAt={observedAt} ttlSeconds={ttlSeconds} style={styles.meta} />
          )
        ) : subtitle ? (
          <Text style={[type.mono, styles.meta, { color: theme.inkSoft }]}>{subtitle}</Text>
        ) : null}

        {isDispatch && observersNearby !== undefined ? (
          <Text style={[type.mono, styles.reason, { color: theme.inkSoft }]}>{observersNearby} observers within 5 minutes</Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function RecentFreshness({ observedAt, ttlSeconds }: { observedAt: number; ttlSeconds: number }) {
  const theme = useActiveTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const value = freshness(observedAt, ttlSeconds, now);
  const remainingSeconds = Math.max(0, ttlSeconds - value.ageSeconds);
  const expiry = remainingSeconds < 60 ? `${remainingSeconds}s` : `${Math.max(1, Math.floor(remainingSeconds / 60))}m`;

  return (
    <Text style={[type.mono, styles.meta, { color: freshnessColor(value.band, theme) }]}>Verified {formatAge(value.ageSeconds)} · expires in {expiry}</Text>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 148,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: space.lg,
  },
  dispatchCard: { borderWidth: 2 },
  askShadow: {
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  price: { width: 92, textAlign: 'right', fontSize: 16, lineHeight: 21 },
  headline: { marginTop: space.md },
  meta: { marginTop: space.xs, fontSize: 12, lineHeight: 17 },
  reason: { marginTop: space.sm, fontSize: 12, lineHeight: 17 },
});
