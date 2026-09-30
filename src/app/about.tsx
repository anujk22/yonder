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
import { DEMO_FEATURES_ENABLED } from "@/lib/previewFeatures";
import { liveConfigured } from "@/lib/liveClient";
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
          {liveConfigured ? <>Ask someone{`\n`}already there.</> : <>Your places.{`\n`}All together.</>}
        </Text>
        <Text style={styles.body}>
          {liveConfigured ? "Is it open? How long is the line? Is there room? Yonder lets you ask the community about a public place before you go." : "Search places, save the ones that matter, and organize them into your own collections. Your lists and personal pins stay on this device."}
        </Text>
      </Entrance>
      <View style={[styles.steps, width < 800 && { flexDirection: "column" }]}>
        {(liveConfigured ? [
          [
            "01",
            "Pick your place.",
            "Search a U.S. public place, check its map pin, and choose a question about opening, the wait, available room or step-free access.",
          ],
          [
            "02",
            "Ask the community.",
            "Sign in to send a free check with an expiry time. Someone already there can choose to answer. No Scout is dispatched and no payment or reward is offered.",
          ],
          [
            "03",
            "Read their observation.",
            "See a time-stamped, self-reported answer. A response is not guaranteed, and Yonder does not verify it through photos or GPS.",
          ],
        ] : [
          ["01", "Find a place.", "Search for a U.S. place or city, then see it on the map. Location access is optional."],
          ["02", "Keep it close.", "Save a place or add a personal pin for somewhere you want to remember."],
          ["03", "Make your own lists.", "Organize saved places into named collections. Your first collection is free; Plus adds more."],
        ]).map(([n, title, body]) => (
          <View key={n} style={styles.step}>
            <Text style={styles.number}>{n} ↗</Text>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepBody}>{body}</Text>
          </View>
        ))}
      </View>
      <View style={styles.ethos}>
        <Text style={styles.stepTitle}>
          Curious about places. Respectful of people.
        </Text>
        <Text style={styles.stepBody}>
          Check public places and observable conditions. Don’t track people,
          enter restricted areas, or share private, illegal, threatening or
          abusive content. Use Report on a check or block a participant after
          an interaction. Contact Yonder support if you need help.
        </Text>
      </View>
      <View style={styles.preview}>
        <Text style={styles.eyebrow}>WHAT YOU CAN DO TODAY</Text>
        <Text style={styles.stepTitle}>What’s available today.</Text>
        <Text style={styles.stepBody}>
          Explore the map, search U.S. places, save your favorites and create
          a free collection. Explore and Saved need no account.
          Your saved places, personal pins and collections stay on this device
          and do not sync between devices.
        </Text>
        {liveConfigured && <Text style={styles.stepBody}>
          Community checks are free and use an email account; you sign in
          with a code sent to your email. Your open checks share
          the selected public place and question with signed-in members; the
          requester and responding Scout can see the answer. Your email is
          not shown to other members. Open Settings to sign out or delete
          your account and its shared checks. Yonder Plus is an optional
          subscription for longer check windows, more open checks and
          unlimited collections.
        </Text>}
        {DEMO_FEATURES_ENABLED && <Text style={styles.stepBody}>
          This build also includes a separate local demo. The NYC tour,
          bounties, earnings and sample answers are illustrative. Demo
          requests stay on this device; no one is dispatched or paid.
        </Text>}
        {DEMO_FEATURES_ENABLED && <Text style={styles.stepBody}>
          The optional demo device-check path uses actual GPS accuracy,
          distance and reading age to unlock a three-frame camera capture.
          Photos stay on your device and are not uploaded or independently
          verified. The sample path works without location or camera access.
        </Text>}
        <Text style={styles.stepBody}>
          USA place search sends the place name you enter to OpenStreetMap
          through Yonder’s server. Your location centers the map; Yonder does
          not send it to its search server. Sending a community check shares
          the selected place’s coordinates, not a live device-location feed.
          iPhone maps use Apple Maps; web
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
        {DEMO_FEATURES_ENABLED && <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/observe?demo=1")}
        >
          <Text style={styles.link}>
            Explore the local Scout demo ↗
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
