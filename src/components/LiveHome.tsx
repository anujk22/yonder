import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { BrandObject } from "@/components/BrandObject";
import { MotionPressable } from "@/components/MotionPressable";
import { LiveSignIn } from "@/components/LiveSignIn";
import { liveConfigured } from "@/lib/liveClient";
import { useLiveAuth } from "@/lib/liveAuth";
import { useKnownPosition } from "@/lib/location";
import { distanceMeters } from "@/lib/geo";
import { DEMO_FEATURES_ENABLED } from "@/lib/previewFeatures";
import { useActiveTheme } from "@/lib/store";
import { getPilotAccess, listLiveRequests } from "@/lib/liveApi";
import { distanceLabel, LIVE_QUESTIONS, liveAnswerLabel, liveExpired, sortByDistance, timeAgo, timeLeft, type LiveRequest } from "@/lib/liveTypes";
import { font, type, type AppTheme } from "@/lib/theme";

type Board = { userId: string; access: boolean; requests: LiveRequest[] };

export default function LiveHome({ view = "requests" }: { view?: "requests" | "scout" }) {
  const userId = useLiveAuth((state) => state.user?.id);
  return <LiveHomeSession key={userId ?? "signed-out"} view={view} />;
}

function LiveHomeSession({ view }: { view: "requests" | "scout" }) {
  const styles = boardStyles(useActiveTheme());
  const router = useRouter();
  const focused = useIsFocused();
  const user = useLiveAuth((state) => state.user);
  const userId = user?.id;
  const ready = useLiveAuth((state) => state.ready);
  const authError = useLiveAuth((state) => state.error);
  const position = useKnownPosition();
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!focused) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [focused]);

  useEffect(() => {
    if (!liveConfigured || !userId || !focused || !foreground) return;
    let active = true;
    let requestNumber = 0;
    const refresh = async () => {
      const request = ++requestNumber;
      setLoading(true);
      setError("");
      try {
        const access = await getPilotAccess();
        const requests = access ? await listLiveRequests() : [];
        if (active && request === requestNumber) { setBoard({ userId, access, requests }); setNow(Date.now()); }
      } catch (cause) {
        if (active && request === requestNumber) setError(cause instanceof Error ? cause.message : "Couldn’t load live checks.");
      } finally {
        if (active && request === requestNumber) setLoading(false);
      }
    };
    refreshRef.current = () => { void refresh(); };
    void refresh();
    const timer = setInterval(refresh, 15_000);
    return () => { active = false; clearInterval(timer); refreshRef.current = () => {}; };
  }, [userId, focused, foreground]);

  const current = board && board.userId === userId ? board : null;
  const live = (request: LiveRequest) => (request.status === "open" || request.status === "claimed") && !liveExpired(request, now);
  const asked = current?.requests.filter((request) => request.requester_id === userId) ?? [];
  const waiting = asked.filter(live);
  const past = asked.filter((request) => !live(request));
  const claimed = current?.requests.filter((request) => request.observer_id === userId && live(request)) ?? [];
  const available = sortByDistance(current?.requests.filter((request) => request.status === "open" && request.requester_id !== userId && !liveExpired(request, now)) ?? [], position);
  const scout = view === "scout";
  const open = (request: LiveRequest) => router.push(scout ? `/live/${request.id}?from=scout` : `/live/${request.id}`);
  const row = (request: LiveRequest) => <RequestRow key={request.id} request={request} now={now} distance={scout && position ? distanceMeters(position, request) : null} onPress={() => open(request)} />;

  return <AppScreen>
    <ScreenHeader eyebrow={scout ? "SCOUT" : "YOUR CHECKS"} right={current?.access ? <Pressable accessibilityRole="button" accessibilityLabel="Refresh" onPress={() => refreshRef.current()} disabled={loading} hitSlop={10}><Text style={styles.link}>{loading ? "Refreshing…" : "Refresh"}</Text></Pressable> : undefined} />
    <View style={styles.hero}>
      <Text accessibilityRole="header" numberOfLines={scout ? undefined : 1} adjustsFontSizeToFit={!scout} minimumFontScale={0.75} style={[styles.title, { flex: 1 }]}>{scout ? "Be someone’s eyes." : "Ask someone already there."}</Text>
      {scout && <BrandObject kind="scout" size={86} playful />}
    </View>
    {!liveConfigured ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Community checks aren’t connected in this build.</Text>
      {DEMO_FEATURES_ENABLED && <PrimaryButton label="Try a practice check" onPress={() => router.push(scout ? "/observe?demo=1" : "/activity?demo=1")} />}
    </View> : !ready ? <Text style={styles.body}>Checking your account…</Text> : !user ? <>
      <Text style={styles.body}>{scout ? "Answer quick questions about places you’re already at. It takes a couple of taps." : "Pick a place, ask a quick question, and someone nearby can answer."} A free account keeps it safe. Your email is never shown.</Text>
      <LiveSignIn />
    </> : <>
      {!current && !error ? <Text style={styles.body}>Loading checks…</Text> : null}
      {!current && error ? <PrimaryButton label="Try again" variant="secondary" onPress={() => refreshRef.current()} /> : null}
      {current && !current.access ? <View style={styles.card}>
        <Text style={styles.cardTitle}>Community checks are unavailable for your account.</Text>
        <Text style={styles.body}>Contact support if you need help.</Text>
        <PrimaryButton label="Check again" variant="secondary" onPress={() => refreshRef.current()} />
      </View> : null}
      {current?.access && !scout && <>
        <PrimaryButton label="Ask about a place" onPress={() => router.navigate("/")} />
        <Text style={styles.hint}>Pick any place on the map, then tap “Ask for a free place check.”</Text>
        {waiting.length > 0 && <Text style={styles.section}>Waiting for an answer</Text>}
        {waiting.map(row)}
        {past.length > 0 && <Text style={styles.section}>Answered and closed</Text>}
        {past.map(row)}
        {!asked.length && <Empty art="chat" title="No checks yet." body="Your questions and their answers will show up here." />}
      </>}
      {current?.access && scout && <>
        {claimed.length > 0 && <Text style={styles.section}>You’re checking</Text>}
        {claimed.map(row)}
        <Text style={styles.section}>{position ? "Open checks near you" : "Open checks"}</Text>
        {available.map(row)}
        {!available.length && <Empty art="map" title="No open checks right now." body="When someone asks about a place, it shows up here. Ask one yourself to get things moving." />}
        {!available.length && DEMO_FEATURES_ENABLED && <PrimaryButton label="Try a practice check" variant="secondary" onPress={() => router.push("/observe?demo=1")} />}
      </>}
    </>}
    {!!(error || authError) && <Text accessibilityRole="alert" style={styles.error}>{error || authError}</Text>}
    {liveConfigured && user && <Text style={styles.footnote}>Answers are self-reported by people and aren’t verified by Yonder.</Text>}
  </AppScreen>;
}

