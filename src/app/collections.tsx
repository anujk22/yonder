import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import { PlaceTile } from "@/components/PlaceTile";
import { useCollectionHydration, useCollectionStore } from "@/lib/collectionStore";
import { usePurchaseStore } from "@/lib/purchaseStore";
import { useYonderStore } from "@/lib/store";
import { ask, font, type } from "@/lib/theme";

export default function CollectionsScreen() {
  const router = useRouter();
  const collections = useCollectionStore((s) => s.collections);
  const hydration = useCollectionHydration((s) => s.status);
  const plus = usePurchaseStore((s) => s.plus);
  const ready = usePurchaseStore((s) => s.ready);
  const purchaseError = usePurchaseStore((s) => s.error);
  const saved = useYonderStore((s) => s.savedPlaceIds);
  const places = useYonderStore((s) => s.places);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const current = collections.find((item) => item.id === selected) ?? collections[0];
  const create = () => {
    try {
      setSelected(useCollectionStore.getState().createCollection(name));
      setName(""); setError(""); setEditing(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t create this collection."); }
  };
  return <AppScreen>
    <ScreenHeader eyebrow="YOUR SAVED PLACES" />
    <Text accessibilityRole="header" style={styles.title}>Little lists.{"\n"}Good places.</Text>
    <Text style={styles.body}>One collection is free. Make more with Plus. Everything stays on this device.</Text>
    {hydration !== "ready" ? <View style={styles.section}>
      <Text style={styles.body}>{hydration === "loading" ? "Loading your collections…" : "We couldn’t load your collections. Try again before making changes to your lists."}</Text>
      {hydration === "error" && <PrimaryButton label="Try loading again" onPress={() => {
        void useCollectionStore.persist.rehydrate();
      }} />}
    </View> : <>
    <View style={styles.pills}>{collections.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: current?.id === item.id }}
      onPress={() => { setSelected(item.id); setEditing(false); setDeleting(false); }} style={[styles.pill, current?.id === item.id && styles.active]}>
      <Text style={[styles.pillText, current?.id === item.id && { color: ask.bg }]}>{item.name} · {item.placeIds.length}</Text>
    </Pressable>)}</View>
    {current && <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>{current.name}</Text>
      <PrimaryButton variant="secondary" label={editing ? "Done choosing places" : "Choose saved places"} onPress={() => setEditing(!editing)} />
      {editing ? <View style={styles.list}>
        {places.filter((p) => saved.includes(p.id) || current.placeIds.includes(p.id)).map((p) => <Pressable key={p.id}
          accessibilityRole="checkbox" accessibilityState={{ checked: current.placeIds.includes(p.id) }}
          onPress={() => useCollectionStore.getState().togglePlace(current.id, p.id)} style={styles.place}>
          <Text style={styles.body}>{current.placeIds.includes(p.id) ? "✓  " : "+  "}{p.name}</Text>
        </Pressable>)}
        {!saved.length && !current.placeIds.length && <Text style={styles.body}>Save a place from Explore, then add it here.</Text>}
      </View> : <View style={styles.list}>
        {places.filter((p) => current.placeIds.includes(p.id)).map((p) => <PlaceTile key={p.id} place={p} compact width="100%" />)}
        {!current.placeIds.length && <Text style={styles.body}>Your first good find belongs here.</Text>}
      </View>}
      {deleting ? <View style={styles.list}>
        <Text style={styles.body}>Remove this collection? Your saved places will stay.</Text>
        <PrimaryButton label="Remove collection" variant="danger" onPress={() => { useCollectionStore.getState().removeCollection(current.id); setSelected(null); setDeleting(false); }} />
        <PrimaryButton label="Keep collection" variant="secondary" onPress={() => setDeleting(false)} />
      </View> : <Pressable accessibilityRole="button" onPress={() => setDeleting(true)} style={styles.link}><Text style={styles.linkText}>Remove collection</Text></Pressable>}
    </View>}
    {Boolean(purchaseError) && <Text accessibilityRole="alert" style={styles.error}>{purchaseError}</Text>}
    {collections.length === 0 || plus ? <View style={styles.section}>
      <Text style={styles.heading}>{collections.length ? "Another little list?" : "Make your first collection"}</Text>
      <TextInput accessibilityLabel="Collection name" placeholder="Weekend plans" placeholderTextColor={ask.inkFaint} value={name} maxLength={48} onChangeText={(value) => { setName(value); setError(""); }} style={styles.input} onSubmitEditing={create} />
      {Boolean(error) && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <PrimaryButton label="Create collection" onPress={create} disabled={!name.trim()} />
    </View> : <View style={styles.section}>
      <Text style={styles.heading}>A place for every plan.</Text>
      <Text style={styles.body}>Plus adds unlimited collections, longer check windows and more open checks. Your existing collections stay readable if Plus ends.</Text>
      <PrimaryButton label={ready ? "Explore Yonder Plus" : "Checking Plus…"} disabled={!ready} onPress={() => router.push("/plus")} />
    </View>}
    </>}
    <PrimaryButton label="Find more places" variant="secondary" onPress={() => router.navigate("/")} />
  </AppScreen>;
}

const styles = StyleSheet.create({
  title: { fontFamily: font.ui700, fontSize: 34, lineHeight: 40, color: ask.ink, letterSpacing: -1, marginBottom: 14 },
  heading: { ...type.heading, color: ask.ink }, body: { ...type.body, color: ask.inkSoft },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 22 },
  pill: { borderRadius: 18, backgroundColor: ask.surfaceAlt, padding: 14 }, active: { backgroundColor: ask.ink }, pillText: { ...type.label, color: ask.ink },
  section: { backgroundColor: ask.surface, borderRadius: 24, padding: 20, gap: 16, marginBottom: 22, borderWidth: 1, borderColor: ask.border },
  list: { gap: 12 }, place: { minHeight: 48, justifyContent: "center", padding: 12, backgroundColor: ask.surfaceAlt, borderRadius: 14 },
  input: { ...type.body, color: ask.ink, padding: 14, borderWidth: 1, borderColor: ask.border, borderRadius: 14 },
  error: { ...type.body, color: ask.danger }, link: { minHeight: 44, justifyContent: "center" }, linkText: { ...type.label, color: ask.inkSoft },
});
