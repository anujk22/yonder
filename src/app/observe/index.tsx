import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Entrance, AppScreen, SectionLabel } from '@/components/ui';
import { Glyph } from '@/components/Glyph';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { money } from '@/lib/pricing';
import { radii, space, type } from '@/lib/theme';

const PROXIMITY_ORDER = ['pier2', 'joes', 'unionsq', 'nikesoho', 'wsp', 'tjs', 'bryant', 'applesq'];

const proximityLabel = (placeId: string) => {
  const labels: Record<string, string> = {
    pier2: "YOU'RE HERE",
    joes: '3 min away',
    unionsq: '5 min away',
    nikesoho: '6 min away',
    wsp: '4 min away',
    tjs: '5 min away',
    bryant: '8 min away',
    applesq: '5 min away',
  };
  return labels[placeId] ?? 'Nearby';
};

const durationLabel = (placeId: string) => (placeId === 'pier2' ? '~20 sec' : '~30 sec');

export default function ObserveHome() {
  const router = useRouter();
  const theme = useActiveTheme();
  const queries = useYonderStore((state) => state.queries);
  const places = useYonderStore((state) => state.places);
  const setActiveTask = useYonderStore((state) => state.setActiveTask);

  const observations = useMemo(
    () => {
      const liveQueries = queries.filter((query) => !['DRAFT', 'ANSWERED', 'REFUNDED', 'BLOCKED'].includes(query.state));
      return liveQueries
        .filter((query) => query.isNew || !liveQueries.some((candidate) => candidate.isNew && candidate.placeId === query.placeId && candidate.queryType === query.queryType))
        .sort((left, right) => {
          if (left.isNew !== right.isNew) return left.isNew ? -1 : 1;
          return PROXIMITY_ORDER.indexOf(left.placeId) - PROXIMITY_ORDER.indexOf(right.placeId);
        });
    },
    [queries],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(240).withInitialValues({ opacity: 0, transform: [{ scale: 0.98 }] } as never)}
      style={styles.flex}
    >
      <AppScreen>
        <Entrance style={styles.topline}>
          <View>
            <Text style={[type.micro, { color: theme.inkSoft }]}>OBSERVE NEARBY</Text>
            <Text style={[type.mono, styles.available, { color: theme.accent }]}>$4.15 available within 5 minutes</Text>
          </View>
          <View style={[styles.sensorBadge, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={[styles.liveDot, { backgroundColor: theme.fresh }]} />
            <Text style={[type.micro, { color: theme.inkSoft }]}>LIVE</Text>
          </View>
        </Entrance>

        <Entrance index={1}>
          <Text style={[type.title, styles.title, { color: theme.ink }]}>Turn what you see into ground truth.</Text>
        </Entrance>

        <Entrance index={2} style={styles.listLabel}>
          <SectionLabel>OPEN OBSERVATIONS · NEAREST FIRST</SectionLabel>
        </Entrance>

        <View style={styles.list}>
          {observations.map((query, index) => {
            const place = places.find((item) => item.id === query.placeId);
            const hero = index === 0;
            return (
              <Entrance key={query.id} index={index + 3}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${money(query.observerRewardCents)} observation at ${place?.name}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTask(query.id);
                    router.push(`/observe/task/${query.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    hero && styles.heroCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: hero ? theme.accent : theme.border,
                      opacity: pressed ? 0.84 : 1,
                      transform: [{ scale: pressed ? 0.988 : 1 }],
                    },
                  ]}
                >
                  <View style={styles.cardTopline}>
                    <Text style={[type.monoBig, hero ? styles.heroReward : styles.reward, { color: theme.accent }]}>
                      {money(query.observerRewardCents)}
                    </Text>
                    <View style={styles.cardBadges}>
                      {query.isNew ? (
                        <View style={[styles.newBadge, { backgroundColor: theme.accent }]}>
                          <Text style={[type.micro, { color: theme.onAccent }]}>NEW</Text>
                        </View>
                      ) : null}
                      <Text style={[type.micro, { color: hero ? theme.accent : theme.inkSoft }]}>{proximityLabel(query.placeId)}</Text>
                    </View>
                  </View>
                  <Text style={[hero ? type.heading : type.body, styles.question, { color: theme.ink }]}>{query.question}</Text>
                  <View style={styles.placeRow}>
                    <View style={styles.placeCopy}>
                      <Text style={[type.label, { color: theme.inkSoft }]} numberOfLines={1}>{place?.name}</Text>
                      <Text style={[type.mono, styles.duration, { color: theme.inkFaint }]}>{durationLabel(query.placeId)}</Text>
                    </View>
                    <Glyph name="chevron" color={theme.inkFaint} size={18} />
                  </View>
                </Pressable>
              </Entrance>
            );
          })}
        </View>
      </AppScreen>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topline: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  available: { marginTop: 4, fontSize: 13, lineHeight: 19 },
  sensorBadge: { minHeight: 32, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  title: { maxWidth: 330, marginTop: space.lg },
  listLabel: { marginTop: space.xl, marginBottom: space.sm },
  list: { gap: space.sm },
  card: { borderWidth: 1, borderRadius: radii.card, padding: 18, gap: space.sm },
  heroCard: { borderWidth: 1.5, paddingVertical: 21 },
  cardTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  cardBadges: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingTop: 4 },
  newBadge: { borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 4 },
  heroReward: { fontSize: 34, lineHeight: 38 },
  reward: { fontSize: 26, lineHeight: 31 },
  question: { maxWidth: 320 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  placeCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  duration: { fontSize: 11, lineHeight: 16 },
});