function Empty({ art, title, body }: { art: "chat" | "map"; title: string; body: string }) {
  const styles = boardStyles(useActiveTheme());
  return <View style={styles.empty}>
    <BrandObject kind={art} size={110} />
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={[styles.body, { textAlign: "center" }]}>{body}</Text>
  </View>;
}

function RequestRow({ request, now, distance, onPress }: { request: LiveRequest; now: number; distance: number | null; onPress: () => void }) {
  const theme = useActiveTheme();
  const styles = boardStyles(theme);
  const expired = liveExpired(request, now);
  const [label, color] = request.status === "answered" ? ["Answered", theme.fresh]
    : request.status === "cancelled" ? ["Cancelled", theme.inkFaint]
    : expired ? ["Closed", theme.inkFaint]
    : request.status === "claimed" ? ["Someone’s checking", theme.aging]
    : ["Open", theme.fresh];
  return <MotionPressable accessibilityRole="button" accessibilityLabel={`${request.place_name}. ${LIVE_QUESTIONS[request.question_kind]} ${label}`} onPress={onPress} style={styles.card}>
    <View style={styles.rowTop}>
      <Text style={[styles.chip, { color, borderColor: color }]}>{label}</Text>
      <Text style={styles.meta}>{[distance !== null ? distanceLabel(distance) : null, timeAgo(request.created_at, now)].filter(Boolean).join(" · ")}</Text>
    </View>
    <Text style={styles.cardTitle}>{request.place_name}</Text>
    <Text style={styles.question}>{LIVE_QUESTIONS[request.question_kind]}</Text>
    {request.status === "answered"
      ? <Text style={styles.answer}>{liveAnswerLabel(request)}{request.answered_at ? <Text style={styles.meta}>  ·  {timeAgo(request.answered_at, now)}</Text> : null}</Text>
      : !expired && request.status !== "cancelled" ? <Text style={styles.meta}>{timeLeft(request, now)}</Text> : null}
  </MotionPressable>;
}

const boardStyles = (theme: AppTheme) => StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  title: { fontFamily: font.ui700, fontSize: 30, lineHeight: 36, letterSpacing: -1, color: theme.ink },
  body: { ...type.body, color: theme.inkSoft, marginBottom: 10 },
  hint: { ...type.label, color: theme.inkSoft, marginTop: 10, marginBottom: 4, lineHeight: 19 },
  card: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 18, padding: 18, gap: 6, marginVertical: 6 },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 },
  chip: { ...type.micro, fontSize: 10, borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, overflow: "hidden" },
  cardTitle: { ...type.heading, color: theme.ink },
  question: { ...type.body, color: theme.inkSoft },
  answer: { fontFamily: font.ui700, fontSize: 17, color: theme.fresh, marginTop: 2 },
  link: { ...type.label, color: theme.fresh },
  meta: { ...type.label, color: theme.inkSoft },
  section: { ...type.micro, color: theme.inkSoft, marginTop: 26, marginBottom: 6 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 24 },
  error: { ...type.body, color: theme.danger, marginVertical: 12 },
  footnote: { ...type.label, fontSize: 11, color: theme.inkFaint, textAlign: "center", marginTop: 28 },
});
