import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusTimeline } from '@/components/StatusTimeline';
import { MissingDataState } from '@/components/ui';
import { YMark } from '@/components/YMark';
import { registerAutopilotAbortHandler } from '@/lib/autopilot';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

const STATUS_ITEMS = [
  { label: 'Finding eyes nearby' },
  { label: '12 observers in range, 3 already there' },
  { label: 'Notifying 3 observers' },
  { label: 'Observer at the location' },
] as const;

export default function StatusScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const query = useYonderStore((state) => state.queries.find((item) => item.id === state.activeQueryId));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timers = TIMING.statusSteps.slice(1, STATUS_ITEMS.length).map((delay, offset) =>
      setTimeout(() => setActiveIndex(offset + 1), delay),
    );
    const unregisterAbort = registerAutopilotAbortHandler(() => timers.forEach(clearTimeout));
    return () => {
      timers.forEach(clearTimeout);
      unregisterAbort();
    };
  }, []);

  useEffect(() => {
    if (query?.state === 'ANSWERED' && query.answerId) router.replace(`/ask/answer/${query.answerId}`);
  }, [query?.answerId, query?.state, router]);

  if (!query) return <MissingDataState title="No active query is available." />;

  return (
    <View style={[styles.screen, { backgroundColor: theme.accent }]}>
      <SafeAreaView style={[styles.panel, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
        <Animated.Text
          entering={FadeInDown.springify().damping(18).stiffness(140)}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={[type.serifTitle, styles.activeHeadline, { color: theme.ink }]}
        >
          Finding eyes nearby
        </Animated.Text>

        <View style={styles.signal}>
          <View style={[styles.signalRing, styles.signalRingOuter, { borderColor: theme.border }]} />
          <View style={[styles.signalRing, styles.signalRingMiddle, { borderColor: theme.border }]} />
          <View style={[styles.signalRing, styles.signalRingInner, { borderColor: theme.border }]} />
          <YMark size={118} bodyColor={theme.ink} headColor={theme.ink} headPulse />
        </View>

        <View style={styles.timeline}>
          <StatusTimeline items={[...STATUS_ITEMS]} activeIndex={activeIndex} waiting={activeIndex === STATUS_ITEMS.length - 1} />
        </View>

        <Text style={[type.body, styles.footer, { color: theme.ink }]}>You'll only be charged if we get a verified answer.</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  panel: { flex: 1, marginBottom: 56, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingHorizontal: 34, paddingBottom: 52, overflow: 'hidden' },
  activeHeadline: { fontSize: 42, lineHeight: 54, marginTop: 28, paddingBottom: 4, letterSpacing: -0.6 },
  signal: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  signalRing: { position: 'absolute', borderWidth: 1, opacity: 0.36 },
  signalRingOuter: { width: 236, height: 236, borderRadius: 118 },
  signalRingMiddle: { width: 188, height: 188, borderRadius: 94 },
  signalRingInner: { width: 144, height: 144, borderRadius: 72 },
  timeline: { minHeight: 204 },
  footer: { paddingVertical: space.lg, textAlign: 'center', fontSize: 10, lineHeight: 16 },
});
