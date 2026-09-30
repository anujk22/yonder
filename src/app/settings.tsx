import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { LiveSignIn } from "@/components/LiveSignIn";
import { liveConfigured } from "@/lib/liveClient";
import { deleteLiveAccount, signOutLive, useLiveAuth } from "@/lib/liveAuth";
import { manageSubscription, purchasesAvailable, restorePurchase, hasPlus } from "@/lib/purchases";
import { usePurchaseStore } from "@/lib/purchaseStore";
import { useOnboarding } from "@/lib/onboarding";
import { useActiveTheme } from "@/lib/store";
import { font, type, type AppTheme } from "@/lib/theme";

export default function SettingsScreen() {
  const theme = useActiveTheme();
  const styles = settingsStyles(theme);
  const router = useRouter();
  const user = useLiveAuth((s) => s.user);
  const ready = useLiveAuth((s) => s.ready);
  const plus = usePurchaseStore((s) => s.plus);
  const purchaseError = usePurchaseStore((s) => s.error);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = async (action: () => Promise<string | void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const done = await action();
      if (done) setMessage(done);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally { setBusy(false); }
  };

  return <AppScreen>
    <ScreenHeader eyebrow="SETTINGS" />
    <Text accessibilityRole="header" style={styles.title}>Your Yonder</Text>

    {liveConfigured && (ready && !user ? <View style={{ marginTop: 16 }}><LiveSignIn /></View> : <View style={styles.section}>
      <Text style={styles.label}>ACCOUNT</Text>
      {!ready || !user ? <Text style={styles.body}>Checking account…</Text> : <>
        <Text style={styles.value}>{user.email ?? "Community member"}</Text>
        <Text style={styles.body}>Your email is never shown to other members.</Text>
        <PrimaryButton label="Sign out" variant="secondary" disabled={busy} onPress={() => void run(async () => { await signOutLive(); })} />
        {confirmDelete ? <View style={styles.confirm}>
          <Text style={styles.value}>Delete your account?</Text>
          <Text style={styles.body}>This removes your account and all of its checks. It cannot be undone. An active Plus subscription is managed separately by your store account.</Text>
          <PrimaryButton label="Delete my account" variant="danger" disabled={busy} onPress={() => void run(async () => { await deleteLiveAccount(); setConfirmDelete(false); return "Your account was deleted."; })} />
          <PrimaryButton label="Keep my account" variant="secondary" onPress={() => setConfirmDelete(false)} />
        </View> : <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} style={styles.row}><Text style={styles.danger}>Delete account</Text></Pressable>}
      </>}
    </View>)}

    <View style={styles.section}>
      <Text style={styles.label}>YONDER PLUS</Text>
      <Text style={styles.value}>{plus ? "Plus is active" : "Free plan"}</Text>
      <Text style={styles.body}>{plus ? "Longer check windows, more open checks and unlimited collections." : "Asking and answering are always free. Plus is for people who check a lot."}</Text>
      <PrimaryButton label={plus ? "See your Plus benefits" : "Explore Yonder Plus"} variant={plus ? "secondary" : "primary"} onPress={() => router.push("/plus")} />
      {purchasesAvailable && <PrimaryButton label="Restore purchases" variant="secondary" disabled={busy} onPress={() => void run(async () => {
        const info = await restorePurchase();
        usePurchaseStore.getState().accept(info);
        return hasPlus(info) ? "Plus restored." : "No Plus subscription was found for this store account.";
      })} />}
      {purchasesAvailable && plus && <Pressable accessibilityRole="button" onPress={() => void run(async () => { await manageSubscription(); })} style={styles.row}><Text style={styles.link}>Manage subscription</Text></Pressable>}
      {Boolean(purchaseError) && <Text style={styles.error}>{purchaseError}</Text>}
    </View>

    <View style={styles.section}>
      <Text style={styles.label}>HELP</Text>
      <Pressable accessibilityRole="button" onPress={() => { useOnboarding.getState().reset(); router.replace("/"); }} style={styles.row}><Text style={styles.link}>Replay the intro</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/about")} style={styles.row}><Text style={styles.link}>How Yonder works</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://yonder.expo.app/privacy")} style={styles.row}><Text style={styles.link}>Privacy policy ↗</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://yonder.expo.app/support")} style={styles.row}><Text style={styles.link}>Support ↗</Text></Pressable>
    </View>

    {!!message && <Text accessibilityRole="alert" style={styles.notice}>{message}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <Text style={styles.version}>Yonder {Constants.expoConfig?.version ?? ""}</Text>
  </AppScreen>;
}

const settingsStyles = (theme: AppTheme) => StyleSheet.create({
  title: { fontFamily: font.ui700, fontSize: 30, lineHeight: 37, color: theme.ink, marginBottom: 8 },
  section: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 20, padding: 20, gap: 10, marginTop: 16 },
  label: { ...type.micro, color: theme.inkSoft },
  value: { ...type.heading, color: theme.ink },
  body: { ...type.label, color: theme.inkSoft, lineHeight: 19 },
  confirm: { gap: 10, paddingTop: 6 },
  row: { minHeight: 44, justifyContent: "center" },
  link: { ...type.body, color: theme.fresh },
  danger: { ...type.body, color: theme.danger },
  notice: { ...type.body, color: theme.fresh, marginTop: 14 },
  error: { ...type.body, color: theme.danger, marginTop: 14 },
  version: { ...type.label, color: theme.inkFaint, textAlign: "center", marginTop: 24 },
});
