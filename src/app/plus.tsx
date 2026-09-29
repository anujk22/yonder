import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { BrandScene } from "@/components/BrandObject";
import { ask, font, type } from "@/lib/theme";
import { buyPackage, hasPlus, loadPurchaseOptions, purchasesAvailable, restorePurchase, testPurchases } from "@/lib/purchases";
import { purchaseWasCancelled } from "@/lib/purchasePolicy";
import { usePurchaseStore } from "@/lib/purchaseStore";

export default function PlusScreen() {
  const router = useRouter();
  const plus = usePurchaseStore((s) => s.plus);
  const [option, setOption] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(purchasesAvailable);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!purchasesAvailable) return;
    let active = true;
    loadPurchaseOptions().then(({ info, packages }) => {
      if (!active) return;
      usePurchaseStore.getState().accept(info);
      const lifetime = packages.find((item) => item.packageType === "LIFETIME");
      setOption(lifetime ?? null);
      setMessage(lifetime ? "" : "Plus isn’t available to buy right now. Your saved places and first collection are still free.");
    }).catch(() => { if (active) setMessage("We couldn’t load the price. Check your connection and try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const transact = async (restore: boolean) => {
    if (busy || (!restore && !option)) return;
    setBusy(true);
    setMessage("");
    try {
      const info = restore ? await restorePurchase() : await buyPackage(option!);
      usePurchaseStore.getState().accept(info);
      setMessage(hasPlus(info) ? (restore ? "Plus restored. Your collections are ready." : "You’re all set. Make room for your next adventure.")
        : restore ? "No Plus purchase was found for this store account." : "Your purchase hasn’t unlocked Plus yet. If payment is pending, check again later or restore purchases.");
    } catch (error) {
      if (!purchaseWasCancelled(error)) setMessage("The store couldn’t complete this request. You can try again or restore an existing purchase.");
    } finally { setBusy(false); }
  };

  return <AppScreen>
    <ScreenHeader eyebrow="YONDER PLUS" />
    {testPurchases && <Text accessibilityRole="alert" style={styles.notice}>TEST STORE · No real payment. This build demonstrates RevenueCat’s test purchase flow.</Text>}
    {!purchasesAvailable && <Text style={styles.notice}>Purchases aren’t available in this build. You can still try your first collection for free.</Text>}
    <BrandScene compact />
    <Text accessibilityRole="header" style={styles.title}>Your places.{"\n"}A little more organized.</Text>
    <Text style={styles.body}>Everyday favorites. Weekend plans. The places worth coming back to.</Text>
    <View style={styles.card}>
      <Text style={styles.heading}>More collections. One purchase.</Text>
      <Text style={styles.body}>Keep your saved places in as many named collections as you need, on this device.</Text>
      <Text style={styles.body}>Your first collection is free. Plus unlocks additional collections. Map search and saving places stay free.</Text>
      <Text style={styles.note}>One-time purchase · no subscription. Collections don’t sync between devices. Plus does not buy observations, guarantee answers, or pay scouts.</Text>
    </View>
    {Boolean(message) && <Text accessibilityRole="alert" style={styles.notice}>{message}</Text>}
    <View style={styles.actions}>
      {plus ? <PrimaryButton label="Organize my places" onPress={() => router.replace("/collections")} />
        : <PrimaryButton label={busy ? "Connecting to the store…" : loading ? "Loading price…" : option ? `Get Plus · ${option.product.priceString}` : "Plus currently unavailable"}
          onPress={() => void transact(false)} disabled={busy || loading || !option} />}
      {purchasesAvailable && <PrimaryButton label="Restore purchases" variant="secondary" disabled={busy || loading} onPress={() => void transact(true)} />}
      {purchasesAvailable && !loading && !option && <PrimaryButton label="Try loading again" variant="secondary" disabled={busy} onPress={() => { setLoading(true); setMessage(""); setAttempt((n) => n + 1); }} />}
      <Pressable accessibilityRole="button" onPress={() => router.replace("/collections")} style={styles.link}><Text style={styles.linkText}>{plus ? "Back to collections" : "Continue with my free collection"}</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://yonder.expo.app/privacy")} style={styles.link}><Text style={styles.linkText}>Privacy policy ↗</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL("https://yonder.expo.app/support")} style={styles.link}><Text style={styles.linkText}>Purchase support ↗</Text></Pressable>
    </View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  title: { fontFamily: font.ui700, fontSize: 34, lineHeight: 40, letterSpacing: -1, color: ask.ink, marginBottom: 12 },
  heading: { ...type.heading, color: ask.ink },
  body: { ...type.body, color: ask.inkSoft },
  note: { ...type.label, color: ask.inkSoft, lineHeight: 20 },
  card: { marginVertical: 24, padding: 22, gap: 14, borderRadius: 24, backgroundColor: "#EEE6F7" },
  notice: { ...type.body, color: ask.ink, padding: 16, backgroundColor: ask.surfaceAlt, borderRadius: 16, marginBottom: 16 },
  actions: { gap: 14 },
  link: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  linkText: { ...type.label, color: ask.fresh },
});
