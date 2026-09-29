import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppScreen, Entrance, PrimaryButton } from "@/components/ui";
import { BrandObject } from "@/components/BrandObject";
import { CategoryObject } from "@/components/CategoryObject";
import { categoryFor } from "@/lib/discovery";
import { MotionPressable } from "@/components/MotionPressable";
import { Glyph } from "@/components/Glyph";
import { useYonderStore } from "@/lib/store";
import { isQueryExpired } from "@/lib/state";
import { observe, font, type } from "@/lib/theme";
import { money } from "@/lib/pricing";
import { liveConfigured } from "@/lib/liveClient";
export default function ObserveHome() {
  const router = useRouter();
  const queries = useYonderStore((s) => s.queries);
  const places = useYonderStore((s) => s.places);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const tasks = queries
    .filter((q) => q.state === "OPEN" && !isQueryExpired(q, now) && places.find(p => p.id === q.placeId)?.status !== "blocked")
    .sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
  return (
    <AppScreen>
      <Entrance style={styles.intro}>
        <Text style={styles.eyebrow}>SCOUT · DEMO BOARD</Text>
        <View style={styles.heroRow}>
          <Text accessibilityRole="header" style={[styles.title, { flex: 1 }]}>
            Be someone’s eyes.
          </Text>
          <View style={styles.heroScout}>
            <BrandObject kind="scout" size={104} playful />
          </View>
        </View>
        <Text style={styles.body}>
          Explore how a place check could work. This board does not connect you
          to live requests or pay rewards.
        </Text>
      </Entrance>
      <View style={styles.explainer}>
        <Text style={styles.explainerTitle}>Two ways to try a check</Text>
        <Text style={styles.body}>
          Walk through a sample task with no permissions, or use your device to
          capture with GPS and your camera. Photos stay on your device; no
          answers are verified or rewards paid.
        </Text>
      </View>
      {liveConfigured && (
        <PrimaryButton
          label="See invited live checks"
          variant="secondary"
          onPress={() => router.push("/live")}
        />
      )}
      <Text style={styles.listLabel}>
        {tasks.length} REQUESTS TO EXPLORE · SAMPLE BOARD
      </Text>
      {tasks.map((q, i) => (
        <MotionPressable
          key={q.id}
          accessibilityRole="button"
          accessibilityLabel={`Check ${q.question}`}
          onPress={() => {
            useYonderStore.getState().setActiveTask(q.id);
            router.push(`/observe/task/${q.id}`);
          }}
          style={({ pressed }) => [
            styles.card,
            { opacity: pressed ? 0.85 : 1 },
            i === 0 && { borderColor: observe.accent },
          ]}
        >
          <View style={styles.row}>
            {(() => {
              const place = places.find((p) => p.id === q.placeId);
              return place ? (
                <CategoryObject
                  place={place}
                  category={categoryFor(place)}
                  size={46}
                />
              ) : null;
            })()}
            <Text style={[styles.eyebrow, { flex: 1, marginLeft: 10 }]}>
              {q.isNew ? "YOUR LOCAL REQUEST" : "SAMPLE REQUEST"}
            </Text>
            <Text style={styles.reward}>{money(q.observerRewardCents)}</Text>
          </View>
          <Text style={styles.question}>{q.question}</Text>
          <View style={styles.row}>
            <Text style={styles.place}>
              {places.find((p) => p.id === q.placeId)?.name}
            </Text>
            <Glyph name="arrow" color={observe.accent} />
          </View>
        </MotionPressable>
      ))}
      {!tasks.length && (
        <Text style={styles.body}>
          All caught up. Try asking a question from Explore.
        </Text>
      )}
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  heroRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  heroScout: { transform: [{ scaleX: -1 }] },
  intro: { gap: 12, paddingVertical: 16 },
  eyebrow: { ...type.micro, fontSize: 9, color: observe.inkSoft },
  title: {
    fontFamily: font.ui700,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1.2,
    color: observe.ink,
  },
  body: { ...type.body, fontSize: 14, lineHeight: 23, color: observe.inkSoft },
  explainer: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: observe.surface,
    gap: 9,
    marginVertical: 14,
  },
  explainerTitle: { ...type.label, color: observe.accent, fontSize: 15 },
  listLabel: {
    ...type.micro,
    color: observe.inkSoft,
    fontSize: 10,
    marginVertical: 18,
  },
  card: {
    padding: 22,
    borderWidth: 1,
    borderColor: observe.border,
    borderRadius: 16,
    gap: 18,
    marginBottom: 14,
    backgroundColor: observe.surface,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reward: { fontFamily: font.mono500, fontSize: 25, color: observe.accent },
  question: {
    fontFamily: font.ui600,
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: -0.7,
    color: observe.ink,
  },
  place: { ...type.label, color: observe.inkSoft, flex: 1 },
});
