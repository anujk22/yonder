import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Entrance, AppScreen } from '@/components/ui';
import { YMark } from '@/components/YMark';
import { useAutopilotPressTarget } from '@/lib/autopilot';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { money } from '@/lib/pricing';
import { font, radii, space, type } from '@/lib/theme';

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
  const topTaskRef = useRef<View>(null);

  const observations = useMemo(
    () => {
      const liveQueries = queries.filter((query) => !['DRAFT', 'ANSWERED', 'REFUNDED', 'BLOCKED'].includes(query.state));
      return liveQueries
        .filter((query) => query.isNew || !liveQueries.some((candidate) => candidate.isNew && candidate.placeId === query.placeId && candidate.queryType === query.queryType))
        .sort((left, right) => {
          if (left.isNew !== right.isNew) return left.isNew ? -1 : 1;
          return PROXIMITY_ORDER.indexOf(left.placeId) - PROXIMITY_ORDER.indexOf(right.placeId);
        })
        .slice(0, 3);
    },
    [queries],
  );
  const availableCents = observations.reduce((total, query) => total + query.observerRewardCents, 0);
  const openTask = (queryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTask(queryId);
    router.push(`/observe/task/${queryId}`);
  };
  useAutopilotPressTarget('observe-task-top', topTaskRef, () => {
    if (observations[0]) openTask(observations[0].id);
  });

  return (
    <Animated.View
      entering={FadeIn.duration(240).withInitialValues({ opacity: 0, transform: [{ scale: 0.98 }] } as never)}
      style={styles.flex}
    >
      <AppScreen style={styles.screen}>
        <Entrance>
          <Text style={[type.serifDisplay, styles.title, { color: theme.ink }]}>Observe{`\n`}nearby</Text>
        </Entrance>

        <Entrance index={1} style={styles.availableWrap}>
          <Text style={[type.mono, styles.available, { color: theme.ink }]}>{money(availableCents)} available within 5 minutes</Text>
        </Entrance>

        <View style={styles.list}>
          {observations.map((query, index) => {
            const place = places.find((item) => item.id === query.placeId);
            if (!place) return null;
            const hero = index === 0;
            const taskCopy = query.isNew ? query.question : cameraCopy(query.placeId);
            return (
              <Entrance key={query.id} index={index + 2}>
                <Pressable
                  ref={index === 0 ? topTaskRef : undefined}
                  testID={index === 0 ? 'observe-task-top' : undefined}
                  accessibilityRole="button"
                  accessibilityLabel={`${money(query.observerRewardCents)}. ${taskCopy}. ${place?.name}`}
                  onPress={() => openTask(query.id)}
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
                        <YMark size={hero ? 34 : 28} bodyColor={theme.accent} />
                      </View>
                      {hero ? (
                        <View style={[styles.hereBadge, { borderColor: theme.fresh }]}>
                          <Text style={[type.mono, styles.hereText, { color: theme.ink }]}>YOU'RE{`\n`}HERE</Text>
                        </View>
                      ) : null}
                      {query.isNew ? (
                        <View style={[styles.newBadge, { backgroundColor: theme.accent }]}>
                          <Text style={[type.micro, { color: theme.onAccent }]}>NEW</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[hero ? type.monoBig : type.mono, styles.reward, !hero && styles.secondaryReward, { color: theme.ink }]}>{money(query.observerRewardCents)}</Text>
                  </View>

                  <View style={[styles.hairline, { backgroundColor: theme.border }]} />

                  <Text
                    style={[
                      hero ? type.serifTitle : type.serifHeading,
                      styles.question,
                      hero ? styles.heroQuestion : styles.secondaryQuestion,
                      { color: theme.ink },
                    ]}
                  >
                    {taskCopy}
                  </Text>
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
  screen: { paddingHorizontal: 30 },
  title: { fontSize: 52, lineHeight: 50, maxWidth: 330, marginTop: 18 },
  availableWrap: { marginTop: 18 },
  available: { fontSize: 14, lineHeight: 20 },
  list: { gap: 10, marginTop: 20 },
  card: { borderWidth: 1, borderRadius: radii.card, padding: 14, gap: 9 },
  heroCard: { borderWidth: 2, padding: 18, gap: 13 },
  cardTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.sm },
  cardBadges: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  heroMark: { width: 50, height: 50, borderWidth: 1, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  hereBadge: { width: 52, height: 52, borderWidth: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  hereText: { fontFamily: font.mono500, fontSize: 11, lineHeight: 13, letterSpacing: 0.4, textAlign: 'center' },
  newBadge: { borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 5 },
  reward: { textAlign: 'right', paddingTop: 4 },
  secondaryReward: { fontSize: 16, lineHeight: 21 },
  hairline: { height: StyleSheet.hairlineWidth, width: '100%' },
  question: { maxWidth: 325 },
  heroQuestion: { fontSize: 34, lineHeight: 36 },
  secondaryQuestion: { fontSize: 24, lineHeight: 27 },
  placeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  place: { flex: 1, fontSize: 11, lineHeight: 16 },
  duration: { fontSize: 11, lineHeight: 16 },
});
