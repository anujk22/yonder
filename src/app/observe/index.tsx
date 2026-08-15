import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Entrance, AppScreen } from '@/components/ui';
import { YMark } from '@/components/YMark';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { money } from '@/lib/pricing';
import { radii, space, type } from '@/lib/theme';

const PROXIMITY_ORDER = ['pier2', 'joes', 'nikesoho', 'unionsq', 'wsp', 'tjs', 'bryant', 'applesq'];

const cameraCopy = (placeId: string) => {
  const copy: Record<string, string> = {
    pier2: 'Show Court 3\nwith your camera',
    joes: 'Show the front window display',
    nikesoho: 'Show the price tag on\nthe featured item',
    unionsq: 'Show the north elevator\nwith your camera',
    wsp: 'Show the park conditions\nwith your camera',
    tjs: 'Show the end of the checkout line',
    bryant: 'Show the terrace tables\nwith your camera',
    applesq: 'Show the featured item\nwith your camera',
  };
  return copy[placeId] ?? 'Show the requested place\nwith your camera';
};

const durationLabel = (placeId: string) => {
  if (placeId === 'pier2') return '~20 sec';
  if (placeId === 'joes') return '~30 sec';
  return '~25 sec';
};

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
        <Entrance>
          <Text style={[type.serifDisplay, styles.title, { color: theme.ink }]}>Observe{`\n`}nearby</Text>
        </Entrance>

        <Entrance index={1} style={styles.availableWrap}>
          <Text style={[type.mono, styles.available, { color: theme.ink }]}>$4.15 available within 5 minutes</Text>
        </Entrance>

        <View style={styles.list}>
          {observations.map((query, index) => {
            const place = places.find((item) => item.id === query.placeId);
            if (!place) return null;
            const hero = index === 0;
            return (
              <Entrance key={query.id} index={index + 2}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${money(query.observerRewardCents)}. ${cameraCopy(query.placeId)}. ${place?.name}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTask(query.id);
                    router.push(`/observe/task/${query.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.card,
                    hero && styles.heroCard,
                    {
                      backgroundColor: hero ? theme.surface : theme.transparent,
                      borderColor: hero ? theme.accent : theme.border,
                      opacity: pressed ? 0.84 : 1,
                      transform: [{ scale: pressed ? 0.988 : 1 }],
                    },
                  ]}
                >
                  <View style={styles.cardTopline}>
                    <View style={styles.cardBadges}>
                      <View style={[hero ? styles.heroMark : styles.mark, hero && { borderColor: theme.border }]}>
                        <YMark size={hero ? 34 : 38} bodyColor={theme.accent} />
                      </View>
                      {hero ? (
                        <View style={[styles.hereBadge, { borderColor: theme.fresh }]}>
                          <Text style={[type.micro, styles.hereText, { color: theme.ink }]}>YOU'RE{`\n`}HERE</Text>
                        </View>
                      ) : null}
                      {query.isNew ? (
                        <View style={[styles.newBadge, { backgroundColor: theme.accent }]}>
                          <Text style={[type.micro, { color: theme.onAccent }]}>NEW</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[hero ? type.monoBig : type.mono, styles.reward, { color: theme.ink }]}>{money(query.observerRewardCents)}</Text>
                  </View>

                  <View style={[styles.hairline, { backgroundColor: theme.border }]} />

                  <Text style={[hero ? type.serifTitle : type.serifHeading, styles.question, { color: theme.ink }]}>{cameraCopy(query.placeId)}</Text>
                  <View style={styles.placeRow}>
                    <Text style={[type.mono, styles.place, { color: theme.ink }]} numberOfLines={1}>{place?.name}</Text>
                    <Text style={[type.mono, styles.duration, { color: theme.ink }]}>{durationLabel(query.placeId)}</Text>
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
  title: { fontSize: 56, lineHeight: 55, maxWidth: 330, marginTop: space.md },
  availableWrap: { marginTop: space.lg },
  available: { fontSize: 14, lineHeight: 20 },
  list: { gap: space.sm, marginTop: 26 },
  card: { borderWidth: 1, borderRadius: radii.card, padding: 18, gap: space.md },
  heroCard: { borderWidth: 2, padding: 22, gap: 18 },
  cardTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  cardBadges: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  heroMark: { width: 56, height: 56, borderWidth: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  hereBadge: { width: 62, height: 62, borderWidth: 1, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  hereText: { textAlign: 'center', lineHeight: 15 },
  newBadge: { borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5 },
  reward: { textAlign: 'right', paddingTop: 4 },
  hairline: { height: StyleSheet.hairlineWidth, width: '100%' },
  question: { maxWidth: 325 },
  placeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  place: { flex: 1, fontSize: 12, lineHeight: 18 },
  duration: { fontSize: 12, lineHeight: 18 },
});
