import { useScoutNavigation } from "@/lib/useScoutNavigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Heart,
  LocateFixed,
  Search,
  X,
  MapPin,
  Sparkles,
  Compass,
} from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MapSurface, MapSurfaceHandle, MapRegion } from "./MapSurface";
import { MotionPressable } from "./MotionPressable";
import { Scout } from "./Brand";
import { BrandObject } from "./BrandObject";
import { CategoryObject } from "./CategoryObject";
import { TactileIcon, categoryPalette } from "./TactileIcon";
import { openPlaceDraft } from "./PlaceTile";
import { useYonderStore } from "@/lib/store";
import { useLiveLocation } from "@/lib/location";
import { searchNearbyPlaces, searchWorldPlaces } from "@/lib/worldSearch";
import { categoryFor, questionFor, Category } from "@/lib/discovery";
import { Place } from "@/lib/places";
import { distanceMeters } from "@/lib/geo";
import { ask, font } from "@/lib/theme";

const USA: MapRegion = {
  latitude: 39.5,
  longitude: -98.35,
  latitudeDelta: 27,
  longitudeDelta: 48,
};
const filters: { name: Category; label: string }[] = [
  { name: "All places", label: "Everything" },
  { name: "Food & drink", label: "A bite" },
  { name: "Parks & play", label: "Outside" },
  { name: "Shopping", label: "Shops" },
];
export default function ExploreMap() {
  const router = useRouter();
  const navigate = useScoutNavigation();
  const params = useLocalSearchParams<{ search?: string }>();
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const stored = useYonderStore((s) => s.places);
  const saved = useYonderStore((s) => s.savedPlaceIds);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All places");
  const [places, setPlaces] = useState<Place[]>([]);
  const [source, setSource] = useState<"start" | "search" | "nearby" | "tour">(
    "start",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [availableHeight, setAvailableHeight] = useState(700);
  const [mapMoved, setMapMoved] = useState(false);
  const [locationRequested, setLocationRequested] = useState(false);
  const map = useRef<MapSurfaceHandle>(null);
  const input = useRef<TextInput>(null);
  const version = useRef(0);
  const center = useRef<MapRegion>(USA);
  const location = useLiveLocation();
  const peek = source === "start" ? 340 : selectedId ? 365 : 300;
  const maximum = Math.max(peek, availableHeight - insets.top - 178);
  const height = useSharedValue(peek);
  const dragStart = useSharedValue(peek);
  const results = useMemo(
    () =>
      places.filter(
        (p) => category === "All places" || categoryFor(p) === category,
      ),
    [places, category],
  );
  const selected = results.find((p) => p.id === selectedId);
  useEffect(() => {
    if (source === "start") map.current?.animateToRegion(USA, 0);
  }, [desktop, source]);
  const sheetStyle = useAnimatedStyle(() => ({ height: height.get() }));
  useEffect(() => {
    height.set(
      reduced
        ? expanded
          ? maximum
          : peek
        : withSpring(expanded ? maximum : peek, {
            damping: 28,
            stiffness: 240,
            overshootClamping: true,
          }),
    );
  }, [expanded, maximum, peek, reduced, height]);
  useEffect(() => {
    if (params.search === "1") input.current?.focus();
  }, [params.search]);
  useEffect(
    () => () => {
      version.current++;
    },
    [],
  );
  const drag = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => !desktop && Math.abs(g.dy) > 6,
    onPanResponderGrant: () => {
      dragStart.set(height.get());
    },
    onPanResponderMove: (_, g) =>
      height.set(Math.max(peek, Math.min(maximum, dragStart.get() - g.dy))),
    onPanResponderRelease: (_, g) =>
      setExpanded(
        g.vy < -0.4 || (g.vy < 0.4 && height.get() > (peek + maximum) / 2),
      ),
    onPanResponderTerminate: () => height.set(expanded ? maximum : peek),
  });
  const focus = (place: Place) => {
    Keyboard.dismiss();
    setSelectedId(place.id);
    setExpanded(false);
    map.current?.animateToRegion(
      {
        latitude: place.lat,
        longitude: place.lng,
        latitudeDelta: 0.016,
        longitudeDelta: 0.016,
      },
      reduced ? 0 : 650,
    );
    setMapMoved(false);
  };
  const loadNearby = useCallback(
    async (latitude: number, longitude: number) => {
      const current = ++version.current;
      setBusy(true);
      setError("");
      setSource("nearby");
      setSelectedId(null);
      setPlaces([]);
      setSearch("");
      setCategory("All places");
      setExpanded(true);
      setMapMoved(false);
      try {
        const found = await searchNearbyPlaces(latitude, longitude);
        if (current === version.current) setPlaces(found);
      } catch (e) {
        if (current === version.current)
          setError(
            e instanceof Error
              ? e.message
              : "Could not find nearby places. Try a place and city.",
          );
      } finally {
        if (current === version.current) setBusy(false);
      }
    },
    [],
  );
  useEffect(() => {
    if (!locationRequested || !location.fix) return;
    const fix = location.fix;
    if (!Number.isFinite(fix.latitude) || !Number.isFinite(fix.longitude))
      return;
    const timer = setTimeout(() => {
      setLocationRequested(false);
      map.current?.animateToRegion(
        { ...fix, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        reduced ? 0 : 650,
      );
      void loadNearby(fix.latitude, fix.longitude);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.fix, locationRequested, loadNearby, reduced]);
  const locate = () => {
    setError("");
    setLocationRequested(true);
    void location.start();
  };
  const submit = async () => {
    if (search.trim().length < 3 || busy) return;
    const current = ++version.current;
    setLocationRequested(false);
    setBusy(true);
    setError("");
    setExpanded(true);
    Keyboard.dismiss();
    setCategory("All places");
    setSelectedId(null);
    setSource("search");
    setPlaces([]);
    try {
      const found = await searchWorldPlaces(search);
      if (current === version.current) {
        setPlaces(found);
        if (found[0])
          map.current?.animateToRegion(
            {
              latitude: found[0].lat,
              longitude: found[0].lng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            },
            reduced ? 0 : 650,
          );
      }
    } catch (e) {
      if (current === version.current)
        setError(
          e instanceof Error ? e.message : "Search is unavailable. Try again.",
        );
    } finally {
      if (current === version.current) setBusy(false);
    }
  };
  const tour = () => {
    version.current++;
    setLocationRequested(false);
    setBusy(false);
    setError("");
    setSearch("");
    setCategory("All places");
    setSource("tour");
    const examples = stored.filter(
      (p) => !p.id.startsWith("osm-") && p.status !== "blocked",
    );
    setPlaces(examples);
    if (examples[0]) focus(examples[0]);
  };
  const searchField = (
    <View style={styles.search}>
      <Search size={20} color={ask.inkSoft} />
      <TextInput
        ref={input}
        accessibilityLabel="Search places in the USA"
        value={search}
        onChangeText={(value) => {
          version.current++;
          setBusy(false);
          setSearch(value);
          setError("");
        }}
        onSubmitEditing={submit}
        returnKeyType="search"
        placeholder="A place, a city, a little adventure…"
        placeholderTextColor="#798078"
        style={styles.input}
      />
      {!!search && (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => setSearch("")}
          style={styles.clear}
        >
          <X size={17} color={ask.ink} />
        </MotionPressable>
      )}
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel="Search USA places"
        onPress={submit}
        disabled={busy || search.trim().length < 3}
        style={styles.searchGo}
      >
        {busy ? (
          <ActivityIndicator color={ask.ink} />
        ) : (
          <ArrowRight size={21} color={ask.ink} />
        )}
      </MotionPressable>
    </View>
  );
  const categoryBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
    >
      {filters.map(({ name, label }) => (
        <MotionPressable
          key={name}
          accessibilityRole="button"
          accessibilityState={{ selected: category === name }}
          onPress={() => {
            setCategory(name);
            setSelectedId(null);
            if (source !== "start") setExpanded(true);
            else input.current?.focus();
          }}
          style={[styles.filter, category === name && styles.filterActive]}
        >
          <TactileIcon
            category={name}
            size={28}
            icon={name === "All places" ? Compass : undefined}
          />
          <Text
            style={[
              styles.filterText,
              category === name && { color: "#FFFFFF" },
            ]}
          >
            {label}
          </Text>
        </MotionPressable>
      ))}
    </ScrollView>
  );
  const content = (
    <>
      {!!(error || location.error) && (
        <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.error}>
            {error || location.error}
          </Text>
        </View>
      )}
      {source === "start" ? (
        <>
          <LinearGradient
            colors={["#EEE5FF", "#D7C7F3"]}
            style={styles.welcome}
          >
            <View style={styles.halo} />
            <View style={styles.haloSmall} />
            <Text style={styles.eyebrow}>LESS GUESSING. MORE GOING.</Text>
            <Text style={styles.welcomeTitle}>
              Good plans.{`\n`}Better intel.
            </Text>
            <Text style={styles.welcomeBody}>
              A little look before{`\n`}you head out.
            </Text>
            <View style={styles.heroScout}>
              <BrandObject size={132} playful />
            </View>
          </LinearGradient>
          <MotionPressable
            accessibilityRole="button"
            onPress={locate}
            style={styles.primary}
            disabled={location.loading}
          >
            <Text style={styles.primaryText}>
              {location.loading
                ? "Finding your little corner…"
                : "Find places near me"}
            </Text>
            {location.loading ? (
              <ActivityIndicator color={ask.ink} />
            ) : (
              <LocateFixed size={21} color={ask.ink} />
            )}
          </MotionPressable>
          <Text style={styles.privacy}>
            Uses your location to find places. Or search any US city.
          </Text>
          <View style={styles.startLinks}>
            <MotionPressable
              accessibilityRole="button"
              onPress={tour}
              style={styles.textButton}
            >
              <Text style={styles.link}>Take the NYC sample tour</Text>
              <ArrowUpRight size={14} color={ask.ink} />
            </MotionPressable>
            <MotionPressable
              accessibilityRole="button"
              onPress={() => router.push("/about")}
              style={styles.textButton}
            >
              <Text style={styles.link}>How it works</Text>
            </MotionPressable>
          </View>
          {desktop && (
            <View style={styles.steps}>
              <Text style={styles.eyebrow}>YOUR NEXT GOOD DECISION</Text>
              {[
                ["01", "Pick a place", "The court, the café, the corner shop."],
                [
                  "02",
                  "Ask a little question",
                  "The line? The crowd? The thing you need?",
                ],
                [
                  "03",
                  "Get a look from there",
                  "Try the sample flow while we build the network.",
                ],
              ].map(([n, title, body]) => (
                <View key={n} style={styles.step}>
                  <Text style={styles.stepNumber}>{n}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{title}</Text>
                    <Text style={styles.small}>{body}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : selected && (!expanded || desktop) ? (
        <>
          <MotionPressable
            accessibilityRole="button"
            onPress={() => {
              setSelectedId(null);
              setExpanded(true);
            }}
            style={styles.textButton}
          >
            <ChevronDown size={16} color={ask.ink} />
            <Text style={styles.link}>All {results.length} places</Text>
          </MotionPressable>
          <LinearGradient
            colors={[categoryPalette(categoryFor(selected)).light, "#FFFDF5"]}
            style={styles.placeCard}
          >
            <View style={styles.placeTop}>
              <CategoryObject place={selected} category={categoryFor(selected)} size={60} />
              <Text style={[styles.eyebrow, { flex: 1, marginLeft: 14 }]}>
                {categoryFor(selected).toUpperCase()}
              </Text>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel={`${saved.includes(selected.id) ? "Unsave" : "Save"} ${selected.name}`}
                onPress={() => {
                  const state = useYonderStore.getState();
                  state.addPlace(selected);
                  state.toggleSavedPlace(selected.id);
                }}
                style={styles.save}
              >
                <Heart
                  size={21}
                  color={ask.ink}
                  fill={saved.includes(selected.id) ? ask.ink : "transparent"}
                />
              </MotionPressable>
            </View>
            <Text style={styles.placeName} numberOfLines={2}>
              {selected.name}
            </Text>
            <Text style={styles.area} numberOfLines={2}>
              {selected.area}
            </Text>
            <View style={styles.question}>
              <Text style={styles.questionText}>{questionFor(selected)}</Text>
              <Sparkles size={16} color="#9A79B1" />
            </View>
          </LinearGradient>
          <MotionPressable
            accessibilityRole="button"
            onPress={() => openPlaceDraft(selected, router)}
            style={styles.primary}
          >
            <Text style={styles.primaryText}>Ask about this place</Text>
            <ArrowUpRight size={21} color={ask.ink} />
          </MotionPressable>
          <Text style={styles.privacy}>
            {source === "tour"
              ? "Sample tour · try a request with demo credits."
              : "Real place · requests currently run as a local demo."}
          </Text>
        </>
      ) : (
        <>
          <View style={styles.resultsHeading}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>
                {source === "tour"
                  ? "THE NYC SAMPLE TOUR"
                  : source === "nearby"
                    ? "YOUR LITTLE CORNER"
                    : "A LITTLE FURTHER AFIELD"}
              </Text>
              <Text style={styles.resultTitle}>
                {busy
                  ? "Looking around…"
                  : source === "nearby"
                    ? "Around here"
                    : source === "tour"
                      ? "Try a little look"
                      : "Found your next stop?"}
              </Text>
            </View>
            <View style={styles.count}>
              <Text style={styles.countText}>
                {busy ? "…" : results.length}
              </Text>
            </View>
          </View>
          <Text style={styles.small}>
            {source === "tour"
              ? "Example places and sample answers."
              : "Places from OpenStreetMap. Live answers arrive when the network launches."}
          </Text>
          {busy ? (
            <View style={styles.loading}>
              <BrandObject kind="map" size={155} />
              <ActivityIndicator color={ask.ink} />
            </View>
          ) : results.length ? (
            results.map((place) => (
              <MotionPressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={`Show ${place.name} on map`}
                onPress={() => focus(place)}
                style={styles.result}
              >
                <CategoryObject place={place} category={categoryFor(place)} size={56} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName} numberOfLines={2}>
                    {place.name}
                  </Text>
                  <Text style={styles.area} numberOfLines={1}>
                    {location.fix
                      ? `${(distanceMeters(location.fix, { latitude: place.lat, longitude: place.lng }) / 1609.344).toFixed(1)} mi · `
                      : ""}
                    {place.area}
                  </Text>
                </View>
                <ArrowUpRight size={18} color={ask.ink} />
              </MotionPressable>
            ))
          ) : (
            <View style={styles.empty}>
              <BrandObject kind="map" size={140} />
              <Text style={styles.stepTitle}>
                {error ? "A small detour." : "A little further out?"}
              </Text>
              <Text style={[styles.small, { textAlign: "center" }]}>
                Try another category, search a place and city, or move the map
                and search that area.
              </Text>
            </View>
          )}
        </>
      )}
    </>
  );
  return (
    <View
      style={styles.root}
      onLayout={(e) => setAvailableHeight(e.nativeEvent.layout.height)}
    >
      <View style={[styles.mapFrame, desktop && styles.desktopMap]}>
        <MapSurface
          ref={map}
          initialRegion={USA}
          style={StyleSheet.absoluteFill}
          markers={results.map((p) => ({
            id: p.id,
            label: p.name,
            active: p.id === selectedId,
            coordinate: { latitude: p.lat, longitude: p.lng },
            onPress: () => focus(p),
          }))}
          userLocation={location.fix}
          controlsInset={{
            top: desktop ? 80 : insets.top + 170,
            bottom: desktop ? 20 : peek + 14,
          }}
          onRegionChangeComplete={(region) => {
            center.current = region;
            setMapMoved(true);
          }}
        />
        {desktop && source === "start" && (
          <View pointerEvents="box-none" style={styles.mapManifesto}>
            <View style={styles.manifestoPill}>
              <MapPin size={14} color={ask.ink} />
              <Text style={styles.link}>
                A whole country of little possibilities
              </Text>
            </View>
            <Text style={styles.manifestoTitle}>
              Go on.{`\n`}Get out there.
            </Text>
            <View pointerEvents="none" style={styles.manifestoArt}>
              <BrandObject kind="outside" size={280} />
              <View
                style={{
                  position: "absolute",
                  left: -65,
                  top: 120,
                  transform: [{ rotate: "-13deg" }],
                }}
              >
                <BrandObject kind="coffee" size={135} delay={350} />
              </View>
              <View
                style={{
                  position: "absolute",
                  right: -10,
                  top: 200,
                  transform: [{ rotate: "12deg" }],
                }}
              >
                <BrandObject kind="shopping" size={150} delay={700} />
              </View>
            </View>
          </View>
        )}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={["#F8F6EE", "#F8F6EE00"]}
        style={[styles.topFade, { height: desktop ? 90 : 200 }]}
      />
      <View
        style={[
          styles.top,
          { paddingTop: insets.top + 12 },
          desktop && styles.desktopTop,
        ]}
      >
        <View style={styles.brandRow}>
          <View style={styles.brand}>
            <Scout size={30} />
            <Text style={styles.logo}>yonder.</Text>
          </View>
          {desktop && (
            <View style={styles.desktopNav}>
              {(
                [
                  ["/", "Explore"],
                  ["/activity", "Requests"],
                  ["/saved", "Saved"],
                  ["/observe", "Scout"],
                ] as const
              ).map(([route, label]) => (
                <MotionPressable
                  key={route}
                  accessibilityRole="button"
                  onPress={() => navigate(route)}
                  style={[styles.navItem, route === "/" && styles.navActive]}
                >
                  <Text
                    style={[
                      styles.navText,
                      route === "/" && { color: "#FFFFFF" },
                    ]}
                  >
                    {label}
                  </Text>
                </MotionPressable>
              ))}
            </View>
          )}
          <MotionPressable
            accessibilityRole="button"
            accessibilityLabel="How Yonder works"
            onPress={() => router.push("/about")}
            style={styles.access}
          >
            <View style={styles.dot} />
            <Text style={styles.accessText}>HOW IT WORKS</Text>
          </MotionPressable>
        </View>
        {!desktop && (
          <>
            {searchField}
            {categoryBar}
          </>
        )}
      </View>
      {desktop && <View style={styles.desktopSearch}>{searchField}</View>}
      <MotionPressable accessibilityRole="button" accessibilityLabel="Drop a pin for a new spot" onPress={() => router.push({ pathname: "/spots/new", params: { lat: String(center.current.latitude), lng: String(center.current.longitude), delta: String(center.current.latitudeDelta) } })} style={{ position: "absolute", right: 78, bottom: desktop ? 35 : peek + 38, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#F7EDB3", paddingHorizontal: 15, height: 46, borderRadius: 17, boxShadow: "0 3px 0 #CBB949" }}><MapPin size={19} color={ask.ink}/><Text style={{fontFamily: font.ui700, fontSize: 13, color: ask.ink}}>Drop a pin</Text></MotionPressable>
      {(source !== "start" || !desktop) && (
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Use my location"
          onPress={locate}
          style={[styles.locate, { bottom: desktop ? 35 : peek + 38 }]}
        >
          {location.loading ? (
            <ActivityIndicator color={ask.ink} />
          ) : (
            <LocateFixed size={23} color={ask.ink} />
          )}
        </MotionPressable>
      )}
      {source !== "start" && mapMoved && (
        <MotionPressable
          accessibilityRole="button"
          onPress={() =>
            void loadNearby(center.current.latitude, center.current.longitude)
          }
          disabled={busy}
          style={[
            styles.searchArea,
            {
              top: desktop ? 105 : insets.top + 181,
              left: desktop ? undefined : undefined,
              right: desktop ? 40 : 75,
            },
          ]}
        >
          <Search size={15} color={ask.ink} />
          <Text style={styles.link}>Search this area</Text>
        </MotionPressable>
      )}
      {desktop ? (
        <View style={styles.desktopPanel}>
          <View style={{ paddingHorizontal: 18, paddingTop: 10 }}>
            {categoryBar}
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.desktopBody}
          >
            {content}
          </ScrollView>
        </View>
      ) : (
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View {...drag.panHandlers}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={
                expanded ? "Collapse places" : "Expand places"
              }
              onPress={() => setExpanded(!expanded)}
              style={styles.handleTouch}
            >
              <View style={styles.handle} />
            </MotionPressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetBody}
          >
            {content}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F2E9" },
  mapFrame: { ...StyleSheet.absoluteFill },
  desktopMap: {
    left: 458,
    top: 86,
    right: 20,
    bottom: 20,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    boxShadow: "0 10px 35px #34483412",
  },
  topFade: { position: "absolute", left: 0, right: 0, top: 0 },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 12,
  },
  desktopTop: { paddingHorizontal: 28 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 5 },
  logo: {
    fontFamily: font.black,
    fontSize: 31,
    letterSpacing: -1.4,
    color: ask.ink,
  },
  access: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 11,
    borderRadius: 20,
    backgroundColor: "#FFFDF4",
    borderWidth: 1,
    borderColor: "#E6E4D8",
  },
  accessText: {
    fontFamily: font.ui700,
    fontSize: 9,
    letterSpacing: 0.6,
    color: "#64705C",
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#94AA73" },
  desktopNav: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#E9E8DD",
    borderRadius: 24,
    padding: 4,
  },
  navItem: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  navActive: { backgroundColor: ask.ink, boxShadow: "0 3px 6px #1C352322" },
  navText: { fontFamily: font.ui600, fontSize: 12, color: ask.ink },
  search: {
    height: 56,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFDF8",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 6,
    gap: 8,
    boxShadow: "0 5px 0 #DCDCD080, 0 9px 22px #34483416",
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    fontFamily: font.ui500,
    fontSize: 14,
    color: ask.ink,
  },
  searchGo: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#F6DE65",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFED9B",
    boxShadow: "0 3px 0 #CEB947",
  },
  clear: {
    width: 28,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: { gap: 8, paddingBottom: 7, paddingTop: 2 },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 6,
    paddingRight: 13,
    minHeight: 43,
    borderRadius: 17,
    backgroundColor: "#FFFDF6",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    boxShadow: "0 3px 0 #D5D7CA70",
  },
  filterActive: { backgroundColor: "#354D3C", borderColor: "#627A60" },
  filterText: { fontFamily: font.ui700, fontSize: 11, color: ask.ink },
  desktopSearch: { position: "absolute", left: 24, top: 87, width: 412 },
  desktopPanel: {
    position: "absolute",
    left: 24,
    top: 157,
    bottom: 20,
    width: 412,
    borderRadius: 28,
    backgroundColor: "#FFFDF8",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    boxShadow: "0 8px 30px #3448340D",
    overflow: "hidden",
  },
  desktopBody: { padding: 18, paddingTop: 6, paddingBottom: 25 },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFDF7",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    boxShadow: "0 -8px 32px #354D3C20",
    overflow: "hidden",
  },
  handleTouch: { height: 24, alignItems: "center", justifyContent: "center" },
  handle: { width: 35, height: 4, borderRadius: 3, backgroundColor: "#CECDBD" },
  sheetBody: { paddingHorizontal: 16, paddingBottom: 16 },
  welcome: {
    borderRadius: 23,
    padding: 18,
    minHeight: 170,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F6EEFF",
    marginBottom: 13,
  },
  halo: {
    position: "absolute",
    right: -15,
    top: 0,
    width: 190,
    height: 190,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#FFFFFF70",
  },
  haloSmall: {
    position: "absolute",
    right: 15,
    top: 30,
    width: 130,
    height: 130,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "#FFFFFF80",
  },
  eyebrow: {
    fontFamily: font.ui700,
    fontSize: 9,
    letterSpacing: 1,
    color: "#64704E",
  },
  welcomeTitle: {
    fontFamily: font.ui700,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -1.3,
    color: "#354331",
    marginTop: 9,
  },
  welcomeBody: {
    fontFamily: font.ui500,
    fontSize: 12,
    lineHeight: 17,
    color: "#666B59",
    marginTop: 9,
  },
  heroScout: {
    position: "absolute",
    right: -15,
    top: 0,
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scaleX: -1 }],
  },
  primary: {
    minHeight: 51,
    borderRadius: 18,
    backgroundColor: "#F4D95F",
    borderWidth: 1.5,
    borderColor: "#FFEB90",
    boxShadow: "0 4px 0 #C5B04A, 0 8px 14px #897C3220",
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 7,
  },
  primaryText: { fontFamily: font.ui700, fontSize: 14, color: ask.ink },
  privacy: {
    fontFamily: font.ui400,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
    color: "#7A7C6D",
    marginTop: 6,
  },
  startLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 5,
  },
  textButton: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  link: { fontFamily: font.ui600, fontSize: 10, color: ask.ink },
  steps: { marginTop: 27, gap: 18, paddingHorizontal: 5 },
  step: { flexDirection: "row", gap: 13, alignItems: "center" },
  stepNumber: {
    fontFamily: font.ui700,
    fontSize: 12,
    color: "#7F7794",
    width: 32,
    height: 32,
    textAlign: "center",
    lineHeight: 32,
    borderRadius: 11,
    backgroundColor: "#EEE7F5",
  },
  stepTitle: { fontFamily: font.ui700, fontSize: 15, color: ask.ink },
  small: {
    fontFamily: font.ui400,
    fontSize: 11,
    lineHeight: 17,
    color: "#7B8074",
    marginTop: 5,
  },
  mapManifesto: { position: "absolute", top: 30, left: 30, right: 30 },
  manifestoPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    backgroundColor: "#FFFDF5ED",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  manifestoTitle: {
    fontFamily: font.ui700,
    fontSize: 48,
    lineHeight: 51,
    letterSpacing: -2.5,
    color: "#354D3C",
    marginTop: 20,
    textShadowColor: "#FFFDF7",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  manifestoArt: { position: "absolute", right: -20, top: 130 },
  locate: {
    position: "absolute",
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: "#FFFDF6",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 0 #CCD2BD, 0 8px 16px #34483422",
  },
  searchArea: {
    position: "absolute",
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    backgroundColor: "#FFFEF7",
    padding: 13,
    borderRadius: 19,
    boxShadow: "0 4px 10px #34483420",
  },
  placeCard: {
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 16,
    marginBottom: 13,
  },
  placeTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  save: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFFB0",
    alignItems: "center",
    justifyContent: "center",
  },
  placeName: {
    fontFamily: font.ui700,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.8,
    color: ask.ink,
  },
  area: {
    fontFamily: font.ui400,
    fontSize: 11,
    lineHeight: 16,
    color: "#767E70",
    marginTop: 5,
  },
  question: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#FFFFFFB0",
    borderRadius: 12,
    padding: 12,
    marginTop: 13,
  },
  questionText: {
    fontFamily: font.ui500,
    fontSize: 12,
    lineHeight: 18,
    color: ask.ink,
    flex: 1,
  },
  resultsHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  resultTitle: {
    fontFamily: font.ui700,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -1,
    color: ask.ink,
    marginTop: 6,
  },
  count: {
    width: 35,
    height: 35,
    borderRadius: 13,
    backgroundColor: "#EDE4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontFamily: font.ui700, fontSize: 13, color: "#74608A" },
  result: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 13,
    marginTop: 10,
    backgroundColor: "#F5F4ED",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E9E9DE",
  },
  resultName: {
    fontFamily: font.ui700,
    fontSize: 13,
    lineHeight: 18,
    color: ask.ink,
  },
  loading: { alignItems: "center", padding: 20 },
  empty: { alignItems: "center", paddingVertical: 18, gap: 8 },
  errorBox: {
    padding: 12,
    backgroundColor: "#F9E8DC",
    borderRadius: 14,
    marginBottom: 10,
  },
  error: {
    fontFamily: font.ui500,
    fontSize: 12,
    lineHeight: 18,
    color: "#7C4536",
  },
});
