import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { AnswerTierCard } from "@/components/AnswerTierCard";
import { AppScreen, MissingDataState, ScreenHeader } from "@/components/ui";
import { answerTier, money, RECENT_ANSWER_CENTS } from "@/lib/pricing";
import { buyRecentAnswer, loadRecentAnswerPackage, purchasesAvailable, testPurchases } from "@/lib/purchases";
import { purchaseWasCancelled } from "@/lib/purchasePolicy";
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
  const [recentPackage, setRecentPackage] = useState<PurchasesPackage | null>(null);
  const [buying, setBuying] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!purchasesAvailable) return;
    let active = true;
    loadRecentAnswerPackage()
      .then((option) => { if (active) setRecentPackage(option); })
      .catch(() => undefined);
    return () => { active = false; };
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
  const buyRecent = async (id: string) => {
    if (buying) return;
    if (!purchasesAvailable) {
      setError("Buying the latest answer needs the Yonder app on iPhone or Android.");
      return;
    }
    if (!recentPackage) {
      setError("The latest answer isn’t available to buy right now. Try again in a moment.");
      return;
    }
    setBuying(true);
    setError("");
    try {
      await buyRecentAnswer(recentPackage);
      unlock(id, RECENT_ANSWER_CENTS);
    } catch (e) {
      if (!purchaseWasCancelled(e)) setError("The store couldn’t complete this purchase. You weren’t charged. Try again.");
    } finally {
      setBuying(false);
    }
  };
  const storePriceCents = recentPackage ? Math.round(recentPackage.product.price * 100) : RECENT_ANSWER_CENTS;
  return (
    <AppScreen>
      <ScreenHeader eyebrow="02 / CHOOSE YOUR LOOK" />
      <Text accessibilityRole="header" style={styles.title}>
        How do you want to know?
      </Text>
      <Text style={styles.question}>{query.question}</Text>
      <Text style={styles.body}>
        Post a new bounty for a fresh look, buy the latest answer, or read one
        from a day or more ago for free. Example answers do not describe current
        conditions.
      </Text>
      {testPurchases && (
        <Text accessibilityRole="alert" style={styles.notice}>
          TEST STORE · Buying an answer uses RevenueCat’s test purchase flow. No real payment.
        </Text>
      )}
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
            headline={buying ? "Connecting to the store…" : recent.headline}
            priceCents={storePriceCents}
            observedAt={recent.observedAt}
            ttlSeconds={recent.ttlSeconds}
            onPress={() => void buyRecent(recent.id)}
          />
        )}
        {old && (
          <AnswerTierCard
            kind="last"
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
        dispatched. Buying the latest answer is an in-app purchase.
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
  notice: {
    ...type.body,
    color: ask.ink,
    fontSize: 13,
    padding: 14,
    backgroundColor: ask.surfaceAlt,
    borderRadius: 14,
    marginTop: 16,
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
