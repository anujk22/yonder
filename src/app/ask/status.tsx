import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StatusTimeline } from '@/components/StatusTimeline';
import { AppScreen, MissingDataState, ScreenHeader } from '@/components/ui';
import { YMark } from '@/components/YMark';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

const STATUS_ITEMS = [
  { label: 'Finding eyes nearby' },
  { label: '12 observers in range', detail: '3 already there' },
  { label: 'Notifying 3 observers' },
  { label: 'Observer accepted', detail: 'already on site' },
  { label: 'Observer at the location', detail: '21m from target' },
] as const;

const ACTIVE_HEADLINES = [
  'Finding eyes\nnearby',
  'Observers are\nwithin range',
  'Notifying nearby\nobservers',
  'Observer\naccepted',
  'Observer at\nthe location',
] as const;

export default function StatusScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const query = useYonderStore((state) => state.queries.find((item) => item.id === state.activeQueryId));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timers = TIMING.statusSteps.slice(1).map((delay, offset) =>
      setTimeout(() => setActiveIndex(offset + 1), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (query?.state === 'ANSWERED' && query.answerId) router.replace(`/ask/answer/${query.answerId}`);
  }, [query?.answerId, query?.state, router]);

  if (!query) return <MissingDataState title="No active query is available." />;

  return (
    <AppScreen scroll={false} style={styles.screen}>
      <ScreenHeader eyebrow="QUERY LIVE" />

      <View style={styles.hero}>
        <YMark size={72} bodyColor={theme.accent} headColor={theme.accent} headPulse />
        <Animated.Text
          key={activeIndex}
          entering={FadeInDown.springify().damping(18).stiffness(140)}
          style={[type.serifTitle, styles.activeHeadline, { color: theme.ink }]}
        >
          {ACTIVE_HEADLINES[activeIndex]}
        </Animated.Text>
      </View>

      <View style={styles.timeline}>
        <StatusTimeline items={[...STATUS_ITEMS]} activeIndex={activeIndex} waiting={activeIndex === STATUS_ITEMS.length - 1} />
      </View>

      <View style={[styles.queryBand, { backgroundColor: theme.accent }]}>
        <Text style={[type.micro, { color: theme.onAccent }]}>QUERY IN PROGRESS</Text>
        <Text style={[type.label, styles.queryText, { color: theme.onAccent }]} numberOfLines={2}>{query.question}</Text>
      </View>
      <Text style={[type.label, styles.footer, { color: theme.inkSoft }]}>You'll only be charged if we get a verified answer.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 112 },
  hero: { alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  activeHeadline: { minHeight: 78, textAlign: 'center', fontSize: 35, lineHeight: 37 },
  timeline: { flex: 1, paddingHorizontal: space.lg },
  queryBand: { marginHorizontal: -space.lg, paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.xxs },
  queryText: { opacity: 0.9 },
  footer: { paddingTop: space.sm, textAlign: 'center', fontSize: 11, lineHeight: 16 },
});
