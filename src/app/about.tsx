import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { AppScreen, Entrance, PrimaryButton } from "@/components/ui";
import { BrandScene } from "@/components/BrandObject";
import { ask, font, type } from "@/lib/theme";

export default function AboutScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  return (
    <AppScreen>
      <Entrance style={styles.hero}>
        <BrandScene />
        <Text style={styles.eyebrow}>YOUR NEW LOCAL INSTINCT</Text>
        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            width < 600 && { fontSize: 43, lineHeight: 45 },
          ]}
        >
          {__DEV__ ? <>The world changes.{`\n`}Your information should, too.</> : <>Your places.{`\n`}All together.</>}
        </Text>
        <Text style={styles.body}>
          {__DEV__ ? "A review from last summer can’t tell you how long the line is today. Yonder is for the small, right-now questions that make a real difference to your day." : "Search places, save the ones that matter, and organize them into your own collections. Your lists and personal pins stay on this device."}
        </Text>
      </Entrance>
      <View style={[styles.steps, width < 800 && { flexDirection: "column" }]}>
        {(__DEV__ ? [
          [
            "01",
            "Pick your place.",
            "Find a park, a pizza spot, or anywhere you’re headed. Try a specific place question in the local demo.",
          ],
          [
            "02",
            "Explore the sample flow.",
            "Read a free older answer, buy the latest one, or post a bounty. You see the price and the Scout's share before you decide.",
          ],
          [
            "03",
            "See an example result.",
            "Explore a time-stamped sample answer and its limitations. Samples do not report current conditions.",
          ],
        ] : [
          ["01", "Find a place.", "Search for a U.S. place or city, then see it on the map. Location access is optional."],
          ["02", "Keep it close.", "Save a place or add a personal pin for somewhere you want to remember."],
          ["03", "Make your own lists.", "Organize saved places into named collections. Collections are free and unlimited."],
        ]).map(([n, title, body]) => (
          <View key={n} style={styles.step}>
            <Text style={styles.number}>{n} ↗</Text>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepBody}>{body}</Text>
          </View>
        ))}
      </View>
      {__DEV__ && <View style={styles.ethos}>
        <Text style={styles.stepTitle}>
          Curious about places. Respectful of people.
        </Text>
        <Text style={styles.stepBody}>
          Check public spaces and observable conditions. Don’t track a person,
          enter restricted areas, or keep filming when someone asks you to stop.
          A location reading supports a check; it does not prove the contents of
          a photo.
        </Text>
      </View>}
      <View style={styles.preview}>
        <Text style={styles.eyebrow}>WHAT YOU CAN DO TODAY</Text>
        <Text style={styles.stepTitle}>What’s available today.</Text>
        <Text style={styles.stepBody}>
          {__DEV__ ? "Explore the real world map, search real places, save your favorites, and follow your location with permission. The NYC tour, bounties and earnings are sample data. Requests stay on this device and no one is dispatched." : "Explore the map, search U.S. places, save your favorites and create personal pins and collections. No account or payment is required. Your saved lists do not sync between devices."}
        </Text>
        {__DEV__ && <Text style={styles.stepBody}>
          The device-check flow uses actual GPS accuracy, distance and reading
          age to unlock your camera. Photos remain on your device and are not
          independently verified. The demo flow lets you try the full answer
          journey without sharing location or camera access.
        </Text>}
        <Text style={styles.stepBody}>
          USA place search sends the place name you enter to OpenStreetMap
          through Yonder’s server. Your location centers the map; Yonder does
          not send it to its search server. iPhone maps use Apple Maps; web
          maps use OpenStreetMap tiles. Saved places, pins and collections are
          stored on this device.
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL("https://www.openstreetmap.org/copyright")}
        >
          <Text style={styles.link}>Place data © OpenStreetMap contributors · ODbL ↗</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL("https://yonder.expo.app/privacy")}
        >
          <Text style={styles.link}>Privacy policy ↗</Text>
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => void Linking.openURL("https://yonder.expo.app/support")}
        >
          <Text style={styles.link}>Yonder support ↗</Text>
        </Pressable>
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label="Explore places"
          onPress={() => router.push("/")}
        />
        {__DEV__ && <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/observe")}
        >
          <Text style={styles.link}>
            Already out and about? See how helping works ↗
          </Text>
        </Pressable>}
      </View>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingVertical: 28, gap: 18 },
  eyebrow: { ...type.micro, color: ask.inkSoft },
  title: {
    fontFamily: font.ui700,
    fontSize: 36,
    lineHeight: 41,
    letterSpacing: -1.5,
    color: ask.ink,
    textAlign: "center",
  },
  body: {
    ...type.body,
    color: ask.inkSoft,
    maxWidth: 650,
    textAlign: "center",
  },
  steps: { flexDirection: "row", gap: 16, marginTop: 20 },
  step: {
    flex: 1,
    padding: 24,
    borderWidth: 1,
    borderColor: ask.border,
    borderRadius: 16,
    backgroundColor: ask.surface,
    gap: 14,
  },
  number: { fontFamily: font.mono500, color: ask.fresh, fontSize: 22 },
  stepTitle: {
    fontFamily: font.ui600,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.7,
    color: ask.ink,
  },
  stepBody: { ...type.body, fontSize: 14, lineHeight: 23, color: ask.inkSoft },
  ethos: {
    padding: 26,
    backgroundColor: ask.accentSoft,
    borderRadius: 16,
    gap: 12,
    marginTop: 24,
  },
  preview: {
    padding: 24,
    borderColor: ask.border,
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 22,
    gap: 14,
  },
  actions: { gap: 16, marginTop: 24 },
  link: { ...type.label, color: ask.fresh, textAlign: "center", padding: 12 },
});
