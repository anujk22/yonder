import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Coffee,
  Heart,
  LocateFixed,
  Search,
  ShoppingBag,
  Trees,
  X,
} from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MapSurface, MapSurfaceHandle } from "@/components/MapSurface";
import { MotionPressable } from "@/components/MotionPressable";
import { Scout } from "@/components/Brand";
import { Entrance } from "@/components/ui";
import { openPlaceDraft } from "@/components/PlaceTile";
import { useYonderStore } from "@/lib/store";
import { useLiveLocation } from "@/lib/location";
import { searchWorldPlaces } from "@/lib/worldSearch";
import { categoryFor, questionFor, Category } from "@/lib/discovery";
import { Place } from "@/lib/places";
import { ask, font } from "@/lib/theme";

const filters = [
  { name: "All places", label: "All", icon: Search },
  { name: "Food & drink", label: "Food", icon: Coffee },
  { name: "Parks & play", label: "Outside", icon: Trees },
  { name: "Shopping", label: "Shops", icon: ShoppingBag },
] as const;
export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ search?: string }>();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const places = useYonderStore((s) => s.places);
  const saved = useYonderStore((s) => s.savedPlaceIds);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All places");
  const [world, setWorld] = useState<Place[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("pier2");
  const [focusTick, setFocusTick] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [availableHeight, setAvailableHeight] = useState(650);
  const searchInput = useRef<TextInput>(null);
  const map = useRef<MapSurfaceHandle>(null);
  const version = useRef(0);
  const location = useLiveLocation();
  const peek = 260;
  const maxHeight = Math.max(peek, availableHeight - insets.top - 156);
  const sheetHeight = useSharedValue(peek);
  const dragStart = useSharedValue(peek);
  const local = useMemo(
    () =>
      places.filter(
        (p) =>
          p.status !== "blocked" &&
          (category === "All places" || categoryFor(p) === category) &&
          `${p.name} ${p.area}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
      ),
    [places, category, search],
  );
  const results = useMemo(
    () => [...world, ...local.filter((p) => !world.some((w) => w.id === p.id))],
    [local, world],
  );
  const selected = results.find((p) => p.id === selectedId) ?? results[0];
  const setSheet = (open: boolean) => {
    setExpanded(open);
    sheetHeight.set(
      reduced
        ? open
          ? maxHeight
          : peek
        : withSpring(open ? maxHeight : peek, {
            damping: 26,
            stiffness: 230,
            overshootClamping: true,
          }),
    );
  };
  useEffect(() => {
    sheetHeight.set(
      reduced
        ? expanded
          ? maxHeight
          : peek
        : withSpring(expanded ? maxHeight : peek, {
            damping: 26,
            stiffness: 230,
            overshootClamping: true,
          }),
    );
  }, [expanded, maxHeight, reduced, sheetHeight]);
  useEffect(() => {
    if (params.search === "1") searchInput.current?.focus();
  }, [params.search]);
  const sheetStyle = useAnimatedStyle(() => ({ height: sheetHeight.get() }));
  const drag = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
    onPanResponderGrant: () => {
      dragStart.set(sheetHeight.get());
    },
    onPanResponderMove: (_, g) => {
      sheetHeight.set(
        Math.max(peek, Math.min(maxHeight, dragStart.get() - g.dy)),
      );
    },
    onPanResponderRelease: (_, g) => {
      setSheet(
        g.vy < -0.4 ||
          (g.vy <= 0.4 && sheetHeight.get() > (peek + maxHeight) / 2),
      );
    },
    onPanResponderTerminate: () => setSheet(expanded),
  });
  const select = (place: Place) => {
    Keyboard.dismiss();
    setSelectedId(place.id);
    setFocusTick(value => value + 1);
    setSheet(false);
  };
  useEffect(() => {
    if (!selected) return;
    map.current?.animateToRegion(
      {
        latitude: selected.lat,
        longitude: selected.lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      reduced ? 0 : 650,
    );
  }, [selected, reduced, focusTick]);
  const markers = results
    .slice(0, 20)
    .map((p) => ({
      id: p.id,
      label: p.id === "pier2" ? "Pier 2 courts" : p.name,
      active: selected?.id === p.id,
      coordinate: { latitude: p.lat, longitude: p.lng },
      onPress: () => select(p),
    }));
  const changeSearch = (value: string) => {
    version.current++;
    setSearch(value);
    setWorld([]);
    setSearched(false);
    setBusy(false);
    setError("");
    if (value.trim()) setSheet(true);
  };
  const searchWorld = async () => {
    if (search.trim().length < 3 || busy) return;
    const current = ++version.current;
    setBusy(true);
    setError("");
    Keyboard.dismiss();
    setSheet(true);
    try {
      const found = await searchWorldPlaces(search);
      if (current === version.current) {
        setWorld(found);
        setSearched(true);
      }
    } catch (e) {
      if (current === version.current)
        setError(
          e instanceof Error ? e.message : "Search unavailable. Try again.",
        );
    } finally {
      if (current === version.current) setBusy(false);
    }
  };
  useEffect(() => {
    if (location.fix)
      map.current?.animateToRegion(
        { ...location.fix, latitudeDelta: 0.025, longitudeDelta: 0.025 },
        reduced ? 0 : 650,
      );
  }, [location.fix, reduced]);
  return (
    <View
      style={styles.root}
      onLayout={(e) => setAvailableHeight(e.nativeEvent.layout.height)}
    >
      <MapSurface
        ref={map}
        style={StyleSheet.absoluteFill}
        markers={markers}
        userLocation={location.fix}
        controlsInset={{ top: insets.top + 150, bottom: peek + 14 }}
      />
      <View
        pointerEvents="box-none"
        style={[styles.top, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.brandRow}>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Back to Explore"
            onPress={() => router.navigate("/")}
            style={styles.brand}
          >
            <Scout size={27} />
            <Text style={styles.logo}>yonder.</Text>
          </MotionPressable>
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="About this preview"
            onPress={() => router.push("/about")}
            style={styles.preview}
          >
            <Text style={styles.previewText}>NYC PREVIEW</Text>
          </MotionPressable>
        </View>
        <View style={styles.search}>
          <Search size={19} color={ask.inkSoft} strokeWidth={1.6} />
          <TextInput
            ref={searchInput}
            accessibilityLabel="Search places or neighborhoods"
            value={search}
            onChangeText={changeSearch}
            onSubmitEditing={searchWorld}
            returnKeyType="search"
            placeholder="A place, a neighborhood…"
            placeholderTextColor={ask.inkSoft}
            style={styles.input}
          />
          {Boolean(search) && (
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => changeSearch("")}
              style={styles.clear}
            >
              <X size={16} color={ask.inkSoft} />
            </MotionPressable>
          )}
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="Search worldwide"
            onPress={searchWorld}
            style={styles.searchGo}
          >
            {busy ? (
              <ActivityIndicator size="small" color={ask.ink} />
            ) : (
              <ArrowRight size={19} color={ask.ink} />
            )}
          </MotionPressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map(({ name, label, icon: Icon }) => (
            <MotionPressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected: category === name }}
              onPress={() => {
                setCategory(name);
                setWorld([]);
                setSheet(true);
              }}
              style={[
                styles.filter,
                category === name && {
                  backgroundColor: ask.ink,
                  borderColor: ask.ink,
                },
              ]}
            >
              <Icon
                size={13}
                color={category === name ? ask.bg : ask.ink}
                strokeWidth={1.7}
              />
              <Text
                style={[
                  styles.filterText,
                  category === name && { color: ask.bg },
                ]}
              >
                {label}
              </Text>
            </MotionPressable>
          ))}
        </ScrollView>
      </View>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={
          location.active ? "Stop live location" : "Use my location"
        }
        onPress={location.active ? location.stop : location.start}
        style={[
          styles.locate,
          { bottom: peek + 39 },
          location.active && { backgroundColor: ask.accent },
        ]}
      >
        {location.loading ? (
          <ActivityIndicator color={ask.ink} />
        ) : (
          <LocateFixed size={22} color={ask.ink} />
        )}
      </MotionPressable>
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View {...drag.panHandlers}>
          <MotionPressable
            haptic={false}
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Collapse places" : "Expand places"}
            accessibilityState={{ expanded }}
            onPress={() => setSheet(!expanded)}
            style={styles.handleTouch}
          >
            <View style={styles.handle} />
          </MotionPressable>
        </View>
        <Link href="https://www.openstreetmap.org/copyright" style={{ position: "absolute", top: 8, right: 16, fontFamily: font.ui400, fontSize: 8, color: ask.inkSoft }}>© OpenStreetMap</Link>
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetBody}
        >
          {Boolean(location.error) && (
            <Text accessibilityRole="alert" style={styles.error}>
              {location.error}
            </Text>
          )}
          {expanded ? (
            <>
              <View style={styles.headingRow}>
                <View>
                  <Text style={styles.eyebrow}>A LITTLE LOOK AROUND</Text>
                  <Text style={styles.sheetTitle}>
                    {search ? "A place in mind?" : "Find your somewhere."}
                  </Text>
                </View>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel="Collapse places"
                  onPress={() => setSheet(false)}
                  style={styles.clear}
                >
                  <ChevronDown color={ask.ink} size={22} />
                </MotionPressable>
              </View>
              {search.trim().length >= 3 && (
                <MotionPressable
                  accessibilityRole="button"
                  onPress={searchWorld}
                  style={styles.worldButton}
                >
                  <Text style={styles.worldText}>
                    {busy
                      ? "Looking a little further…"
                      : `Search the world for “${search}”`}
                  </Text>
                  <ArrowUpRight size={17} color={ask.fresh} />
                </MotionPressable>
              )}
              {Boolean(error) && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              )}
              {searched && (
                <Text style={styles.note}>
                  World results from OpenStreetMap · no live observations yet
                </Text>
              )}
              {results.map((place) => (
                <MotionPressable
                  key={place.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${place.name} on map`}
                  onPress={() => select(place)}
                  style={styles.result}
                >
                  <View style={styles.resultIcon}>
                    {categoryFor(place) === "Food & drink" ? (
                      <Coffee size={18} color={ask.fresh} />
                    ) : (
                      <Trees size={18} color={ask.fresh} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={2}>
                      {place.name}
                    </Text>
                    <Text style={styles.resultArea} numberOfLines={1}>
                      {place.area}
                    </Text>
                  </View>
                  <ArrowUpRight size={17} color={ask.inkSoft} />
                </MotionPressable>
              ))}
              {!results.length && (
                <View style={styles.empty}>
                  <Scout size={48} />
                  <Text style={styles.sheetTitle}>
                    A little further afield?
                  </Text>
                  <Text style={styles.note}>
                    Try another category or search a place and city.
                  </Text>
                </View>
              )}
            </>
          ) : selected ? (
            <Entrance key={selected.id}>
              <View style={styles.headingRow}>
                <Text style={styles.eyebrow}>
                  {categoryFor(selected).toUpperCase()}
                </Text>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={`${saved.includes(selected.id) ? "Unsave" : "Save"} ${selected.name}`}
                  onPress={() => { const state = useYonderStore.getState(); state.addPlace(selected); state.toggleSavedPlace(selected.id); }}
                  style={styles.save}
                >
                  <Heart
                    size={20}
                    color={ask.ink}
                    fill={saved.includes(selected.id) ? ask.ink : "transparent"}
                    strokeWidth={1.6}
                  />
                </MotionPressable>
              </View>
              <Text style={styles.placeName} numberOfLines={2}>
                {selected.name}
              </Text>
              <Text style={styles.resultArea} numberOfLines={1}>
                {selected.area}
              </Text>
              <Text style={styles.question} numberOfLines={2}>
                {questionFor(selected)}
              </Text>
              <View style={styles.actionRow}>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ask about ${selected.name}`}
                  onPress={() => openPlaceDraft(selected, router)}
                  style={styles.askButton}
                >
                  <Text style={styles.askText}>Ask for a little look</Text>
                  <ArrowUpRight size={18} color={ask.bg} />
                </MotionPressable>
                <MotionPressable
                  accessibilityRole="button"
                  onPress={() => setSheet(true)}
                  style={styles.browseButton}
                >
                  <Text style={styles.browseText}>Browse {results.length}</Text>
                </MotionPressable>
              </View>
              <Text style={styles.note}>
                Sample requests · no one is dispatched in this preview
              </Text>
            </Entrance>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.sheetTitle}>Nothing in this view yet.</Text>
              <Text style={styles.note}>
                Try a different search or category.
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ask.surfaceAlt },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    gap: 10,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F8F7F2F5",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 17,
  },
  logo: {
    fontFamily: font.black,
    fontSize: 26,
    letterSpacing: -1,
    color: ask.ink,
  },
  preview: {
    backgroundColor: "#F8F7F2F5",
    borderRadius: 18,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  previewText: {
    fontFamily: font.ui700,
    fontSize: 8,
    color: ask.inkSoft,
    letterSpacing: 0.6,
  },
  search: {
    height: 53,
    backgroundColor: "#FFFEFA",
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 15,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: "#D7DCCE",
    boxShadow: "0 4px 14px #243C3210",
  },
  input: {
    fontFamily: font.ui500,
    fontSize: 13,
    color: ask.ink,
    flex: 1,
    minWidth: 0,
    height: "100%",
  },
  clear: {
    width: 32,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchGo: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: ask.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: { gap: 7, paddingBottom: 4 },
  filter: {
    minHeight: 36,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D7DCCE",
    backgroundColor: "#FFFEFA",
  },
  filterText: { fontFamily: font.ui600, fontSize: 10, color: ask.ink },
  locate: {
    position: "absolute",
    right: 18,
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: ask.bg,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 3px 12px #243C3220",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: ask.bg,
    borderWidth: 1,
    borderColor: "#DDDFD4",
    borderBottomWidth: 0,
    boxShadow: "0 -5px 25px #243C3212",
    overflow: "hidden",
  },
  handleTouch: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: { width: 35, height: 4, borderRadius: 3, backgroundColor: "#C5CABD" },
  sheetBody: { paddingHorizontal: 22, paddingBottom: 18 },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  eyebrow: {
    fontFamily: font.ui700,
    fontSize: 8,
    color: ask.fresh,
    letterSpacing: 1,
  },
  sheetTitle: {
    fontFamily: font.serif,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -1,
    color: ask.ink,
    marginTop: 7,
  },
  placeName: {
    fontFamily: font.serif,
    fontSize: 27,
    lineHeight: 30,
    letterSpacing: -0.8,
    color: ask.ink,
  },
  save: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  resultArea: {
    fontFamily: font.ui400,
    fontSize: 10,
    color: ask.inkSoft,
    lineHeight: 17,
    marginTop: 4,
  },
  question: {
    fontFamily: font.ui500,
    fontSize: 12,
    lineHeight: 18,
    color: ask.inkSoft,
    marginTop: 9,
  },
  actionRow: { flexDirection: "row", gap: 9, marginTop: 15, marginBottom: 9 },
  askButton: {
    flex: 1,
    minHeight: 47,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: ask.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },
  askText: { fontFamily: font.ui600, fontSize: 11, color: ask.bg },
  browseButton: {
    minHeight: 47,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: ask.border,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  browseText: { fontFamily: font.ui600, fontSize: 11, color: ask.ink },
  note: {
    fontFamily: font.ui400,
    fontSize: 9,
    lineHeight: 15,
    color: ask.inkSoft,
  },
  worldButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  worldText: {
    fontFamily: font.ui600,
    fontSize: 12,
    color: ask.fresh,
    flex: 1,
  },
  result: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: ask.border,
  },
  resultIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: ask.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  resultName: {
    fontFamily: font.ui600,
    fontSize: 13,
    lineHeight: 20,
    color: ask.ink,
  },
  error: {
    fontFamily: font.ui500,
    fontSize: 11,
    lineHeight: 18,
    color: ask.danger,
    paddingVertical: 10,
  },
  empty: { alignItems: "center", paddingVertical: 26, gap: 14 },
});
