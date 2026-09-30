import { DEMO_FEATURES_ENABLED, LIVE_FEATURES_ENABLED } from "@/lib/previewFeatures";
import LiveHome from "@/components/LiveHome";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppScreen, PrimaryButton } from "@/components/ui";
import { BrandScene } from "@/components/BrandObject";
import { useYonderStore } from "@/lib/store";
import { ask, font, type } from "@/lib/theme";
import { money } from "@/lib/pricing";
import { liveConfigured } from "@/lib/liveClient";

export default function ActivityScreen() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  return LIVE_FEATURES_ENABLED && !(DEMO_FEATURES_ENABLED && demo === "1") ? <LiveHome view="requests" /> : <DemoActivityScreen />;
}

function DemoActivityScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | "Waiting" | "Answered">("All");
  const queries = useYonderStore((s) => s.queries);
  const places = useYonderStore((s) => s.places);
  const tab = useYonderStore((s) => s.tab);
  const payouts = useYonderStore((s) => s.payouts);
  const earned = payouts.reduce((sum, p) => sum + p.amountCents, 0);
  const own = queries.filter(
    (q) => !q.id.startsWith("seed-") && q.state !== "DRAFT",
  );
  const visible = own.filter(
    (q) =>
      filter === "All" ||
      (filter === "Answered"
        ? q.state === "ANSWERED"
        : !["ANSWERED", "REFUNDED", "BLOCKED"].includes(q.state)),
  );
  return (
    <AppScreen>
      <Text style={styles.eyebrow}>YOUR LITTLE LOOKS AROUND</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Your demo requests
      </Text>
      {liveConfigured && (
        <View style={{ marginBottom: 20 }}>
          <PrimaryButton
            label="Your live checks"
            variant="secondary"
            onPress={() => router.push("/live")}
          />
        </View>
      )}
      <View style={styles.balances}>
        <View>
          <Text style={styles.amount}>{money(tab.openCents)}</Text>
          <Text style={styles.meta}>On your tab</Text>
        </View>
        <View>
          <Text style={styles.amount}>{money(earned)}</Text>
          <Text style={styles.meta}>Paid out to your bank</Text>
        </View>
      </View>
      <Text style={[styles.meta, { marginTop: -12, marginBottom: 24, lineHeight: 19 }]}>
        Demo · no card is charged and no money is sent. Your tab is billed as
        one card payment once it reaches $5 or after 7 days.
      </Text>
      <View style={styles.filters}>
        {(["All", "Waiting", "Answered"] as const).map((f) => (
          <Pressable
            key={f}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f }}
            onPress={() => setFilter(f)}
            style={[
              styles.filter,
              filter === f && { backgroundColor: ask.ink },
            ]}
          >
            <Text
              style={[type.label, { color: filter === f ? ask.bg : ask.ink }]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
      </View>
      {visible.map((q) => (
        <Pressable
          key={q.id}
          accessibilityRole="button"
          onPress={() => {
            useYonderStore.setState({ activeQueryId: q.id });
            router.push(
              q.answerId ? `/ask/answer/${q.answerId}` : "/ask/status",
            );
          }}
          style={styles.card}
        >
          <View style={styles.row}>
            <Text style={styles.status}>
              {q.state === "ANSWERED"
                ? "EXAMPLE ANSWER"
                : q.state === "REFUNDED"
                  ? "CANCELLED"
                  : q.state === "BLOCKED"
                    ? "UNAVAILABLE"
                    : "SAVED REQUEST"}
            </Text>
            <Text style={styles.meta}>{money(q.bountyCents)}</Text>
          </View>
          <Text style={styles.question}>{q.question}</Text>
          <Text style={styles.meta}>
            {places.find((p) => p.id === q.placeId)?.name} ↗
          </Text>
        </Pressable>
      ))}
      {!visible.length && (
        <View style={styles.empty}>
          <BrandScene compact />
          <Text style={styles.question}>
            {own.length
              ? "Nothing in this view yet."
              : "Your next good decision starts here."}
          </Text>
          <Text style={[styles.meta, { textAlign: "center", lineHeight: 22 }]}>
            Your requests and answers will appear here.{`\n`}Saved locally,
            ready when you return.
          </Text>
        </View>
      )}
      <PrimaryButton label="Explore places" onPress={() => router.push("/")} />
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  eyebrow: { ...type.micro, color: ask.inkSoft, marginTop: 18 },
  title: {
    fontFamily: font.ui700,
    fontSize: 32,
    lineHeight: 38,
    color: ask.ink,
    letterSpacing: -2,
    marginVertical: 16,
  },
  balances: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    borderRadius: 16,
    backgroundColor: ask.surfaceAlt,
    padding: 22,
    marginBottom: 24,
  },
  amount: {
    fontFamily: font.mono500,
    fontSize: 28,
    color: ask.ink,
    marginBottom: 5,
  },
  meta: { ...type.label, color: ask.inkSoft, fontSize: 12 },
  filters: { flexDirection: "row", gap: 10, marginBottom: 20 },
  filter: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: ask.border,
    borderRadius: 30,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ask.border,
    backgroundColor: ask.surface,
    marginBottom: 14,
    gap: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  status: { ...type.micro, color: ask.fresh },
  question: {
    fontFamily: font.ui600,
    fontSize: 22,
    lineHeight: 28,
    color: ask.ink,
    letterSpacing: -0.5,
  },
  empty: { paddingVertical: 20, gap: 20, alignItems: "center" },
});
