import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AnswerTierCard } from '@/components/AnswerTierCard';
import { YMark } from '@/components/YMark';
import { AppScreen, Entrance, MissingDataState } from '@/components/ui';
import { freshness } from '@/lib/freshness';
import { OBSERVERS_NEARBY } from '@/lib/places';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { space, type } from '@/lib/theme';

export default function OptionsScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const activeQueryId = useYonderStore((state) => state.activeQueryId);
  const query = useYonderStore((state) => state.queries.find((item) => item.id === state.activeQueryId));
  const answers = useYonderStore((state) => state.answers);
  const chooseCachedAnswer = useYonderStore((state) => state.chooseCachedAnswer);
  const postActiveQuery = useYonderStore((state) => state.postActiveQuery);

  useEffect(() => {
    if (!activeQueryId) router.replace('/ask');
  }, [activeQueryId, router]);

  const matchingAnswers = useMemo(
    () => query
      ? answers
        .filter((answer) => answer.placeId === query.placeId && answer.queryType === query.queryType)
        .sort((a, b) => b.observedAt - a.observedAt)
      : [],
    [answers, query],
  );
  const recentAnswer = matchingAnswers.find((answer) => freshness(answer.observedAt, answer.ttlSeconds).band === 'FRESH');
  const lastKnownAnswer = matchingAnswers.find((answer) => freshness(answer.observedAt, answer.ttlSeconds).band !== 'FRESH');

  if (!query) return <MissingDataState title="No query is ready for answer options." />;

  const openCachedAnswer = (answerId: string, priceCents: number) => {
    chooseCachedAnswer(answerId, priceCents);
    router.push(`/ask/answer/${answerId}`);
  };

  return (
    <AppScreen style={styles.screen}>
      <Entrance style={styles.brandMark}>
        <View style={[styles.brandDisc, { backgroundColor: theme.accent }]}>
          <YMark size={42} bodyColor={theme.onAccent} headColor={theme.onAccent} />
        </View>
      </Entrance>

      <Entrance index={1} style={styles.intro}>
        <Text
          style={[type.serifDisplay, styles.title, { color: theme.ink }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          Choose your answer
        </Text>
        <Text style={[type.mono, styles.question, { color: theme.ink }]}>{query.question}</Text>
      </Entrance>

      <View style={styles.tiers}>
        {lastKnownAnswer ? (
          <AnswerTierCard
            kind="last"
            headline={lastKnownAnswer.headline}
            priceCents={0}
            observedAt={lastKnownAnswer.observedAt}
            ttlSeconds={lastKnownAnswer.ttlSeconds}
            onPress={() => openCachedAnswer(lastKnownAnswer.id, 0)}
          />
        ) : null}
        {recentAnswer ? (
          <AnswerTierCard
            kind="recent"
            headline={recentAnswer.headline}
            priceCents={15}
            observedAt={recentAnswer.observedAt}
            ttlSeconds={recentAnswer.ttlSeconds}
            onPress={() => openCachedAnswer(recentAnswer.id, 15)}
            index={lastKnownAnswer ? 1 : 0}
          />
        ) : null}
        <AnswerTierCard
          kind="dispatch"
          headline={'Verified answer in\nabout 2 minutes'}
          priceCents={query.bountyCents}
          observersNearby={OBSERVERS_NEARBY[query.placeId]}
          onPress={() => {
            postActiveQuery();
            router.push('/ask/status');
          }}
          index={(lastKnownAnswer ? 1 : 0) + (recentAnswer ? 1 : 0)}
        />
      </View>

      <Entrance index={4} style={[styles.promiseBand, { backgroundColor: theme.accent }]}>
        <Text style={[type.mono, styles.promiseText, { color: theme.onAccent }]}>Fresh evidence costs more. Cached truth costs less.</Text>
      </Entrance>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: space.xs },
  brandMark: { alignItems: 'center' },
  brandDisc: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  intro: { marginTop: space.lg, gap: space.sm },
  title: { fontSize: 32, lineHeight: 37 },
  question: { fontSize: 14, lineHeight: 21 },
  tiers: { gap: space.sm, marginTop: space.lg },
  promiseBand: { marginHorizontal: -space.lg, marginTop: space.md, paddingHorizontal: space.lg, paddingVertical: 14 },
  promiseText: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
