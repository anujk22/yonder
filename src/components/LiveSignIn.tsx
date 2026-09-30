import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PrimaryButton } from "./ui";
import { createLiveAccount, sendSignInCode, signInLive, verifySignInCode } from "@/lib/liveAuth";
import { useActiveTheme } from "@/lib/store";
import { type } from "@/lib/theme";

type AuthMode = "sign-in" | "create" | "code";

export function LiveSignIn() {
  const theme = useActiveTheme();
  const styles = authStyles(theme);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const changeMode = (next: AuthMode) => {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setCode("");
    setCodeSent(false);
    setError("");
    setNotice("");
  };
  const submit = async (resend = false) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "create") {
        const needsConfirmation = await createLiveAccount(email, password, confirmation);
        if (mounted.current && needsConfirmation) {
          changeMode("sign-in");
          setNotice("Check your email for a confirmation link, then return here to sign in. If you already have an account, sign in with your password.");
        }
      } else if (mode === "sign-in") {
        await signInLive(email, password);
      } else if (codeSent && !resend) {
        await verifySignInCode(email, code);
      } else {
        await sendSignInCode(email);
        if (mounted.current) {
          setCodeSent(true);
          setNotice("Check your email for the latest sign-in code. If no message arrives, check spam or sign in with your password.");
        }
      }
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Couldn’t sign in. Please try again.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  return <View style={styles.card}>
    <Text style={styles.title}>{mode === "create" ? "Create your account" : "Sign in to community checks"}</Text>
    <Text style={styles.body}>{mode === "create" ? "Use your email and a password with at least 8 characters. Confirm your email to join." : "A free account lets you request and answer real checks. Your email is not shown to other members."}</Text>
    <TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} editable={!busy && !codeSent} placeholder="you@example.com" placeholderTextColor={theme.inkFaint} style={styles.input} />
    {mode !== "code" && <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete={mode === "create" ? "new-password" : "current-password"} secureTextEntry value={password} onChangeText={setPassword} editable={!busy} placeholder="Password" placeholderTextColor={theme.inkFaint} style={styles.input} />}
    {mode === "create" && <TextInput accessibilityLabel="Confirm password" autoCapitalize="none" autoComplete="new-password" secureTextEntry value={confirmation} onChangeText={setConfirmation} editable={!busy} placeholder="Confirm password" placeholderTextColor={theme.inkFaint} style={styles.input} />}
    {mode === "code" && codeSent && <TextInput accessibilityLabel="One-time email code" autoComplete="one-time-code" keyboardType="number-pad" value={code} onChangeText={setCode} maxLength={10} editable={!busy} placeholder="Email code" placeholderTextColor={theme.inkFaint} style={styles.input} />}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!!notice && <Text accessibilityRole="alert" style={styles.body}>{notice}</Text>}
    <PrimaryButton label={busy ? "Please wait…" : mode === "create" ? "Create account" : mode === "sign-in" ? "Sign in" : codeSent ? "Verify code" : "Send sign-in code"} onPress={() => void submit()} disabled={busy} />
    {mode === "code" && codeSent && <Pressable accessibilityRole="button" onPress={() => void submit(true)} disabled={busy}><Text style={styles.link}>Resend code</Text></Pressable>}
    {mode === "code" && codeSent && <Pressable accessibilityRole="button" onPress={() => changeMode("code")} disabled={busy}><Text style={styles.link}>Use another email</Text></Pressable>}
    <Pressable accessibilityRole="button" onPress={() => changeMode(mode === "create" ? "sign-in" : "create")} disabled={busy}><Text style={styles.link}>{mode === "create" ? "Already have an account? Sign in" : "Create a free account"}</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => changeMode(mode === "code" ? "sign-in" : "code")} disabled={busy}><Text style={styles.link}>{mode === "code" ? "Sign in with a password" : "Sign in with an email code instead"}</Text></Pressable>
  </View>;
}

const authStyles = (theme: ReturnType<typeof useActiveTheme>) => StyleSheet.create({
  card: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 18, padding: 20, gap: 10, marginVertical: 12 },
  title: { ...type.heading, color: theme.ink },
  body: { ...type.body, color: theme.inkSoft, marginBottom: 12 },
  input: { ...type.body, color: theme.ink, borderColor: theme.border, borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 52 },
  link: { ...type.label, color: theme.fresh, paddingVertical: 10 },
  error: { ...type.body, color: theme.danger },
});
