import { CommunitySpotDetails } from "@/components/CommunitySpotDetails";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MapSurface, detailRegion } from "@/components/MapSurface";
import {
  AppScreen,
  MissingDataState,
  PrimaryButton,
  ScreenHeader,
} from "@/components/ui";
import { CategoryObject } from "@/components/CategoryObject";
import { Glyph } from "@/components/Glyph";
import { useYonderStore } from "@/lib/store";
import { ask, font, type } from "@/lib/theme";
import { categoryFor, questionFor, suggestions } from "@/lib/discovery";
import { inferQueryType } from "@/lib/places";
import { BOUNTY_STEP_CENTS, MIN_BOUNTY_CENTS, money, priceQuery, splitBounty } from "@/lib/pricing";
import { isUnsafeQuestion } from "@/lib/safety";
import { liveConfigured } from "@/lib/liveClient";

export default function PlaceScreen() {
  const router = useRouter();
  const place = useYonderStore((s) =>
    s.places.find((p) => p.id === s.resolvedPlaceId),
  );
  const question = useYonderStore((s) => s.draftQuestion);
  const deadline = useYonderStore((s) => s.deadlineMinutes);
  const chosenBounty = useYonderStore((s) => s.draftBountyCents);
  const [error, setError] = useState("");
  const [details, setDetails] = useState(false);
  if (!place)
    return <MissingDataState title="Choose a place to take a closer look." />;
  const suggested = priceQuery(
    place.id,
    inferQueryType(question || questionFor(place)),
    deadline,
  );
  const cost = splitBounty(chosenBounty ?? suggested.bountyCents);
  const stepBounty = (delta: number) =>
    useYonderStore.getState().setDraftBountyCents(Math.max(MIN_BOUNTY_CENTS, cost.bountyCents + delta));
  const prompts = [
    ...new Set([
      questionFor(place),
      ...place.categories.map((c) => suggestions[c]),
    ]),
  ].slice(0, 3);
  const submit = () => {
    if (!question.trim()) {
      setError("Add a question, or pick a suggestion below.");
      return;
    }
    if (isUnsafeQuestion(question)) {
      router.push("/ask/rejected");
      return;
    }
    const state = useYonderStore.getState();
    state.setDraftBountyCents(cost.bountyCents);
    if (state.createDraftQuery()) router.push("/ask/options");
    else
      setError(
        "This place is unavailable for checks. Please choose another place.",
      );
  };
  return (
    <AppScreen
      footer={
        <PrimaryButton
          testID="ask-submit"
          label="See answer options"
          onPress={submit}
        />
      }
    >
      <ScreenHeader eyebrow="LOCAL DEMO REQUEST" title={place.name} />
      {liveConfigured && (
        <>
          <PrimaryButton
            label="Ask for a live check"
            variant="secondary"
            onPress={() => router.push("/live/new")}
          />
          <Text style={[styles.note, { marginBottom: 16 }]}>
            No charge during early access · someone nearby may answer. No guaranteed response.
          </Text>
        </>
      )}
      <View style={styles.map}>
        <MapSurface
          style={StyleSheet.absoluteFill}
          initialRegion={detailRegion({
            latitude: place.lat,
            longitude: place.lng,
          })}
          markers={[
            {
              id: place.id,
              coordinate: { latitude: place.lat, longitude: place.lng },
              label: place.name,
            },
          ]}
          geofence={{
            center: { latitude: place.lat, longitude: place.lng },
            radius: place.geofenceM,
          }}
        />
      </View>
      <Text style={styles.area}>{place.area}</Text>
      <CommunitySpotDetails place={place}/>
      <View style={styles.divider} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: "#EEE6F7",
          borderRadius: 22,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#FFFFFF",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={styles.title}>
            What would you like to know?
          </Text>
          <Text style={styles.body}>
            Try a specific place question. No one is dispatched in this demo.
          </Text>
        </View>
        <CategoryObject place={place} category={categoryFor(place)} size={90} animated />
      </View>
      <TextInput
        accessibilityLabel={`Question about ${place.name}`}
        placeholder="Is there a line? Any free tables?"
        placeholderTextColor={ask.inkFaint}
        value={question}
        multiline
        maxLength={280}
        onChangeText={(value) => {
          useYonderStore.getState().setDraftQuestion(value);
          setError("");
        }}
        style={[styles.input, Boolean(error) && { borderColor: ask.danger }]}
      />
      <View style={styles.row}>
        <Text style={styles.meta}>
          Ask about a place, never a private person.
        </Text>
        <Text style={styles.meta}>{question.length}/280</Text>
      </View>
      {Boolean(error) && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <View style={styles.prompts}>
        {prompts.map((prompt) => (
          <Pressable
            key={prompt}
            accessibilityRole="button"
            onPress={() => {
              useYonderStore.getState().setDraftQuestion(prompt);
              setError("");
            }}
            style={styles.prompt}
          >
            <Text style={styles.promptText}>{prompt} ↗</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>SIMULATED DEADLINE</Text>
      <View style={styles.deadlines}>
        {[5, 10, 15, 30].map((n) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: n === deadline }}
            key={n}
            onPress={() => useYonderStore.getState().setDeadline(n)}
            style={[
              styles.deadline,
              n === deadline && {
                backgroundColor: ask.ink,
                borderColor: ask.ink,
              },
            ]}
          >
            <Text
              style={[type.label, { color: n === deadline ? ask.bg : ask.ink }]}
            >
              {n} min
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.price}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>YOUR BOUNTY · {money(MIN_BOUNTY_CENTS)} MINIMUM</Text>
            <Text style={styles.priceValue}>{money(cost.bountyCents)}</Text>
          </View>
          <Glyph name="eye" color={ask.fresh} size={30} />
        </View>
        <View style={styles.steppers}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lower bounty by 50 cents"
            disabled={cost.bountyCents <= MIN_BOUNTY_CENTS}
            onPress={() => stepBounty(-BOUNTY_STEP_CENTS)}
            style={[styles.stepper, cost.bountyCents <= MIN_BOUNTY_CENTS && { opacity: 0.4 }]}
          >
            <Text style={styles.stepperText}>− $0.50</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Raise bounty by 50 cents"
            onPress={() => stepBounty(BOUNTY_STEP_CENTS)}
            style={styles.stepper}
          >
            <Text style={styles.stepperText}>+ $0.50</Text>
          </Pressable>
        </View>
        <Text style={styles.body}>
          Offer more if it’s worth more to you. Scout gets {money(cost.observerRewardCents)}.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: details }}
          onPress={() => setDetails(!details)}
        >
          <Text style={styles.priceLink}>
            {details ? "Hide breakdown −" : "Where does it go? +"}
          </Text>
        </Pressable>
        {details && (
          <Text style={styles.body}>
            {money(cost.observerRewardCents)} to the Scout ·{" "}
            {money(cost.platformFeeCents)} to Yonder. Yonder keeps $1, plus 3%
            of anything above {money(MIN_BOUNTY_CENTS)} to cover card fees.
            You’re only billed if you get an answer.
          </Text>
        )}
      </View>
      <Text style={styles.note}>
        Demo: requests stay on this device. No card is charged and no one is dispatched.
      </Text>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  map: {
    height: 145,
    overflow: "hidden",
    borderRadius: 16,
    backgroundColor: ask.surfaceAlt,
  },
  placeName: {
    fontFamily: font.ui600,
    fontSize: 23,
    lineHeight: 29,
    color: ask.ink,
    marginTop: 18,
    letterSpacing: -0.6,
  },
  area: { ...type.label, color: ask.inkSoft, marginTop: 5 },
  divider: { height: 1, backgroundColor: ask.border, marginVertical: 22 },
  title: {
    fontFamily: font.ui600,
    fontSize: 24,
    lineHeight: 30,
    color: ask.ink,
    letterSpacing: -1,
  },
  body: {
    ...type.body,
    fontSize: 13,
    lineHeight: 21,
    color: ask.inkSoft,
    marginTop: 7,
  },
  input: {
    fontFamily: font.ui500,
    fontSize: 20,
    lineHeight: 28,
    color: ask.ink,
    padding: 18,
    textAlignVertical: "top",
    minHeight: 110,
    backgroundColor: ask.surface,
    borderWidth: 1,
    borderColor: ask.border,
    borderRadius: 14,
    marginTop: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  meta: {
    fontFamily: font.ui400,
    fontSize: 10,
    color: ask.inkSoft,
    marginTop: 9,
  },
  error: { ...type.label, color: ask.danger, marginTop: 8 },
  prompts: { gap: 8, marginVertical: 18 },
  prompt: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: ask.border,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  promptText: { ...type.label, fontSize: 11, color: ask.inkSoft },
  label: { ...type.micro, fontSize: 9, color: ask.inkSoft },
  deadlines: { flexDirection: "row", gap: 9, marginTop: 12, marginBottom: 20 },
  deadline: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ask.border,
    padding: 12,
    alignItems: "center",
  },
  price: {
    borderRadius: 16,
    backgroundColor: ask.surfaceAlt,
    padding: 19,
    gap: 4,
    marginBottom: 20,
  },
  priceValue: {
    fontFamily: font.mono500,
    color: ask.ink,
    fontSize: 32,
    marginTop: 6,
  },
  priceLink: { ...type.label, color: ask.fresh, paddingVertical: 9 },
  steppers: { flexDirection: "row", gap: 9, marginTop: 12 },
  stepper: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ask.border,
    backgroundColor: ask.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { ...type.label, color: ask.ink },
  note: {
    ...type.label,
    fontSize: 10,
    lineHeight: 17,
    color: ask.inkSoft,
    textAlign: "center",
    marginTop: 12,
  },
});
