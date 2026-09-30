import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { MapSurface, detailRegion } from "@/components/MapSurface";
import { cancelLiveRequest, claimLiveRequest, getLiveRequest, getPilotAccess, releaseLiveRequest, answerLiveRequest, reportLiveRequest, blockLiveUser } from "@/lib/liveApi";
import { useLiveAuth } from "@/lib/liveAuth";
import { useActiveTheme } from "@/lib/store";
import { LiveSignIn } from "@/components/LiveSignIn";
import { liveConfigured } from "@/lib/liveClient";
import { validLiveAnswer } from "@/lib/livePolicy";
import { LIVE_QUESTIONS, liveAnswerLabel, liveExpired, timeAgo, timeLeft, type LiveReportReason, type LiveRequest } from "@/lib/liveTypes";
import { FreshnessLabel } from "@/components/FreshnessLabel";
import { font, type, type AppTheme } from "@/lib/theme";

type Detail = { userId: string; id: string; access: boolean; request: LiveRequest | null };

export default function LiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useLiveAuth((state) => state.user?.id);
  return <LiveDetailSession key={`${userId ?? "signed-out"}:${id ?? "none"}`} id={id ?? ""} />;
}

function LiveDetailSession({ id }: { id: string }) {
  const theme = useActiveTheme();
  const styles = detailStyles(theme);
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
  const [showSafety, setShowSafety] = useState(false);
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
    void act(() => answerLiveRequest(request.id, answer, note), "Sent. Thanks for being someone’s eyes.");
  };

  return <AppScreen>
    <ScreenHeader eyebrow="PLACE CHECK" right={liveConfigured && ready && user ? <Pressable accessibilityRole="button" onPress={() => refreshRef.current()} disabled={loading} hitSlop={10}><Text style={styles.link}>{loading ? "Refreshing…" : "Refresh"}</Text></Pressable> : undefined} />
    {!liveConfigured ? <View style={styles.card}><Text style={styles.body}>Live checks are not connected in this build.</Text><PrimaryButton label="Explore places" onPress={() => router.replace("/")} /></View>
      : !ready ? <Text style={styles.body}>Checking account…</Text>
      : !user ? <View style={styles.card}><Text style={styles.body}>Sign in or create a free account to view this shared check.</Text><LiveSignIn /></View>
      : !current ? <Text style={styles.body}>Loading live check…</Text>
      : !current.access ? <View style={styles.card}><Text style={styles.body}>Community checks are unavailable for your account.</Text><PrimaryButton label="Your requests" onPress={() => router.push("/live")} /></View>
      : !request ? <View style={styles.card}><Text style={styles.body}>This check is unavailable. It may have been removed or hidden.</Text><PrimaryButton label="See live checks" onPress={() => router.push("/live")} /></View>
      : <>
        <Text accessibilityRole="header" style={styles.title}>{request.place_name}</Text>
        <Text style={styles.question}>{LIVE_QUESTIONS[request.question_kind]}</Text>
        <View style={styles.map}>
          <MapSurface style={StyleSheet.absoluteFill} initialRegion={detailRegion({ latitude: request.latitude, longitude: request.longitude })} markers={[{ id: request.id, coordinate: { latitude: request.latitude, longitude: request.longitude }, label: request.place_name }]} />
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>{request.status === "answered" ? "ANSWERED" : request.status === "cancelled" ? "CANCELLED" : expired ? "CLOSED" : request.status === "claimed" ? "SOMEONE’S CHECKING" : "OPEN"}</Text>
          {request.landmark ? <Text style={styles.body}>Near {request.landmark}</Text> : null}
          <Text style={styles.meta}>Asked {timeAgo(request.created_at)}{!expired && (request.status === "open" || request.status === "claimed") ? ` · ${timeLeft(request)}` : ""}</Text>
        </View>
        {request.status === "answered" && <View style={styles.card}>
          <Text style={styles.label}>SELF-REPORTED ANSWER</Text>
          <Text style={styles.answer}>{liveAnswerLabel(request)}</Text>
          {request.note ? <Text style={styles.body}>“{request.note}”</Text> : null}
          {request.answered_at ? <FreshnessLabel observedAt={Date.parse(request.answered_at)} ttlSeconds={30 * 60} prefix="Seen " /> : null}
        </View>}
        {mine && !expired && (request.status === "open" || request.status === "claimed") && (confirmCancel ? <View style={styles.card}>
          <Text style={styles.cardTitle}>Cancel this check?</Text>
          <Text style={styles.body}>The open or claimed check will close for everyone.</Text>
          <PrimaryButton label="Cancel live check" variant="danger" disabled={busy} onPress={() => void act(() => cancelLiveRequest(request.id), "Check cancelled.")} />
          <PrimaryButton label="Keep check" variant="secondary" onPress={() => setConfirmCancel(false)} />
        </View> : <>
          {request.status === "open" && <PrimaryButton label="Ask a friend who’s nearby" onPress={() => void Share.share({ message: `Are you near ${request.place_name}? ${LIVE_QUESTIONS[request.question_kind]} Answer on Yonder: ${Linking.createURL(`/live/${request.id}`)}` }).catch(() => undefined)} />}
          <PrimaryButton label="Cancel this check" variant="secondary" onPress={() => setConfirmCancel(true)} />
        </>)}
        {!mine && !expired && request.status === "open" && <PrimaryButton label={busy ? "Claiming…" : "I can check this place"} disabled={busy} onPress={() => void act(() => claimLiveRequest(request.id), "It’s yours. Answer from the spot, or release it for someone else.")} />}
        {claimedByMe && !expired && request.status === "claimed" && <View style={styles.card}>
          <Text style={styles.cardTitle}>Share what you can see</Text>
          <Text style={styles.body}>Only answer if you’re there right now.</Text>
          {request.question_kind === "queue" ? <>
            <TextInput accessibilityLabel="Estimated wait in minutes" keyboardType="number-pad" placeholder="Wait in minutes (0–240)" placeholderTextColor={theme.inkFaint} value={answer === "unsure" ? "" : answer} onChangeText={setAnswer} maxLength={3} style={styles.input} />
            <Choice label="Couldn’t tell" selected={answer === "unsure"} onPress={() => setAnswer("unsure")} />
          </> : <View style={styles.choices}>{(["yes", "no", "unsure"] as const).map((value) => <Choice key={value} label={value === "unsure" ? "Couldn’t tell" : value === "yes" ? "Yes" : "No"} selected={answer === value} onPress={() => setAnswer(value)} />)}</View>}
          <TextInput accessibilityLabel="Optional observation note" placeholder="Optional detail, no personal information" placeholderTextColor={theme.inkFaint} value={note} onChangeText={setNote} maxLength={280} multiline style={[styles.input, { minHeight: 85 }]} />
          <Text style={styles.meta}>{note.length}/280</Text>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: onSite }} onPress={() => setOnSite(!onSite)} style={styles.confirm}><Text style={styles.body}>{onSite ? "☑" : "□"} I’m at this place right now.</Text></Pressable>
          <PrimaryButton label={busy ? "Sending…" : "Send observation"} disabled={busy} onPress={submitAnswer} />
          <PrimaryButton label="Release this check" variant="secondary" disabled={busy} onPress={() => void act(() => releaseLiveRequest(request.id), "Check released for another person.")} />
        </View>}
        {(!mine || otherUserId) && (showSafety ? <View style={styles.card}>
          <Text style={styles.cardTitle}>Something wrong?</Text>
          {showReport ? <>
            {(["unsafe", "spam", ...(request.status === "answered" ? ["inaccurate"] : [])] as LiveReportReason[]).map((reason) => <Pressable key={reason} accessibilityRole="button" onPress={() => void act(() => reportLiveRequest(request.id, reason), "Thanks. We hid this check while we review it.")} disabled={busy}><Text style={styles.link}>Report as {reason}</Text></Pressable>)}
          </> : <Pressable accessibilityRole="button" onPress={() => setShowReport(true)}><Text style={styles.link}>Report this check</Text></Pressable>}
          {otherUserId && (confirmBlock ? <>
            <Text style={styles.body}>Block this person? You won’t see each other’s checks.</Text>
            <PrimaryButton label="Block" variant="danger" disabled={busy} onPress={() => void act(() => blockLiveUser(otherUserId), "Blocked.", () => router.replace("/activity"))} />
            <PrimaryButton label="Cancel" variant="secondary" onPress={() => setConfirmBlock(false)} />
          </> : <Pressable accessibilityRole="button" onPress={() => setConfirmBlock(true)}><Text style={styles.link}>Block this person</Text></Pressable>)}
          <Pressable accessibilityRole="button" onPress={() => { setShowSafety(false); setShowReport(false); setConfirmBlock(false); }}><Text style={styles.muted}>Close</Text></Pressable>
        </View> : <Pressable accessibilityRole="button" onPress={() => setShowSafety(true)} style={styles.safetyToggle}><Text style={styles.muted}>Report or block</Text></Pressable>)}
        <Text style={styles.footnote}>Answered by a person on the spot. Yonder doesn’t verify their location or answer.</Text>
      </>}
    {!!notice && <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </AppScreen>;
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = detailStyles(useActiveTheme());
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.choice, selected && styles.selected]}><Text style={styles.choiceText}>{label}</Text></Pressable>;
}

