import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { BrandObject } from "./BrandObject";
import { Entrance, PrimaryButton } from "./ui";
import { useOnboarding } from "@/lib/onboarding";
import { ask, font, observe, type } from "@/lib/theme";
import type { ArtworkKind } from "./BrandImage";

const pages: { art: ArtworkKind; eyebrow: string; title: string; body: string; dark?: boolean }[] = [
  {
    art: "scoutFront",
    eyebrow: "BEFORE YOU MAKE THE TRIP",
    title: "Ask someone\nalready there.",
    body: "Is a hoop free? How long is the line? Is the elevator working? Pick a place on the map and ask.",
  },
  {
    art: "scout",
    eyebrow: "WHEN YOU’RE OUT",
    title: "Or be the\nScout.",
    body: "Answer a check near you in a couple of taps. Asking and answering are free.",
    dark: true,
  },
  {
    art: "done",
    eyebrow: "HONEST BY DESIGN",
    title: "Fresh, and clear\nabout it.",
    body: "Every answer shows how old it is. Answers are self-reported by people, and anyone can skip a check that doesn’t feel safe.",
  },
];

export function Onboarding() {
  const insets = useSafeAreaInsets();
  const finish = useOnboarding((s) => s.finish);
  const [index, setIndex] = useState(0);
  const [asking, setAsking] = useState(false);
  const page = pages[index];
  const last = index === pages.length - 1;
  const theme = page.dark ? observe : ask;

  const requestLocation = async () => {
    setAsking(true);
    try { await Location.requestForegroundPermissionsAsync(); } catch {}
    finish();
  };

  return <View accessibilityViewIsModal style={[StyleSheet.absoluteFill, styles.shell, { backgroundColor: theme.bg, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
    <View style={styles.top}>
      <View style={styles.dots} accessibilityLabel={`Step ${index + 1} of ${pages.length}`}>
        {pages.map((item, i) => <View key={item.title} style={[styles.dot, { backgroundColor: i === index ? theme.accent : theme.border, width: i === index ? 22 : 8 }]} />)}
      </View>
      {!last && <Pressable accessibilityRole="button" onPress={finish} hitSlop={12}><Text style={[styles.skip, { color: theme.inkSoft }]}>Skip</Text></Pressable>}
    </View>
    <Entrance key={index} style={styles.body}>
      <View style={styles.art}><BrandObject kind={page.art} size={200} playful /></View>
      <Text style={[type.micro, { color: theme.inkSoft }]}>{page.eyebrow}</Text>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{page.title}</Text>
      <Text style={[styles.copy, { color: theme.inkSoft }]}>{page.body}</Text>
    </Entrance>
    <View style={styles.actions}>
      {last ? <>
        <Text style={[styles.small, { color: theme.inkSoft }]}>Yonder uses your location only to center the map near you. You can search anywhere without it.</Text>
        <PrimaryButton label={asking ? "One moment…" : "Use my location"} disabled={asking} onPress={() => void requestLocation()} />
        <Pressable accessibilityRole="button" onPress={finish} style={styles.later}><Text style={[type.label, { color: theme.ink }]}>Maybe later</Text></Pressable>
      </> : <PrimaryButton label="Next" onPress={() => setIndex(index + 1)} />}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  shell: { zIndex: 3000, elevation: 40, paddingHorizontal: 26 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 36 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  skip: { ...type.label, fontSize: 15 },
  body: { flex: 1, justifyContent: "center", gap: 12 },
  art: { alignItems: "center", marginBottom: 18 },
  title: { fontFamily: font.ui700, fontSize: 38, lineHeight: 43, letterSpacing: -1.4 },
  copy: { ...type.body, fontSize: 17, lineHeight: 26 },
  actions: { gap: 12 },
  small: { ...type.label, lineHeight: 19, textAlign: "center" },
  later: { minHeight: 48, alignItems: "center", justifyContent: "center" },
});
