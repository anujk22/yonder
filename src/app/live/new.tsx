import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { LiveSignIn } from "@/components/LiveSignIn";
import { liveConfigured } from "@/lib/liveClient";
import { useLiveAuth } from "@/lib/liveAuth";
import { createLiveRequest, getPilotAccess } from "@/lib/liveApi";
import { LIVE_QUESTIONS, type LiveQuestionKind } from "@/lib/liveTypes";
import { useYonderStore } from "@/lib/store";
import { ask, font, type } from "@/lib/theme";

export default function NewLiveRequestScreen() {
  const userId = useLiveAuth((state) => state.user?.id);
  const placeId = useYonderStore((state) => state.resolvedPlaceId);
  return <NewLiveRequestSession key={`${userId ?? "signed-out"}:${placeId ?? "none"}`} />;
}

function NewLiveRequestSession() {
  const router = useRouter();
  const focused = useIsFocused();
  const user = useLiveAuth((state) => state.user);
  const userId = user?.id;
  const ready = useLiveAuth((state) => state.ready);
  const [place] = useState(() => {
    const state = useYonderStore.getState();
    const selected = state.places.find((item) => item.id === state.resolvedPlaceId);
    return selected ? { name: selected.name, latitude: selected.lat, longitude: selected.lng, area: selected.area, landmark: selected.communitySpot?.description.slice(0, 180) ?? "", blocked: selected.status === "blocked" } : null;
  });
  const [access, setAccess] = useState<{ userId: string; allowed: boolean } | null>(null);
  const [landmark, setLandmark] = useState(() => place?.landmark ?? "");
  const [questionKind, setQuestionKind] = useState<LiveQuestionKind>("open_now");
  const [deadlineMinutes, setDeadlineMinutes] = useState(10);
  const [publicConfirmed, setPublicConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accessRetry, setAccessRetry] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!liveConfigured || !ready || !userId || !focused) return;
    let active = true;
    void getPilotAccess().then((allowed) => { if (active) setAccess({ userId, allowed }); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Couldn’t check your invitation."); });
    return () => { active = false; };
  }, [ready, userId, focused, accessRetry]);

  const submit = async () => {
    if (!user || busy || !place) return;
    if (!publicConfirmed) { setError("Confirm the place and pin are public and correct."); return; }
    setBusy(true);
    setError("");
    try {
      const id = await createLiveRequest({ placeName: place.name, latitude: place.latitude, longitude: place.longitude, landmark, questionKind, deadlineMinutes });
      if (mounted.current && useLiveAuth.getState().user?.id === user.id) router.replace(`/live/${id}`);
    } catch (cause) {
      if (mounted.current && useLiveAuth.getState().user?.id === user.id) setError(cause instanceof Error ? cause.message : "Couldn’t create this check.");
    } finally { if (mounted.current) setBusy(false); }
  };

  const allowed = access && access.userId === userId && access.allowed;
  return <AppScreen>
    <ScreenHeader eyebrow="NEW FREE PLACE CHECK" />
    <Text accessibilityRole="header" style={styles.title}>Ask for a fresh place check.</Text>
    {!liveConfigured ? <View style={styles.card}>
      <Text style={styles.body}>Live checks are not connected in this build. You can still search and save places.</Text>
      <PrimaryButton label="Back to Explore" onPress={() => router.replace("/")} />
    </View> : !ready ? <Text style={styles.body}>Checking account…</Text> : !user ? <View style={styles.card}>
      <Text style={styles.body}>Sign in or create a free account to request a shared place check.</Text>
      <LiveSignIn />
    </View> : !allowed ? <View style={styles.card}>
      <Text style={styles.body}>{access?.userId === user.id ? "Community checks are unavailable for your account." : "Checking your account…"}</Text>
      <PrimaryButton label="Check access again" variant="secondary" onPress={() => setAccessRetry((count) => count + 1)} />
      <PrimaryButton label="Your requests" variant="secondary" onPress={() => router.push("/live")} />
    </View> : !place || place.blocked ? <View style={styles.card}>
      <Text style={styles.body}>Choose an available public place from Explore first.</Text>
      <PrimaryButton label="Choose a place" onPress={() => router.push("/")} />
    </View> : <>
      <Text style={styles.body}>Free community check. Another person may answer, but nobody is guaranteed to respond. Answers are self-reported, not independently verified.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>SELECTED PLACE AND PIN</Text>
        <Text style={styles.cardTitle}>{place.name}</Text>
        <Text style={styles.body}>{place.area}</Text>
        <Text style={styles.coordinates}>{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</Text>
        <Text style={styles.body}>The place and pin cannot be changed after you send this check. Choose a different place from Explore if they are wrong.</Text>
      </View>
      <Text style={styles.label}>PUBLIC LANDMARK OR ENTRANCE · OPTIONAL</Text>
      <TextInput accessibilityLabel="Public landmark or entrance" placeholder="Main entrance, north side of the park…" placeholderTextColor={ask.inkFaint} value={landmark} onChangeText={(value) => { setLandmark(value); setError(""); }} maxLength={180} multiline style={styles.input} />
      <Text style={styles.meta}>{landmark.length}/180 · Do not include a private home, person, or security detail.</Text>
      <Text style={styles.label}>WHAT SHOULD SOMEONE CHECK?</Text>
      {(["open_now", "queue", "availability"] as const).map((kind) => <Pressable key={kind} accessibilityRole="radio" accessibilityState={{ checked: questionKind === kind }} onPress={() => setQuestionKind(kind)} style={[styles.option, questionKind === kind && styles.selected]}><Text style={styles.optionText}>{LIVE_QUESTIONS[kind]}</Text></Pressable>)}
      <Text style={styles.label}>EXPIRES AFTER</Text>
      <View style={styles.deadlines}>{[5, 10, 15, 30].map((minutes) => <Pressable key={minutes} accessibilityRole="radio" accessibilityState={{ checked: deadlineMinutes === minutes }} onPress={() => setDeadlineMinutes(minutes)} style={[styles.deadline, deadlineMinutes === minutes && styles.selected]}><Text style={styles.optionText}>{minutes} min</Text></Pressable>)}</View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: publicConfirmed }} onPress={() => { setPublicConfirmed(!publicConfirmed); setError(""); }} style={styles.confirm}><Text style={styles.optionText}>{publicConfirmed ? "☑" : "□"} I confirm this is a public place, the pin is correct, and the landmark is safe to share.</Text></Pressable>
      <PrimaryButton label={busy ? "Sending check…" : "Send free place check"} onPress={() => void submit()} disabled={busy} />
      <Text style={styles.meta}>No payment or reward. The request expires after the selected time if nobody responds.</Text>
    </>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </AppScreen>;
}

