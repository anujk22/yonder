import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { liveConfigured } from "@/lib/liveClient";
import { deleteLiveAccount, sendSignInCode, signOutLive, useLiveAuth, verifySignInCode } from "@/lib/liveAuth";
import { getPilotAccess, listLiveRequests } from "@/lib/liveApi";
import { LIVE_QUESTIONS, liveAnswerLabel, liveExpired, type LiveRequest } from "@/lib/liveTypes";
import { ask, font, type } from "@/lib/theme";

type Board = { userId: string; access: boolean; requests: LiveRequest[] };

export default function LiveHome() {
  const userId = useLiveAuth((state) => state.user?.id);
  return <LiveHomeSession key={userId ?? "signed-out"} />;
}

function LiveHomeSession() {
  const router = useRouter();
  const focused = useIsFocused();
  const user = useLiveAuth((state) => state.user);
  const userId = user?.id;
  const ready = useLiveAuth((state) => state.ready);
  const authError = useLiveAuth((state) => state.error);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
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
  const sendCode = () => {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) { setError("Enter a valid email address."); return; }
    setAuthNotice("");
    void accountAction(async () => { await sendSignInCode(address); if (mounted.current) { setCodeSent(true); setAuthNotice("Check your email for the latest code."); } });
  };
  const verifyCode = () => {
    if (!/^\d{6,10}$/.test(code.trim())) { setError("Enter the code from your email."); return; }
    void accountAction(async () => { await verifySignInCode(email.trim().toLowerCase(), code.trim()); if (mounted.current) setCode(""); });
  };

  const current = board && board.userId === userId ? board : null;
  const mine = current?.requests.filter((request) => request.requester_id === user?.id || request.observer_id === user?.id) ?? [];
  const available = current?.requests.filter((request) => request.status === "open" && request.requester_id !== userId && !liveExpired(request)) ?? [];

  return <AppScreen>
    <ScreenHeader eyebrow="INVITED LIVE PILOT" />
    <Text accessibilityRole="header" style={styles.title}>Ask someone already there.</Text>
    <Text style={styles.body}>Free during this small invited pilot. Checks are self-reported by another person; a response is not guaranteed. The local demo is separate.</Text>
    {!liveConfigured ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Live checks are not connected in this build.</Text>
      <Text style={styles.body}>You can still explore the full local demo without an account.</Text>
      <PrimaryButton label="Explore the local demo" onPress={() => router.push("/observe")} />
    </View> : !ready ? <Text style={styles.body}>Checking account…</Text> : !user ? <View style={styles.card}>
      <Text style={styles.cardTitle}>Sign in with your invited email</Text>
      <Text style={styles.body}>We’ll send a one-time code. An invitation is needed to use live checks.</Text>
      <TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} editable={!busy && !codeSent} placeholder="you@example.com" placeholderTextColor={ask.inkFaint} style={styles.input} />
      {codeSent && <TextInput accessibilityLabel="One-time email code" autoComplete="one-time-code" keyboardType="number-pad" value={code} onChangeText={setCode} maxLength={10} placeholder="Email code" placeholderTextColor={ask.inkFaint} style={styles.input} />}
      <PrimaryButton label={codeSent ? "Verify code" : "Send code"} onPress={codeSent ? verifyCode : sendCode} disabled={busy} />
      {codeSent && <Pressable accessibilityRole="button" onPress={sendCode} disabled={busy}><Text style={styles.link}>Resend code</Text></Pressable>}
      {codeSent && <Pressable accessibilityRole="button" onPress={() => { setCodeSent(false); setCode(""); setError(""); }}><Text style={styles.link}>Use another email</Text></Pressable>}
      {!!authNotice && <Text accessibilityRole="alert" style={styles.meta}>{authNotice}</Text>}
      <PrimaryButton label="Back to local demo" variant="secondary" onPress={() => router.push("/observe")} />
    </View> : <>
      <Text style={styles.meta}>Signed in as {user.email ?? "invited member"}</Text>
      {!current && !error ? <Text style={styles.body}>Checking your invitation…</Text> : null}
      {!current && error ? <PrimaryButton label="Retry live checks" variant="secondary" onPress={() => refreshRef.current()} /> : null}
      {current && !current.access ? <View style={styles.card}>
        <Text style={styles.cardTitle}>Your invitation is not active yet.</Text>
        <Text style={styles.body}>Live checks are limited to invited members. You can keep using the local demo.</Text>
        <PrimaryButton label="Check invitation again" variant="secondary" onPress={() => refreshRef.current()} />
      </View> : null}
      {current?.access && <>
        <PrimaryButton label="Request a live check" onPress={() => router.push("/")} />
        <Text style={styles.meta}>Choose a place from Explore, then select “Request an invited live check.”</Text>
        <View style={styles.sectionRow}><Text style={styles.sectionTitle}>My checks</Text><Pressable accessibilityRole="button" onPress={() => refreshRef.current()} disabled={loading}><Text style={styles.link}>{loading ? "Refreshing…" : "Refresh"}</Text></Pressable></View>
        {mine.length ? mine.map((request) => <RequestRow key={request.id} request={request} onPress={() => router.push(`/live/${request.id}`)} />) : <Text style={styles.body}>No live checks yet. Start with a place you’re curious about.</Text>}
        <Text style={styles.sectionTitle}>Available checks</Text>
        <Text style={styles.meta}>Recent open checks in this invited pilot; these are not sorted by your distance.</Text>
        {available.length ? available.map((request) => <RequestRow key={request.id} request={request} onPress={() => router.push(`/live/${request.id}`)} />) : <Text style={styles.body}>No open checks to help with right now. Check back later.</Text>}
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
    {!!(error || authError) && <Text accessibilityRole="alert" style={styles.error}>{error || authError}</Text>}
  </AppScreen>;
}

function RequestRow({ request, onPress }: { request: LiveRequest; onPress: () => void }) {
  const status = request.status === "answered" ? liveAnswerLabel(request) : liveExpired(request) ? "Expired" : request.status === "claimed" ? "Claimed" : request.status === "cancelled" ? "Cancelled" : "Open";
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
    <Text style={styles.meta}>{status.toUpperCase()} · {new Date(request.created_at).toLocaleString()}</Text>
    <Text style={styles.cardTitle}>{request.place_name}</Text>
    <Text style={styles.body}>{LIVE_QUESTIONS[request.question_kind]}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  title: { fontFamily: font.ui700, fontSize: 30, lineHeight: 37, color: ask.ink, marginBottom: 12 },
  body: { ...type.body, color: ask.inkSoft, marginBottom: 12 },
  card: { backgroundColor: ask.surface, borderColor: ask.border, borderWidth: 1, borderRadius: 18, padding: 20, gap: 10, marginVertical: 12 },
  cardTitle: { ...type.heading, color: ask.ink },
  input: { ...type.body, color: ask.ink, borderColor: ask.border, borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 52 },
  link: { ...type.label, color: ask.fresh, paddingVertical: 10 },
  meta: { ...type.label, color: ask.inkSoft, marginVertical: 8 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 },
  sectionTitle: { ...type.heading, color: ask.ink, marginTop: 24, marginBottom: 8 },
  account: { marginTop: 28, gap: 12 },
  deleteLink: { ...type.label, color: ask.danger, paddingVertical: 12 },
  error: { ...type.body, color: ask.danger, marginVertical: 12 },
});
