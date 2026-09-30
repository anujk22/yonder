import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { LiveSignIn } from "@/components/LiveSignIn";
import { liveConfigured } from "@/lib/liveClient";
import { deleteLiveAccount, signOutLive, useLiveAuth } from "@/lib/liveAuth";
import { DEMO_FEATURES_ENABLED } from "@/lib/previewFeatures";
import { useActiveTheme } from "@/lib/store";
import { getPilotAccess, listLiveRequests } from "@/lib/liveApi";
import { LIVE_QUESTIONS, liveAnswerLabel, liveExpired, type LiveRequest } from "@/lib/liveTypes";
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
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [busy, setBusy] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
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
        if (active && request === requestNumber) setBoard({ userId, access, requests });
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

  const accountAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try { await action(); }
    catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "Please try again."); }
    finally { if (mounted.current) setBusy(false); }
  };
  const current = board && board.userId === userId ? board : null;
  const mine = current?.requests.filter((request) => request.requester_id === user?.id || request.observer_id === user?.id) ?? [];
  const available = current?.requests.filter((request) => request.status === "open" && request.requester_id !== userId && !liveExpired(request)) ?? [];

  return <AppScreen>
    <ScreenHeader eyebrow={view === "scout" ? "SCOUT · COMMUNITY CHECKS" : "YOUR REQUESTS"} />
    <Text accessibilityRole="header" style={styles.title}>{view === "scout" ? "Be someone’s eyes." : "Ask someone already there."}</Text>
    <Text style={styles.body}>Free place checks shared with the community. Answers are self-reported by another person; a response is not guaranteed.</Text>
    {!liveConfigured ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Live checks are not connected in this build.</Text>
      <Text style={styles.body}>You can still explore the full local demo without an account.</Text>
      <PrimaryButton label="Explore the local demo" onPress={() => router.push("/observe")} />
    </View> : !ready ? <Text style={styles.body}>Checking account…</Text> : !user ? <LiveSignIn /> : <>
      <Text style={styles.meta}>Signed in as {user.email ?? "community member"}</Text>
      {!current && !error ? <Text style={styles.body}>Checking your account…</Text> : null}
      {!current && error ? <PrimaryButton label="Retry live checks" variant="secondary" onPress={() => refreshRef.current()} /> : null}
      {current && !current.access ? <View style={styles.card}>
        <Text style={styles.cardTitle}>Community checks are unavailable for your account.</Text>
        <Text style={styles.body}>Contact support if you need help accessing community checks.</Text>
        <PrimaryButton label="Check access again" variant="secondary" onPress={() => refreshRef.current()} />
      </View> : null}
      {current?.access && <>
        {view === "requests" && <><PrimaryButton label="Request a live check" onPress={() => router.push("/")} />
        <Text style={styles.meta}>Choose a place from Explore, then select “Ask for a free place check.”</Text>
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>My checks</Text><Pressable accessibilityRole="button" onPress={() => refreshRef.current()} disabled={loading}><Text style={styles.link}>{loading ? "Refreshing…" : "Refresh"}</Text></Pressable></View>
        {mine.length ? mine.map((request) => <RequestRow key={request.id} request={request} onPress={() => router.push(`/live/${request.id}`)} />) : <Text style={styles.body}>No live checks yet. Start with a place you’re curious about.</Text>}
        </>}
        {view === "scout" && <>
        <Text style={styles.sectionTitle}>My claimed checks</Text>
        {mine.filter((request) => request.observer_id === userId).map((request) => <RequestRow key={request.id} request={request} onPress={() => router.push(`/live/${request.id}?from=scout`)} />)}
        <Text style={styles.sectionTitle}>Available checks</Text>
        <Text style={styles.meta}>Recent open community checks; these are not sorted by your distance.</Text>
        {available.length ? available.map((request) => <RequestRow key={request.id} request={request} onPress={() => router.push(`/live/${request.id}?from=scout`)} />) : <Text style={styles.body}>No open checks to help with right now. Check back later.</Text>}
        </>}
      </>}
      <View style={styles.account}>
        <PrimaryButton label="Sign out" variant="secondary" onPress={() => void accountAction(signOutLive)} disabled={busy} />
        {confirmDelete ? <View style={styles.card}>
          <Text style={styles.cardTitle}>Delete your live account?</Text>
          <Text style={styles.body}>This removes your account and its live checks. This cannot be undone.</Text>
          <PrimaryButton label="Delete my live account" variant="danger" onPress={() => void accountAction(async () => { await deleteLiveAccount(); if (mounted.current) setConfirmDelete(false); })} disabled={busy} />
          <PrimaryButton label="Keep my account" variant="secondary" onPress={() => setConfirmDelete(false)} />
        </View> : <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)}><Text style={styles.deleteLink}>Delete live account</Text></Pressable>}
      </View>
    </>}
    {DEMO_FEATURES_ENABLED && <PrimaryButton label="Explore the local demo" variant="secondary" onPress={() => router.push(view === "scout" ? "/observe?demo=1" : "/activity?demo=1")} />}
    {!!(error || authError) && <Text accessibilityRole="alert" style={styles.error}>{error || authError}</Text>}
  </AppScreen>;
}

function RequestRow({ request, onPress }: { request: LiveRequest; onPress: () => void }) {
  const styles = boardStyles(useActiveTheme());
  const status = request.status === "answered" ? liveAnswerLabel(request) : liveExpired(request) ? "Expired" : request.status === "claimed" ? "Claimed" : request.status === "cancelled" ? "Cancelled" : "Open";
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
    <Text style={styles.meta}>{status.toUpperCase()} · {new Date(request.created_at).toLocaleString()}</Text>
    <Text style={styles.cardTitle}>{request.place_name}</Text>
    <Text style={styles.body}>{LIVE_QUESTIONS[request.question_kind]}</Text>
  </Pressable>;
}

const boardStyles = (theme: AppTheme) => StyleSheet.create({
  title: { fontFamily: font.ui700, fontSize: 30, lineHeight: 37, color: theme.ink, marginBottom: 12 },
  body: { ...type.body, color: theme.inkSoft, marginBottom: 12 },
  card: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 18, padding: 20, gap: 10, marginVertical: 12 },
  cardTitle: { ...type.heading, color: theme.ink },
  link: { ...type.label, color: theme.fresh, paddingVertical: 10 },
  meta: { ...type.label, color: theme.inkSoft, marginVertical: 8 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 },
  sectionTitle: { ...type.heading, color: theme.ink, marginTop: 24, marginBottom: 8 },
  account: { marginTop: 28, gap: 12 },
  deleteLink: { ...type.label, color: theme.danger, paddingVertical: 12 },
  error: { ...type.body, color: theme.danger, marginVertical: 12 },
});