const styles = StyleSheet.create({
  title: { fontFamily: font.ui700, fontSize: 30, lineHeight: 37, color: ask.ink, marginBottom: 12 },
  body: { ...type.body, color: ask.inkSoft, marginBottom: 8 },
  label: { ...type.micro, color: ask.inkSoft, marginTop: 22, marginBottom: 10 },
  card: { backgroundColor: ask.surface, borderColor: ask.border, borderWidth: 1, borderRadius: 18, padding: 20, gap: 8, marginVertical: 14 },
  cardTitle: { ...type.heading, color: ask.ink },
  coordinates: { ...type.mono, color: ask.inkSoft },
  input: { ...type.body, color: ask.ink, backgroundColor: ask.surface, borderColor: ask.border, borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 88, textAlignVertical: "top" },
  meta: { ...type.label, color: ask.inkSoft, marginVertical: 8 },
  option: { backgroundColor: ask.surface, borderColor: ask.border, borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 8 },
  selected: { borderColor: ask.ink, backgroundColor: ask.surfaceAlt },
  optionText: { ...type.body, color: ask.ink },
  deadlines: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  deadline: { borderColor: ask.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  confirm: { paddingVertical: 16, marginVertical: 14 },
  error: { ...type.body, color: ask.danger, marginTop: 14 },
});
