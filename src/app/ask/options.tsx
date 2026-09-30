import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AnswerTierCard } from "@/components/AnswerTierCard";
import { AppScreen, MissingDataState, ScreenHeader } from "@/components/ui";
import { answerTier, money, RECENT_ANSWER_CENTS } from "@/lib/pricing";
import { sameQuestion } from "@/lib/queryMatching";
import { useYonderStore } from "@/lib/store";
import { ask, font, type } from "@/lib/theme";
export default function OptionsScreen() {
  const router = useRouter();
  const query = useYonderStore((s) =>
    s.queries.find((q) => q.id === s.activeQueryId),
  );
  const answers = useYonderStore((s) => s.answers);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!query)
    return <MissingDataState title="Start with a place and a question." />;
  const matching = answers
    .filter(
      (a) =>
        a.placeId === query.placeId && sameQuestion(a.question, query.question),
    )
    .sort((a, b) => b.observedAt - a.observedAt);
  const recent = matching.find((a) => answerTier(a.observedAt, now) === "recent");
  const old = matching.find((a) => answerTier(a.observedAt, now) === "free");
  const unlock = (id: string, price: number) => {
    useYonderStore.getState().chooseCachedAnswer(id, price);
    if (
      useYonderStore.getState().queries.find((q) => q.id === query.id)
        ?.state === "ANSWERED"
    )
      router.push(`/ask/answer/${id}`);
    else setError("That answer changed. Choose another option.");
  };
  return (
    <AppScreen>
      <ScreenHeader eyebrow="02 / CHOOSE YOUR LOOK" />
      <Text accessibilityRole="header" style={styles.title}>
        How do you want to know?
      </Text>
      <Text style={styles.question}>{query.question}</Text>
      <Text style={styles.body}>
        Post a demo bounty or read an older sample answer for free. Example
        answers do not describe current conditions.
      </Text>
      <View style={styles.cards}>
        <AnswerTierCard
          kind="dispatch"
          testID="options-dispatch"
          headline="Post a bounty"
          priceCents={query.bountyCents}
          subtitle={`Scout gets ${money(query.observerRewardCents)} · ${query.deadlineMinutes}-minute deadline · demo, no card charged`}
          onPress={() => {
            useYonderStore.getState().postActiveQuery();
            if (
              useYonderStore.getState().queries.find((q) => q.id === query.id)
                ?.state === "OPEN"
            )
              router.push("/ask/status");
            else
              setError(
                "You’ve reached the $10 limit on unpaid bounties. Wait for your open requests to finish, then try again.",
              );
          }}
        />
        {recent && (
          <AnswerTierCard
            kind="recent"
            testID="options-recent"
            headline={recent.headline}
            priceCents={RECENT_ANSWER_CENTS}
            disabled
            priceLabel="LATER"
            subtitle="Paying for the newest answer is a future idea, not part of this build."
            ttlSeconds={recent.ttlSeconds}
            onPress={() => undefined}
          />
        )}
        {old && (
          <AnswerTierCard
            kind="last"
            testID="options-last"
            headline={old.headline}
            priceCents={0}
            observedAt={old.observedAt}
            ttlSeconds={old.ttlSeconds}
            onPress={() => unlock(old.id, 0)}
          />
        )}
        {!recent && !old && (
          <Text style={styles.body}>
            No one has answered this yet. Post a bounty to be the first.
          </Text>
        )}
        {Boolean(error) && (
          <Text
            accessibilityRole="alert"
            style={[styles.body, { color: ask.danger }]}
          >
            {error}
          </Text>
        )}
      </View>
      <Text style={styles.note}>
        Bounties are simulated in this build: no card is charged and no one is
        dispatched.
      </Text>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  title: {
    fontFamily: font.ui700,
    fontSize: 32,
    lineHeight: 38,
    color: ask.ink,
    letterSpacing: -2,
    marginTop: 12,
  },
  question: { ...type.body, color: ask.ink, fontSize: 19, marginTop: 20 },
  body: {
    ...type.body,
    color: ask.inkSoft,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 10,
  },
  cards: { gap: 14, marginTop: 24 },
  note: {
    ...type.label,
    color: ask.inkSoft,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 24,
  },
});
