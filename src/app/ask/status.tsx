import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { StatusTimeline } from '@/components/StatusTimeline';
import { AppScreen, Entrance, ScreenHeader } from '@/components/ui';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

const STATUS_ITEMS = [
  { time: '0.0s', label: 'Finding eyes nearby' },
  { time: '1.4s', label: '12 observers in range', detail: '3 already at the location' },
  { time: '2.6s', label: 'Notifying 3 observers' },
  { time: '4.0s', label: 'Observer accepted', detail: 'already on site' },
  { time: '5.4s', label: 'Observer at the location', detail: '21m from target' },
] as const;

export default function StatusScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const query = useYonderStore((state) => state.queries.find((item) => item.id === state.activeQueryId));
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timers = TIMING.statusSteps.slice(1).map((delay, offset) =>
      setTimeout(() => {
        setActiveIndex(offset + 1);
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (query?.state === 'ANSWERED' && query.answerId) router.replace(`/ask/answer/${query.answerId}`);
  }, [query?.answerId, query?.state, router]);

  if (!query) return null;

  const waiting = activeIndex === STATUS_ITEMS.length - 1;

  return (
    <AppScreen scroll={false} style={styles.screen}>
      <ScreenHeader eyebrow="QUERY LIVE" title="Finding ground truth" />
      <Entrance style={styles.questionBlock}>
        <Text style={[type.heading, { color: theme.ink }]}>{query.question}</Text>
      </Entrance>

      <Entrance index={1} style={styles.timeline}>
        <StatusTimeline items={[...STATUS_ITEMS]} activeIndex={activeIndex} waiting={waiting} />
      </Entrance>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[type.mono, styles.footerText, { color: theme.inkSoft }]}>You'll only be charged if we get a verified answer.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 102 },
  questionBlock: { marginBottom: space.xl },
  timeline: { flex: 1 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md, marginTop: space.md },
  footerText: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
