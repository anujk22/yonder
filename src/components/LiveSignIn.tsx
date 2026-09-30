import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { PrimaryButton } from "./ui";
import { Scout } from "./Brand";
import { sendSignInCode, signInLive, verifySignInCode } from "@/lib/liveAuth";
import { useActiveTheme } from "@/lib/store";
import { font, type } from "@/lib/theme";

type Step = "email" | "code" | "password";

/** Email first, then a six-digit code. New emails get an account; passwords remain for existing accounts. */
export function LiveSignIn() {
  const theme = useActiveTheme();
  const styles = authStyles(theme);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const go = (next: Step) => {
    setStep(next);
    setPassword("");
    setCode("");
    setError("");
    setNotice("");
  };
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try { await action(); }
    catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : "Couldn’t sign in. Please try again."); }
    finally { if (mounted.current) setBusy(false); }
  };
  const sendCode = () => run(async () => {
    await sendSignInCode(email);
    if (!mounted.current) return;
    setStep("code");
    setCode("");
    setNotice(`We sent a 6-digit code to ${email.trim().toLowerCase()}. It can take a minute; check spam if it doesn’t arrive.`);
  });

  return <View style={styles.card}>
    <View style={styles.brand}><Scout size={30} /><Text style={styles.title}>{step === "code" ? "Check your email" : step === "password" ? "Sign in with password" : "Sign in or join"}</Text></View>
    {step === "email" && <Text style={styles.body}>Enter your email. We’ll send a code, no password needed. New here? This creates your free account.</Text>}
    {step !== "code" && <TextInput accessibilityLabel="Email address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" keyboardType="email-address" returnKeyType="go" value={email} onChangeText={setEmail} onSubmitEditing={() => void (step === "email" ? sendCode() : undefined)} editable={!busy} placeholder="you@example.com" placeholderTextColor={theme.inkFaint} style={styles.input} />}
    {step === "password" && <TextInput accessibilityLabel="Password" autoCapitalize="none" autoComplete="current-password" textContentType="password" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={() => void run(() => signInLive(email, password))} editable={!busy} placeholder="Password" placeholderTextColor={theme.inkFaint} style={styles.input} />}
    {step === "code" && <TextInput accessibilityLabel="Six-digit code from your email" autoComplete="one-time-code" textContentType="oneTimeCode" keyboardType="number-pad" autoFocus value={code} onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 10))} onSubmitEditing={() => void run(() => verifySignInCode(email, code))} editable={!busy} placeholder="••••••" placeholderTextColor={theme.inkFaint} style={[styles.input, styles.code]} />}
    {!!notice && <Text accessibilityRole="alert" style={styles.body}>{notice}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {step === "email" && <PrimaryButton label={busy ? "Sending…" : "Email me a code"} onPress={() => void sendCode()} disabled={busy || !email.trim()} />}
    {step === "code" && <PrimaryButton label={busy ? "Checking…" : "Continue"} onPress={() => void run(() => verifySignInCode(email, code))} disabled={busy || code.length < 6} />}
    {step === "password" && <PrimaryButton label={busy ? "Signing in…" : "Sign in"} onPress={() => void run(() => signInLive(email, password))} disabled={busy} />}
    <View style={styles.links}>
      {step === "code" && <Pressable accessibilityRole="button" onPress={() => void sendCode()} disabled={busy}><Text style={styles.link}>Send a new code</Text></Pressable>}
      {step !== "email" && <Pressable accessibilityRole="button" onPress={() => go("email")} disabled={busy}><Text style={styles.link}>{step === "code" ? "Use a different email" : "Use an email code instead"}</Text></Pressable>}
      {step === "email" && <Pressable accessibilityRole="button" onPress={() => go("password")} disabled={busy}><Text style={styles.link}>I have a password</Text></Pressable>}
    </View>
  </View>;
}

const authStyles = (theme: ReturnType<typeof useActiveTheme>) => StyleSheet.create({
  card: { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 20, padding: 20, gap: 12, marginVertical: 12 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { ...type.heading, color: theme.ink },
  body: { ...type.label, color: theme.inkSoft, lineHeight: 19 },
  input: { ...type.body, color: theme.ink, backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 52 },
  code: { fontFamily: font.mono500, fontSize: 28, letterSpacing: 10, textAlign: "center" },
  links: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  link: { ...type.label, color: theme.fresh, paddingVertical: 8 },
  error: { ...type.body, color: theme.danger },
});
