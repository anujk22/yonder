import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppScreen, MissingDataState, PrimaryButton } from "@/components/ui";
import { BrandScene } from "@/components/BrandObject";
import { useYonderStore } from "@/lib/store";
import { money } from "@/lib/pricing";
import { observe, font, type } from "@/lib/theme";
export default function EarnedScreen() {
  const router = useRouter();
  const query = useYonderStore((s) =>
    s.queries.find((q) => q.id === s.activeTaskId),
  );
  const answer = useYonderStore((s) =>
    s.answers.find((a) => a.id === query?.answerId),
  );
  const payout = useYonderStore((s) =>
    s.payouts.find((p) => p.queryId === query?.id),
  );
  if (!query || !answer)
    return <MissingDataState title="No completed check is available." />;
  const reward = payout?.amountCents ?? 0;
  const arrival = payout
    ? new Date(payout.arrivesBy).toLocaleDateString(undefined, { weekday: "long" })
    : "";
  const sameDay = payout
    ? new Date(payout.arrivesBy).toDateString() === new Date(payout.sentAt).toDateString()
    : false;
  return (
    <AppScreen>
      <View style={styles.hero}>
        <BrandScene complete />
        <Text style={styles.label}>DEMO JOURNEY COMPLETE</Text>
        <Text style={styles.title}>
          {reward
            ? "A little help.\nA better day."
            : "Some questions\nneed another look."}
        </Text>
        <Text style={styles.amount}>+{money(reward)}</Text>
        <Text style={styles.body}>
          {reward
            ? `Deposit to your bank ${sameDay ? "today" : `by ${arrival}`} · demo, no money sent`
            : "No payout for this one"}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.body}>
          {reward
            ? "You’ve completed the sample Scout journey. Each answer is paid out on its own, the same business day. The answer is ready to view from the asker’s side."
            : "There is no confident sample answer for this question. The asker wasn’t billed and no payout was sent."}
        </Text>
        <Text style={styles.body}>
          No location, photo analysis, or payment was verified in this
          simulation.
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label="See the example answer"
          onPress={() => router.push(`/ask/answer/${answer.id}`)}
        />
        <PrimaryButton
          label="Back to requests"
          variant="secondary"
          onPress={() => router.replace("/observe")}
        />
      </View>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 14, paddingVertical: 20 },
  label: { ...type.micro, color: observe.accent },
  title: {
    fontFamily: font.ui700,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    color: observe.ink,
    textAlign: "center",
  },
  amount: {
    fontFamily: font.mono500,
    fontSize: 50,
    color: observe.accent,
    marginTop: 10,
  },
  body: { ...type.body, fontSize: 14, lineHeight: 23, color: observe.inkSoft },
  card: {
    backgroundColor: observe.surface,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  actions: { marginTop: 24, gap: 14 },
});
