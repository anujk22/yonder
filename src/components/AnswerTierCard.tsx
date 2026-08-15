import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FreshnessLabel } from '@/components/FreshnessLabel';
import { TickingNumber } from '@/components/TickingNumber';
import { useAutopilotPressTarget } from '@/lib/autopilot';
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
  testID?: string;
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
  testID,
}: AnswerTierCardProps) {
  const theme = useActiveTheme();
  const ref = useRef<View>(null);
  const mode = useYonderStore((state) => state.mode);
  const isDispatch = kind === 'dispatch';
  const foreground = theme.ink;
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  useAutopilotPressTarget(testID, ref, handlePress);

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).springify().damping(18).stiffness(140)}>
      <Pressable
        ref={ref}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${EYEBROWS[kind]}, ${priceCents === 0 ? 'free' : `$${(priceCents / 100).toFixed(2)}`}, ${headline}`}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          isDispatch && styles.dispatchCard,
          {
            backgroundColor: theme.surface,
            borderColor: isDispatch ? theme.accent : theme.border,
            opacity: pressed ? 0.86 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
          isDispatch && mode === 'ask' && styles.dispatchShadow,
          isDispatch && mode === 'ask' && { shadowColor: theme.shadow },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[type.mono, styles.eyebrow, { color: theme.inkSoft }]}>{EYEBROWS[kind]}</Text>
          {priceCents === 0 ? (
            <Text style={[type.mono, styles.price, { color: foreground }]}>FREE</Text>
          ) : (
            <TickingNumber
              value={priceCents}
              duration={620}
              color={foreground}
              formatter={(value) => `$${(Math.round(value) / 100).toFixed(2)}`}
              style={isDispatch ? styles.dispatchPrice : styles.price}
            />
          )}
        </View>

        <Text
          style={[isDispatch ? type.serifTitle : type.serifHeading, styles.headline, isDispatch && styles.dispatchHeadline, { color: foreground }]}
          numberOfLines={isDispatch ? 2 : 1}
          adjustsFontSizeToFit
          minimumFontScale={0.86}
        >
          {headline}
        </Text>

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
  card: { minHeight: 116, borderRadius: 14, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 17 },
  dispatchCard: { minHeight: 174, borderRadius: 16, borderWidth: 2, paddingHorizontal: 22, paddingVertical: 20 },
  dispatchShadow: { shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  eyebrow: { flex: 1, fontSize: 11, lineHeight: 15, letterSpacing: 0.8 },
  price: { width: 74, textAlign: 'right', fontSize: 14, lineHeight: 20 },
  dispatchPrice: { width: 106, textAlign: 'right', fontSize: 29, lineHeight: 34 },
  headline: { marginTop: space.sm },
  dispatchHeadline: { marginTop: space.md, fontSize: 31, lineHeight: 35 },
  meta: { marginTop: space.xs, fontSize: 11, lineHeight: 16 },
  reason: { marginTop: space.md, fontSize: 12, lineHeight: 17 },
});
