import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { MapSurface, detailRegion } from "@/components/MapSurface";
import { cancelLiveRequest, claimLiveRequest, getLiveRequest, getPilotAccess, releaseLiveRequest, answerLiveRequest, reportLiveRequest, blockLiveUser } from "@/lib/liveApi";
import { useLiveAuth } from "@/lib/liveAuth";
import { liveConfigured } from "@/lib/liveClient";
import { validLiveAnswer } from "@/lib/livePolicy";
import { LIVE_QUESTIONS, liveAnswerLabel, liveExpired, type LiveReportReason, type LiveRequest } from "@/lib/liveTypes";
import { ask, font, type } from "@/lib/theme";

type Detail = { userId: string; id: string; access: boolean; request: LiveRequest | null };

export default function LiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useLiveAuth((state) => state.user?.id);
  return <LiveDetailSession key={`${userId ?? "signed-out"}:${id ?? "none"}`} id={id ?? ""} />;
}

function LiveDetailSession({ id }: { id: string }) {
  const router = useRouter();
  const focused = useIsFocused();
  const user = useLiveAuth((state) => state.user);
  const userId = user?.id;
  const ready = useLiveAuth((state) => state.ready);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [answer, setAnswer] = useState("");
  const [note, setNote] = useState("");
  const [onSite, setOnSite] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const refreshRef = useRef<() => void>(() => {});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!liveConfigured || !ready || !userId || !id || !focused || !foreground) return;
    let active = true;
    let requestNumber = 0;
    const refresh = async () => {
      const sequence = ++requestNumber;
      setLoading(true);
      setError("");
      try {
        const access = await getPilotAccess();
        const request = access ? await getLiveRequest(id) : null;
        if (active && sequence === requestNumber) setDetail({ userId, id, access, request });
      } catch (cause) {
        if (active && sequence === requestNumber) setError(cause instanceof Error ? cause.message : "Couldn’t load this check.");
      } finally { if (active && sequence === requestNumber) setLoading(false); }
    };
    refreshRef.current = () => { void refresh(); };
    void refresh();
    const timer = setInterval(refresh, 15_000);
    return () => { active = false; clearInterval(timer); refreshRef.current = () => {}; };
  }, [ready, userId, id, focused, foreground]);

  const current = detail && detail.userId === userId && detail.id === id ? detail : null;
  const request = current?.request;
  const mine = !!request && request.requester_id === user?.id;
  const claimedByMe = !!request && request.observer_id === user?.id;
  const expired = request ? liveExpired(request) : false;
  const otherUserId = request ? mine ? request.observer_id : request.requester_id : null;

  const act = async (action: () => Promise<void>, success: string, afterSuccess?: () => void) => {
    if (!user || busy) return;
    const userId = user.id;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      if (mounted.current && useLiveAuth.getState().user?.id === userId) {
        setNotice(success);
        if (afterSuccess) afterSuccess();
        else refreshRef.current();
      }
    } catch (cause) {
      if (mounted.current && useLiveAuth.getState().user?.id === userId) setError(cause instanceof Error ? cause.message : "Couldn’t update this check.");
    } finally { if (mounted.current) setBusy(false); }
  };

  const submitAnswer = () => {
    if (!request) return;
    if (!onSite) { setError("Confirm that you are at this public place now."); return; }
    if (!validLiveAnswer(request.question_kind, answer)) { setError(request.question_kind === "queue" ? "Enter a whole-number wait from 0 to 240 minutes, or choose Couldn’t tell." : "Choose Yes, No, or Couldn’t tell."); return; }
    void act(() => answerLiveRequest(request.id, answer, note), "Self-reported observation sent.");
  };

  return <AppScreen>
    <ScreenHeader eyebrow="INVITED LIVE CHECK" />
    {!liveConfigured ? <View style={styles.card}><Text style={styles.body}>Live checks are not connected in this build.</Text><PrimaryButton label="Explore local demo" onPress={() => router.replace("/observe")} /></View>
      : !ready ? <Text style={styles.body}>Checking account…</Text>
      : !user ? <View style={styles.card}><Text style={styles.body}>Sign in with your invited email to view this check.</Text><PrimaryButton label="Sign in" onPress={() => router.push("/live")} /></View>
      : !current ? <Text style={styles.body}>Loading live check…</Text>
      : !current.access ? <View style={styles.card}><Text style={styles.body}>Your invitation is not active.</Text><PrimaryButton label="Live pilot home" onPress={() => router.push("/live")} /></View>
      : !request ? <View style={styles.card}><Text style={styles.body}>This check is unavailable. It may have been removed or hidden.</Text><PrimaryButton label="See live checks" onPress={() => router.push("/live")} /></View>
      : <>
        <Text accessibilityRole="header" style={styles.title}>{request.place_name}</Text>
        <Text style={styles.question}>{LIVE_QUESTIONS[request.question_kind]}</Text>
        <View style={styles.map}>
          <MapSurface style={StyleSheet.absoluteFill} initialRegion={detailRegion({ latitude: request.latitude, longitude: request.longitude })} markers={[{ id: request.id, coordinate: { latitude: request.latitude, longitude: request.longitude }, label: request.place_name }]} />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>{request.status.toUpperCase()}{expired && request.status !== "answered" ? " · EXPIRED" : ""}</Text>
          <Text style={styles.body}>Public landmark: {request.landmark || "No landmark given"}</Text>
          <Text style={styles.meta}>Pin: {request.latitude.toFixed(5)}, {request.longitude.toFixed(5)}</Text>
          <Text style={styles.meta}>Requested {new Date(request.created_at).toLocaleString()}</Text>
          <Text style={styles.meta}>Expires {new Date(request.expires_at).toLocaleString()}</Text>
          <Text style={styles.body}>This check is answered by a person. Yonder does not verify that they are at the place or that their answer is correct.</Text>
        </View>
        {request.status === "answered" && <View style={styles.card}>
          <Text style={styles.label}>SELF-REPORTED ANSWER</Text>
          <Text style={styles.cardTitle}>{liveAnswerLabel(request)}</Text>
          {request.note ? <Text style={styles.body}>{request.note}</Text> : null}
          {request.answered_at ? <Text style={styles.meta}>Reported {new Date(request.answered_at).toLocaleString()}</Text> : null}
          {expired && <Text style={styles.body}>This observation is past its request window. Conditions may have changed.</Text>}
        </View>}
        {mine && !expired && (request.status === "open" || request.status === "claimed") && (confirmCancel ? <View style={styles.card}>
          <Text style={styles.cardTitle}>Cancel this check?</Text>
          <Text style={styles.body}>The open or claimed check will close for everyone.</Text>
          <PrimaryButton label="Cancel live check" variant="danger" disabled={busy} onPress={() => void act(() => cancelLiveRequest(request.id), "Check cancelled.")} />
          <PrimaryButton label="Keep check" variant="secondary" onPress={() => setConfirmCancel(false)} />
        </View> : <PrimaryButton label="Cancel this check" variant="secondary" onPress={() => setConfirmCancel(true)} />)}
        {!mine && !expired && request.status === "open" && <PrimaryButton label={busy ? "Claiming…" : "I can check this place"} disabled={busy} onPress={() => void act(() => claimLiveRequest(request.id), "Check claimed. Please answer from the place, or release it.")} />}
        {claimedByMe && !expired && request.status === "claimed" && <View style={styles.card}>
          <Text style={styles.cardTitle}>Share what you can see</Text>
          <Text style={styles.body}>Answer only if you are at this public place now. This is your own report; location is not verified.</Text>
          {request.question_kind === "queue" ? <>
            <TextInput accessibilityLabel="Estimated wait in minutes" keyboardType="number-pad" placeholder="Wait in minutes (0–240)" placeholderTextColor={ask.inkFaint} value={answer === "unsure" ? "" : answer} onChangeText={setAnswer} maxLength={3} style={styles.input} />
            <Choice label="Couldn’t tell" selected={answer === "unsure"} onPress={() => setAnswer("unsure")} />
          </> : <View style={styles.choices}>{(["yes", "no", "unsure"] as const).map((value) => <Choice key={value} label={value === "unsure" ? "Couldn’t tell" : value === "yes" ? "Yes" : "No"} selected={answer === value} onPress={() => setAnswer(value)} />)}</View>}
          <TextInput accessibilityLabel="Optional observation note" placeholder="Optional detail, no personal information" placeholderTextColor={ask.inkFaint} value={note} onChangeText={setNote} maxLength={280} multiline style={[styles.input, { minHeight: 85 }]} />
          <Text style={styles.meta}>{note.length}/280</Text>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: onSite }} onPress={() => setOnSite(!onSite)} style={styles.confirm}><Text style={styles.body}>{onSite ? "☑" : "□"} I am at this public place now. My answer is self-reported, not GPS verified.</Text></Pressable>
          <PrimaryButton label={busy ? "Sending…" : "Send observation"} disabled={busy} onPress={submitAnswer} />
          <PrimaryButton label="Release this check" variant="secondary" disabled={busy} onPress={() => void act(() => releaseLiveRequest(request.id), "Check released for another person.")} />
        </View>}
        {(!mine || otherUserId) && <View style={styles.card}>
          <Text style={styles.cardTitle}>Keep the pilot helpful</Text>
          {showReport ? <>
            {(["unsafe", "spam", ...(request.status === "answered" ? ["inaccurate"] : [])] as LiveReportReason[]).map((reason) => <Pressable key={reason} accessibilityRole="button" onPress={() => void act(() => reportLiveRequest(request.id, reason), "Report recorded.")} disabled={busy}><Text style={styles.link}>Report {reason}</Text></Pressable>)}
            <Pressable accessibilityRole="button" onPress={() => setShowReport(false)}><Text style={styles.link}>Close report options</Text></Pressable>
          </> : <Pressable accessibilityRole="button" onPress={() => setShowReport(true)}><Text style={styles.link}>Report this check</Text></Pressable>}
          {otherUserId && (confirmBlock ? <>
            <Text style={styles.body}>Block this participant? Their checks will be hidden from you.</Text>
            <PrimaryButton label="Block participant" variant="danger" disabled={busy} onPress={() => void act(() => blockLiveUser(otherUserId), "Participant blocked.", () => router.replace("/live"))} />
            <PrimaryButton label="Keep participant" variant="secondary" onPress={() => setConfirmBlock(false)} />
          </> : <Pressable accessibilityRole="button" onPress={() => setConfirmBlock(true)}><Text style={styles.link}>Block participant</Text></Pressable>)}
        </View>}
      </>}
    {liveConfigured && ready && user && <PrimaryButton label={loading ? "Refreshing…" : "Refresh check"} variant="secondary" disabled={loading} onPress={() => refreshRef.current()} />}
    {!!notice && <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </AppScreen>;
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.choice, selected && styles.selected]}><Text style={styles.choiceText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  title: { fontFamily: font.ui700, fontSize: 30, lineHeight: 37, color: ask.ink, marginBottom: 10 },
  question: { ...type.heading, color: ask.ink, marginBottom: 16 },
  map: { height: 170, overflow: "hidden", borderRadius: 16, backgroundColor: ask.surfaceAlt, marginBottom: 12 },
  body: { ...type.body, color: ask.inkSoft, marginBottom: 8 },
  label: { ...type.micro, color: ask.fresh },
  meta: { ...type.label, color: ask.inkSoft },
  card: { backgroundColor: ask.surface, borderColor: ask.border, borderWidth: 1, borderRadius: 18, padding: 20, gap: 10, marginVertical: 12 },
  cardTitle: { ...type.heading, color: ask.ink },
  input: { ...type.body, color: ask.ink, borderColor: ask.border, borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 52, textAlignVertical: "top" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderColor: ask.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selected: { borderColor: ask.ink, backgroundColor: ask.surfaceAlt },
  choiceText: { ...type.label, color: ask.ink },
  confirm: { paddingVertical: 10 },
  link: { ...type.label, color: ask.fresh, paddingVertical: 10 },
  notice: { ...type.body, color: ask.fresh, marginVertical: 10 },
  error: { ...type.body, color: ask.danger, marginVertical: 10 },
});