const detailStyles = (theme: AppTheme) => StyleSheet.create({
  title: { fontFamily: font.ui700, fontSize: 30, lineHeight: 37, color: theme.ink, marginBottom: 10 },
  question: { ...type.heading, color: theme.ink, marginBottom: 16 },
  map: { height: 170, overflow: "hidden", borderRadius: 16, backgroundColor: theme.surfaceAlt, marginBottom: 12 },
  body: { ...type.body, color: theme.inkSoft, marginBottom: 8 },
  label: { ...type.micro, color: theme.fresh },
  meta: { ...type.label, color: theme.inkSoft },
  card: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 18, padding: 20, gap: 10, marginVertical: 12 },
  cardTitle: { ...type.heading, color: theme.ink },
  input: { ...type.body, color: theme.ink, borderColor: theme.border, borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 52, textAlignVertical: "top" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: { borderColor: theme.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  selected: { borderColor: theme.ink, backgroundColor: theme.surfaceAlt },
  choiceText: { ...type.label, color: theme.ink },
  confirm: { paddingVertical: 10 },
  link: { ...type.label, color: theme.fresh, paddingVertical: 10 },
  muted: { ...type.label, color: theme.inkSoft, paddingVertical: 10 },
  safetyToggle: { alignSelf: "center", marginTop: 8 },
  answer: { fontFamily: font.ui700, fontSize: 30, lineHeight: 36, color: theme.ink },
  footnote: { ...type.label, fontSize: 11, color: theme.inkFaint, textAlign: "center", marginTop: 18 },
  notice: { ...type.body, color: theme.fresh, marginVertical: 10 },
  error: { ...type.body, color: theme.danger, marginVertical: 10 },
});
