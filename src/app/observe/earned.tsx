import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppScreen, Entrance, MissingDataState, PrimaryButton, SectionLabel } from '@/components/ui';
import { TickingNumber } from '@/components/TickingNumber';
import { YMark } from '@/components/YMark';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

export default function EarnedScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const query = useYonderStore((state) => state.queries.find((item) => item.id === state.activeTaskId));

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!query) return <MissingDataState title="No completed observation is available." />;
  const reward = query.observerRewardCents;

  return (
    <Animated.View
      entering={FadeIn.duration(240).withInitialValues({ opacity: 0, transform: [{ scale: 0.98 }] } as never)}
      style={styles.flex}
    >
      <AppScreen scroll={false} bottomInset={false}>
        <View style={styles.center}>
          <Entrance style={[styles.mark, { backgroundColor: theme.surface, borderColor: theme.fresh }]}>
            <YMark size={62} bodyColor={theme.accent} />
          </Entrance>

          <Animated.View entering={FadeInDown.delay(90).springify().damping(14).stiffness(170)} style={styles.rewardWrap}>
            <SectionLabel color={theme.fresh}>OBSERVATION ACCEPTED</SectionLabel>
            <TickingNumber
              value={reward}
              duration={760}
              color={theme.fresh}
              formatter={(value) => `+$${(Math.round(value) / 100).toFixed(2)}`}
              style={styles.reward}
            />
          </Animated.View>

          <Entrance index={3} style={styles.copy}>
            <Text style={[type.title, styles.title, { color: theme.ink }]}>You answered once and got paid instantly.</Text>
            <Text style={[type.body, styles.detail, { color: theme.inkSoft }]}>Your capture is being deleted. Only the answer is kept.</Text>
          </Entrance>

          <Entrance index={4} style={[styles.receipt, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.receiptRow}>
              <Text style={[type.mono, { color: theme.inkSoft }]}>EVIDENCE</Text>
              <Text style={[type.mono, { color: theme.ink }]}>3 live frames</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={[type.mono, { color: theme.inkSoft }]}>LOCATION</Text>
              <Text style={[type.mono, { color: theme.fresh }]}>VERIFIED</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={[type.mono, { color: theme.inkSoft }]}>PAYOUT</Text>
              <Text style={[type.mono, { color: theme.ink }]}>{`$${(reward / 100).toFixed(2)} instant`}</Text>
            </View>
            <Text style={[type.mono, styles.shopifyCopy, { color: theme.inkSoft }]}>Payments processed by Shopify</Text>
          </Entrance>

          <Entrance index={5} style={styles.actions}>
            <PrimaryButton label="Back to tasks" onPress={() => router.replace('/observe')} />
          </Entrance>
        </View>
      </AppScreen>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: space.xl },
  mark: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rewardWrap: { marginTop: space.xl, alignItems: 'center' },
  reward: { width: 240, textAlign: 'center', fontSize: 46, lineHeight: 54, marginTop: space.xs },
  copy: { alignItems: 'center', marginTop: space.lg },
  title: { maxWidth: 330, textAlign: 'center' },
  detail: { maxWidth: 320, marginTop: space.md, textAlign: 'center' },
  receipt: { width: '100%', borderWidth: 1, borderRadius: radii.card, padding: space.md, marginTop: space.xl, gap: space.sm },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  shopifyCopy: { textAlign: 'center', fontSize: 10, lineHeight: 15, marginTop: space.xs },
  actions: { width: '100%', marginTop: space.lg },
});
