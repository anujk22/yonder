import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { BrandObject } from "@/components/BrandObject";
import { MotionPressable } from "@/components/MotionPressable";
import { ask, font, type } from "@/lib/theme";
import { buyPackage, hasPlus, loadPlusOffer, manageSubscription, purchasesAvailable, restorePurchase, testPurchases } from "@/lib/purchases";
import { freeTrialLabel, purchaseWasCancelled } from "@/lib/purchasePolicy";
import { usePurchaseStore } from "@/lib/purchaseStore";
import { useLiveAuth } from "@/lib/liveAuth";
import { LIVE_FEATURES_ENABLED } from "@/lib/previewFeatures";

const perks = [
  ["Longer check windows", "Keep a question open for 1 or 2 hours, not just 30 minutes."],
  ["More open checks", "Up to 10 at once. Free accounts keep 3."],
  ["Unlimited collections", "Group saved places however you plan. The first collection is free."],
] as const;

const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

export default function PlusScreen() {
  const router = useRouter();
  const plus = usePurchaseStore((s) => s.plus);
  const signedIn = useLiveAuth((s) => Boolean(s.user));
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(purchasesAvailable);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!purchasesAvailable) return;
    let active = true;
    loadPlusOffer().then(({ info, packages }) => {
      if (!active) return;
      usePurchaseStore.getState().accept(info);
      setPackages(packages);
      setSelected((current) => current ?? packages.find((item) => item.packageType === "ANNUAL")?.identifier ?? packages[0]?.identifier ?? null);
      setMessage(packages.length ? "" : "Plus isn’t available to buy right now.");
    }).catch(() => { if (active) setMessage("We couldn’t load Plus. Check your connection and try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const option = packages.find((item) => item.identifier === selected) ?? null;
  const trial = option ? freeTrialLabel(option.product.introPrice) : null;

  const transact = async (restore: boolean) => {
    if (busy || (!restore && !option)) return;
    setBusy(true);
    setMessage("");
    try {
      const info = restore ? await restorePurchase() : await buyPackage(option!);
      usePurchaseStore.getState().accept(info);
      setMessage(hasPlus(info) ? (restore ? "Plus restored." : "Welcome to Plus.")
        : restore ? "No Plus subscription was found for this store account." : "Your purchase hasn’t unlocked Plus yet. If payment is pending, check again later or restore purchases.");
    } catch (error) {
      if (!purchaseWasCancelled(error)) setMessage("The store couldn’t complete this request. You weren’t charged. Try again or restore an existing subscription.");
    } finally { setBusy(false); }
  };

  const store = Platform.OS === "android" ? "Google Play account" : "Apple Account";
  return <AppScreen>
    <ScreenHeader eyebrow="YONDER PLUS" />
    {testPurchases && <Text accessibilityRole="alert" style={styles.notice}>TEST STORE · No real payment. This build uses RevenueCat’s test purchase flow.</Text>}
    {!purchasesAvailable && <Text style={styles.notice}>Plus can be purchased in the Yonder app on iPhone or Android.</Text>}
    <View style={styles.hero}>
      <BrandObject kind="scoutFront" size={132} playful />
    </View>
    <Text accessibilityRole="header" style={styles.title}>{plus ? "You’re on Plus." : "For people who plan\naround places."}</Text>
    <Text style={styles.body}>Plus is for the people who check a lot.</Text>
    <View style={styles.perks}>
      {perks.map(([title, body]) => <View key={title} style={styles.perk}>
        <Text style={styles.check}>✓</Text>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.perkTitle}>{title}</Text>
          <Text style={styles.small}>{body}</Text>
        </View>
      </View>)}
    </View>
    {!plus && packages.length > 0 && <View accessibilityRole="radiogroup" style={styles.plans}>
      {packages.map((item) => {
        const active = item.identifier === selected;
        const annual = item.packageType === "ANNUAL";
        const itemTrial = freeTrialLabel(item.product.introPrice);
        return <MotionPressable key={item.identifier} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => setSelected(item.identifier)} style={[styles.plan, active && styles.planActive]}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.planName}>{annual ? "Yearly" : "Monthly"}</Text>
            <Text style={styles.small}>{itemTrial ? `${itemTrial}, then ` : ""}{item.product.priceString} / {annual ? "year" : "month"}</Text>
          </View>
          {annual && item.product.pricePerMonthString ? <Text style={styles.badge}>{item.product.pricePerMonthString}/mo</Text> : null}
        </MotionPressable>;
      })}
    </View>}
    {LIVE_FEATURES_ENABLED && !signedIn && <Text style={styles.small}>Sign in from Settings so Plus also applies to your community checks.</Text>}
    {Boolean(message) && <Text accessibilityRole="alert" style={styles.notice}>{message}</Text>}
    <View style={styles.actions}>
      {plus ? <>
        <PrimaryButton label="Organize my places" onPress={() => router.replace("/collections")} />
        {purchasesAvailable && <PrimaryButton label="Manage subscription" variant="secondary" onPress={() => void manageSubscription().catch(() => setMessage("Open your store account settings to manage your subscription."))} />}
      </> : <PrimaryButton label={busy ? "Connecting to the store…" : loading ? "Loading plans…" : option ? trial ? `Start ${trial}` : `Subscribe · ${option.product.priceString}` : "Plus currently unavailable"}
          onPress={() => void transact(false)} disabled={busy || loading || !option} />}
      {purchasesAvailable && !plus && <PrimaryButton label="Restore purchases" variant="secondary" disabled={busy || loading} onPress={() => void transact(true)} />}
      {purchasesAvailable && !loading && !packages.length && <PrimaryButton label="Try loading again" variant="secondary" disabled={busy} onPress={() => { setLoading(true); setMessage(""); setAttempt((n) => n + 1); }} />}
      {!plus && option && <Text style={styles.legal}>
        {trial ? `Free for ${trial.replace(" free", "")}, then ` : ""}{option.product.priceString} per {option.packageType === "ANNUAL" ? "year" : "month"}. Payment is charged to your {store}{trial ? " when the trial ends" : " at confirmation"}. The subscription renews automatically unless you cancel at least 24 hours before the end of the current period. Manage or cancel anytime in your account settings.
      </Text>}
      <View style={styles.links}>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(TERMS_URL)} style={styles.link}><Text style={styles.linkText}>Terms of use ↗</Text></Pressable>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://yonder.expo.app/privacy")} style={styles.link}><Text style={styles.linkText}>Privacy ↗</Text></Pressable>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://yonder.expo.app/support")} style={styles.link}><Text style={styles.linkText}>Support ↗</Text></Pressable>
      </View>
    </View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", marginTop: 4, marginBottom: 8 },
  title: { fontFamily: font.ui700, fontSize: 32, lineHeight: 38, letterSpacing: -1, color: ask.ink, marginBottom: 10 },
  body: { ...type.body, color: ask.inkSoft },
  small: { ...type.label, color: ask.inkSoft, lineHeight: 19 },
  perks: { marginVertical: 22, padding: 20, gap: 16, borderRadius: 22, backgroundColor: ask.surfaceAlt },
  perk: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  check: { fontFamily: font.ui700, fontSize: 15, color: ask.fresh, marginTop: 1 },
  perkTitle: { ...type.label, fontFamily: font.ui700, color: ask.ink, fontSize: 15 },
  plans: { gap: 10, marginBottom: 14 },
  plan: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, borderRadius: 18, borderWidth: 1.5, borderColor: ask.border, backgroundColor: ask.surface },
  planActive: { borderColor: ask.ink, backgroundColor: "#FFFCEB" },
  planName: { fontFamily: font.ui700, fontSize: 17, color: ask.ink },
  badge: { ...type.micro, color: ask.onAccent, backgroundColor: ask.accentSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, overflow: "hidden" },
  notice: { ...type.body, color: ask.ink, padding: 16, backgroundColor: ask.surfaceAlt, borderRadius: 16, marginBottom: 16 },
  actions: { gap: 14 },
  legal: { ...type.label, fontSize: 11, lineHeight: 17, color: ask.inkSoft },
  links: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 6 },
  link: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  linkText: { ...type.label, color: ask.fresh },
});
