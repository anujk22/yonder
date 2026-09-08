import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Clock3,
  ChevronDown,
  ChevronUp,
  Receipt,
  Info,
} from "lucide-react-native";
import {
  AppScreen,
  MissingDataState,
  PrimaryButton,
  ScreenHeader,
} from "@/components/ui";
import { MotionPressable } from "@/components/MotionPressable";
import { PlaceArt } from "@/components/PlaceArt";
import { useYonderStore } from "@/lib/store";
import { freshness, formatAge } from "@/lib/freshness";
import { artFor } from "@/lib/discovery";
import { money } from "@/lib/pricing";
import { ask, font } from "@/lib/theme";
export default function AnswerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const answer = useYonderStore((s) => s.answers.find((a) => a.id === id));
  const place = useYonderStore((s) =>
    s.places.find((p) => p.id === answer?.placeId),
  );
  const queries = useYonderStore((s) => s.queries);
  const active = useYonderStore((s) => s.activeQueryId);
  const [now, setNow] = useState(() => Date.now());
  const [details, setDetails] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!answer || !place)
    return <MissingDataState title="That answer is not available." />;
  const available = answer.confidence > 0;
  const age = freshness(answer.observedAt, answer.ttlSeconds, now);
  const query =
    queries.find((q) => q.id === active && q.answerId === answer.id) ??
    queries.find((q) => q.answerId === answer.id && !q.id.startsWith("seed-"));
  const refresh = () => {
    const s = useYonderStore.getState();
    s.setResolvedPlace(place.id);
    s.setDraftQuestion(answer.question);
    s.setDeadline(10);
    router.push("/ask/place");
  };
  return (
    <AppScreen>
      <ScreenHeader eyebrow="YOUR LITTLE LOOK AROUND" title={place.name} />
      <View style={styles.badge}>
        <Info size={14} color="#725A88" />
        <Text style={styles.badgeText}>
          {available ? "Illustrative answer" : "Still unanswered"}
        </Text>
      </View>
      <Text accessibilityRole="header" style={styles.headline}>
        {available
          ? answer.headline.replace(/[.!]+$/, "") + "."
          : "This one needs another look."}
      </Text>
      <Text style={styles.detail}>
        {available
          ? answer.detail
          : "There isn’t an observation for this question yet. Your credits are safe."}
      </Text>
      <View style={styles.art}>
        <PlaceArt kind={artFor(place)} />
      </View>
      {available && (
        <View
          style={[
            styles.freshCard,
            age.band !== "FRESH" && { backgroundColor: "#F9EDB8" },
          ]}
        >
          <View style={styles.icon}>
            <Clock3 size={23} color={ask.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {age.band === "FRESH"
                ? "A recent example"
                : "Time for another look"}
            </Text>
            <Text style={styles.body}>
              {age.band === "FRESH"
                ? `Created ${formatAge(age.ageSeconds)} ago · not a live report`
                : "This example has aged. Conditions can change."}
            </Text>
          </View>
        </View>
      )}
      {query && (
        <View style={styles.receipt}>
          <View style={styles.row}>
            <View style={styles.icon}>
              <Receipt size={23} color="#725A88" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {answer.charged ? "Credits used" : "No charge"}
              </Text>
              <Text style={styles.body}>
                {answer.charged
                  ? "Simulated credits · no money moved"
                  : "All your credits stay with you"}
              </Text>
            </View>
            <Text style={styles.amount}>
              {money(answer.charged ? query.bountyCents : 0)}
            </Text>
          </View>
        </View>
      )}
      <MotionPressable
        accessibilityRole="button"
        accessibilityState={{ expanded: details }}
        onPress={() => setDetails(!details)}
        style={styles.detailsToggle}
      >
        <Text style={styles.toggleText}>Answer details</Text>
        {details ? (
          <ChevronUp size={19} color={ask.ink} />
        ) : (
          <ChevronDown size={19} color={ask.ink} />
        )}
      </MotionPressable>
      {details && (
        <View style={styles.details}>
          <Text style={styles.body}>
            Source:{" "}
            {available
              ? "Example observation; not independently verified."
              : "No observation available."}
          </Text>
          <Text style={styles.body}>
            Created: {new Date(answer.observedAt).toLocaleString()}
          </Text>
          <Text style={styles.body}>
            The artwork represents the place category. It is not a photo of this
            location.
          </Text>
          {query && answer.charged && (
            <Text style={styles.body}>
              {money(query.observerRewardCents)} reward ·{" "}
              {money(query.platformFeeCents)} fee, in simulated credits.
            </Text>
          )}
        </View>
      )}
      <View style={styles.actions}>
        <PrimaryButton
          label={available ? "Ask for a fresh look" : "Try another question"}
          onPress={refresh}
        />
        <PrimaryButton
          label="Keep exploring"
          testID="answer-home"
          variant="secondary"
          onPress={() => router.navigate("/")}
        />
      </View>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    backgroundColor: "#EEE5F7",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    marginBottom: 16,
  },
  badgeText: { fontFamily: font.ui600, fontSize: 12, color: "#725A88" },
  headline: {
    fontFamily: font.ui700,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
    color: ask.ink,
  },
  detail: {
    fontFamily: font.ui400,
    fontSize: 15,
    lineHeight: 23,
    color: ask.inkSoft,
    marginTop: 12,
    marginBottom: 20,
  },
  art: { height: 215, borderRadius: 25, overflow: "hidden", marginBottom: 18 },
  freshCard: {
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
    backgroundColor: "#E3EDCE",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 23,
    padding: 17,
    marginBottom: 14,
    boxShadow: "0 4px 0 #C9D4B4",
  },
  icon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#FFFFFF99",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: font.ui700,
    fontSize: 17,
    lineHeight: 23,
    color: ask.ink,
  },
  body: {
    fontFamily: font.ui400,
    fontSize: 13,
    lineHeight: 20,
    color: ask.inkSoft,
    marginTop: 5,
  },
  receipt: {
    backgroundColor: "#EAE0F5",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 23,
    padding: 17,
    marginBottom: 12,
    boxShadow: "0 4px 0 #D3C5E3",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  amount: {
    fontFamily: font.ui700,
    fontSize: 24,
    color: ask.ink,
    letterSpacing: -1,
  },
  detailsToggle: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  toggleText: { fontFamily: font.ui600, fontSize: 14, color: ask.ink },
  details: {
    backgroundColor: "#FFFFFF",
    borderRadius: 19,
    padding: 17,
    gap: 7,
  },
  actions: { marginTop: 16, gap: 15 },
});
