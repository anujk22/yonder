import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AnswerTierCard } from '@/components/AnswerTierCard';
import { AppScreen, Entrance, ScreenHeader } from '@/components/ui';
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

  if (!query) return null;

  const openCachedAnswer = (answerId: string, priceCents: number) => {
    chooseCachedAnswer(answerId, priceCents);
    router.push(`/ask/answer/${answerId}`);
  };

  return (
    <AppScreen>
      <ScreenHeader eyebrow="REALITY CACHE" title="Choose your answer" />
      <Entrance style={styles.questionBlock}>
        <Text style={[type.micro, { color: theme.inkSoft }]}>YOUR QUERY</Text>
        <Text style={[type.heading, { color: theme.ink }]}>{query.question}</Text>
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
          headline="Verified answer in about 2 minutes"
          priceCents={query.bountyCents}
          observersNearby={OBSERVERS_NEARBY[query.placeId]}
          onPress={() => {
            postActiveQuery();
            router.push('/ask/status');
          }}
          index={(lastKnownAnswer ? 1 : 0) + (recentAnswer ? 1 : 0)}
        />
      </View>

      <Entrance index={3} style={styles.promise}>
        <Text style={[type.mono, styles.promiseText, { color: theme.inkSoft }]}>Fresh evidence costs more. Cached truth costs less.</Text>
      </Entrance>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  questionBlock: { gap: space.xs, marginBottom: space.lg },
  tiers: { gap: space.md },
  promise: { alignItems: 'center', paddingVertical: space.lg },
  promiseText: { fontSize: 11, textAlign: 'center' },
});
