import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppScreen, PrimaryButton } from "@/components/ui";
import { BrandScene } from "@/components/BrandObject";
import { useYonderStore } from "@/lib/store";
import { ask, font, type } from "@/lib/theme";
import { money } from "@/lib/pricing";

export default function ActivityScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | "Waiting" | "Answered">("All");
  const queries = useYonderStore((s) => s.queries);
  const places = useYonderStore((s) => s.places);
  const wallet = useYonderStore((s) => s.walletCents);
  const earned = useYonderStore((s) => s.earnedCents);
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
        Your requests
      </Text>
      <View style={styles.balances}>
        <View>
          <Text style={styles.amount}>{money(wallet)}</Text>
          <Text style={styles.meta}>Simulated credits</Text>
        </View>
        <View>
          <Text style={styles.amount}>{money(earned)}</Text>
          <Text style={styles.meta}>Simulated earnings</Text>
        </View>
      </View>
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
                ? "ANSWER READY"
                : q.state === "REFUNDED"
                  ? "CANCELLED"
                  : q.state === "BLOCKED"
                    ? "UNAVAILABLE"
                    : "SAVED REQUEST"}
            </Text>
            <Text style={styles.meta}>{money(q.bountyCents)} demo</Text>
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
