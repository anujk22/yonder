import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AnswerTierCard } from "@/components/AnswerTierCard";
import { AutopilotTouches } from "@/components/AutopilotLayer";
import { AppScreen, MissingDataState, PrimaryButton, ScreenHeader } from "@/components/ui";
import { answerTier, MIN_BOUNTY_CENTS, money, RECENT_ANSWER_CENTS } from "@/lib/pricing";
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
  const [paying, setPaying] = useState(false);
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
        Example answers do not describe current conditions.
      </Text>
      <View style={styles.cards}>
        <AnswerTierCard
          kind="dispatch"
          testID="options-dispatch"
          headline="Post a bounty"
          priceCents={query.bountyCents}
          subtitle={`${money(MIN_BOUNTY_CENTS)} minimum · billed only if answered · Scout gets ${money(query.observerRewardCents)} · demo, no card charged`}
          onPress={() => setPaying(true)}
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
      <Modal visible={paying} transparent animationType="slide" onRequestClose={() => setPaying(false)}>
        <View style={styles.scrim}>
          <View style={styles.sheet}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>Confirm your bounty</Text>
            <View style={styles.row}><Text style={styles.rowLabel}>Bounty</Text><Text style={styles.rowValue}>{money(query.bountyCents)}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Scout gets</Text><Text style={styles.rowValue}>{money(query.observerRewardCents)}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Yonder fee</Text><Text style={styles.rowValue}>{money(query.bountyCents - query.observerRewardCents)}</Text></View>
            <Text style={styles.body}>Billed only if someone answers within {query.deadlineMinutes} minutes.</Text>
            <PrimaryButton testID="options-pay" label={`Pay ${money(query.bountyCents)}`} onPress={() => {
              setPaying(false);
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
            }} />
            <PrimaryButton label="Cancel" variant="secondary" onPress={() => setPaying(false)} />
            <Text style={styles.note}>Demo · you won’t be charged.</Text>
          </View>
          <AutopilotTouches />
        </View>
      </Modal>
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
    fontSize: 27,
    lineHeight: 33,
    color: ask.ink,
    letterSpacing: -1.5,
    marginTop: 6,
  },
  question: { ...type.body, color: ask.ink, fontSize: 19, marginTop: 10 },
  body: {
    ...type.body,
    color: ask.inkSoft,
    fontSize: 13,
    lineHeight: 22,
    marginTop: 10,
  },
  cards: { gap: 10, marginTop: 14 },
  scrim: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: ask.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  sheetTitle: { fontFamily: font.ui700, fontSize: 24, color: ask.ink, letterSpacing: -1, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { ...type.body, color: ask.inkSoft },
  rowValue: { fontFamily: font.ui700, fontSize: 17, color: ask.ink },
  note: {
    ...type.label,
    color: ask.inkSoft,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 24,
  },
});
