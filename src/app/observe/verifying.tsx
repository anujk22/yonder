import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DeclineSheet } from "@/components/DeclineSheet";
import { AppScreen, MissingDataState } from "@/components/ui";
import { BrandScene } from "@/components/BrandObject";
import { MotionPressable } from "@/components/MotionPressable";
import { useActiveTheme, useYonderStore } from "@/lib/store";
import { font } from "@/lib/theme";
import { TIMING } from "@/lib/timing";
const steps = [
  "Opening the observation",
  "Matching your question",
  "Preparing the result",
  "Adding the details",
  "Ready for a little clarity",
];
export default function VerifyingScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const activeTaskId = useYonderStore((s) => s.activeTaskId);
  const query = useYonderStore((s) =>
    s.queries.find((q) => q.id === s.activeTaskId),
  );
  const mode = useYonderStore((s) => s.captureMode);
  const complete = useYonderStore((s) => s.completeObservation);
  const update = useYonderStore((s) => s.updateQueryState);
  const [step, setStep] = useState(0);
  const [decline, setDecline] = useState(false);
  const completed = useRef(false);
  useEffect(() => {
    if (!activeTaskId || mode !== "demo") return;
    update(activeTaskId, "VERIFYING", "Preparing example answer");
    const timers = TIMING.verifySteps.map((delay, index) =>
      setTimeout(() => setStep(index), delay),
    );
    const finish = setTimeout(() => {
      if (completed.current) return;
      completed.current = true;
      const id = complete();
      router.replace(id ? "/observe/earned" : "/observe");
    }, TIMING.verifyTotalMs);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [activeTaskId, mode, complete, update, router]);
  if (!query || mode !== "demo")
    return <MissingDataState title="Choose an observation first." />;
  return (
    <AppScreen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: theme.inkSoft }]}>
            A LITTLE CLARITY, COMING UP
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            Good things.{`\n`}Worth a little look.
          </Text>
        </View>
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Stop observation"
          onPress={() => setDecline(true)}
          style={[styles.close, { backgroundColor: theme.surface }]}
        >
          <X size={20} color={theme.ink} />
        </MotionPressable>
      </View>
      <LinearGradient colors={["#EEE4FA", "#D2BFE9"]} style={styles.scene}>
        <BrandScene complete />
        <Text style={styles.sceneCaption}>Connecting the little details.</Text>
      </LinearGradient>
      <View
        style={[
          styles.progressCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <View style={styles.row}>
          <Text style={[styles.stepLabel, { color: theme.ink }]}>
            {steps[step]}
          </Text>
          <Text style={[styles.count, { color: theme.accent }]}>
            {step + 1}/5
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 5, now: step + 1 }}
          style={styles.progress}
        >
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i <= step ? theme.accent : theme.border },
              ]}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Check size={17} color={theme.inkSoft} />
          <Text style={[styles.note, { color: theme.inkSoft }]}>
            Example observation · no live analysis
          </Text>
        </View>
      </View>
      <Text style={[styles.footer, { color: theme.inkSoft }]}>
        A clearer answer.{`\n`}One less thing to wonder about.
      </Text>
      <DeclineSheet visible={decline} onClose={() => setDecline(false)} />
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", gap: 12, paddingTop: 15, marginBottom: 24 },
  eyebrow: { fontFamily: font.ui600, fontSize: 10, letterSpacing: 1 },
  title: {
    fontFamily: font.ui700,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: -1,
    marginTop: 12,
  },
  close: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  scene: {
    borderRadius: 29,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#F6EFFF",
    boxShadow: "0 6px 0 #AF9FC6",
  },
  sceneCaption: {
    fontFamily: font.ui600,
    fontSize: 13,
    color: "#665076",
    marginBottom: 14,
  },
  progressCard: { padding: 21, borderRadius: 24, borderWidth: 1, gap: 19 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  stepLabel: { fontFamily: font.ui700, fontSize: 17, lineHeight: 23, flex: 1 },
  count: { fontFamily: font.ui700, fontSize: 15 },
  progress: { flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 7, borderRadius: 4 },
  note: { fontFamily: font.ui400, fontSize: 12, lineHeight: 18, flex: 1 },
  footer: {
    fontFamily: font.ui500,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 28,
  },
});
