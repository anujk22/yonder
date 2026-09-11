import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, Check, Search } from "lucide-react-native";
import { AppScreen, PrimaryButton, ScreenHeader } from "@/components/ui";
import {
  MapSurface,
  MapSurfaceHandle,
  MapRegion,
  MapCoordinate,
} from "@/components/MapSurface";
import { BrandImage } from "@/components/BrandImage";
import { MotionPressable } from "@/components/MotionPressable";
import { useYonderStore } from "@/lib/store";
import {
  SPOT_KINDS,
  SpotKind,
  createCommunitySpot,
  validateSpot,
} from "@/lib/communitySpots";
import { searchWorldPlaces } from "@/lib/worldSearch";
import { Place } from "@/lib/places";
import { ask, font } from "@/lib/theme";

export default function NewSpotScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    delta?: string;
  }>();
  const latitude = Number(params.lat),
    longitude = Number(params.lng),
    delta = Number(params.delta);
  const initial: MapRegion = {
    latitude: Number.isFinite(latitude) ? latitude : 39.5,
    longitude: Number.isFinite(longitude) ? longitude : -98.35,
    latitudeDelta: Number.isFinite(delta) && delta > 0 ? delta : 27,
    longitudeDelta: Number.isFinite(delta) && delta > 0 ? delta : 48,
  };
  const map = useRef<MapSurfaceHandle>(null);
  const region = useRef(initial);
  const [point, setPoint] = useState<MapCoordinate | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<SpotKind>("park");
  const [publicAccess, setPublicAccess] = useState(false);
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("Find the area, then tap the exact spot.");
  const searchVersion = useRef(0);
  const saving = useRef(false);
  useEffect(
    () => () => {
      searchVersion.current++;
    },
    [],
  );
  const find = async () => {
    const version = ++searchVersion.current;
    if (search.trim().length < 3) {
      setError("Enter a neighborhood, address, or nearby landmark.");
      setBusy(false);
      return;
    }
    setBusy(true);
    setError("");
    setMatches([]);
    try {
      const found = await searchWorldPlaces(search.trim());
      if (searchVersion.current !== version) return;
      setMatches(found.slice(0, 4));
      if (!found.length)
        setError(
          "No matching areas found. Try a nearby street or move the map.",
        );
    } catch {
      if (searchVersion.current === version)
        setError(
          "Search is unavailable. You can still move the map and place a pin.",
        );
    } finally {
      if (searchVersion.current === version) setBusy(false);
    }
  };
  const pick = (coordinate: MapCoordinate) => {
    if (region.current.latitudeDelta > 0.06) {
      const next = {
        ...coordinate,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };
      region.current = next;
      map.current?.animateToRegion(next);
      setHint("Now tap the exact entrance, court, or meeting spot.");
      return;
    }
    setPoint(coordinate);
    setHint("Pin placed. Tap elsewhere to adjust it.");
    setError("");
  };
  const save = () => {
    if (saving.current) return;
    const draft = { name, description, kind, coordinate: point, publicAccess };
    const issue = validateSpot(draft);
    if (issue) {
      setError(issue);
      return;
    }
    saving.current = true;
    const place = createCommunitySpot(
      draft,
      `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    );
    const state = useYonderStore.getState();
    state.addPlace(place);
    state.toggleSavedPlace(place.id);
    state.setResolvedPlace(place.id);
    state.setDraftQuestion("");
    state.setDeadline(10);
    state.setTargetHint("");
    router.replace("/ask/place");
  };
  return (
    <AppScreen
      footer={
        <View>
          {Boolean(error) && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          <PrimaryButton label="Save spot & ask here" onPress={save} />
        </View>
      }
    >
      <ScreenHeader eyebrow="A LITTLE PLACE OF YOUR OWN" title="Drop a pin" />
      <Text style={styles.copy}>
        The court behind the trees. The picnic tables by the creek. Give your
        spot a name so someone can find it.
      </Text>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="Find an area for your pin"
          value={search}
          onChangeText={setSearch}
          placeholder="Neighborhood, address, or landmark"
          placeholderTextColor={ask.inkSoft}
          returnKeyType="search"
          onSubmitEditing={find}
          style={styles.search}
        />
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Search for an area"
          onPress={find}
          style={styles.searchButton}
        >
          {busy ? (
            <ActivityIndicator color={ask.ink} />
          ) : (
            <Search size={20} color={ask.ink} />
          )}
        </MotionPressable>
      </View>
      {matches.map((place) => (
        <MotionPressable
          key={place.id}
          accessibilityRole="button"
          onPress={() => {
            const next = {
              latitude: place.lat,
              longitude: place.lng,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            };
            region.current = next;
            map.current?.animateToRegion(next);
            setMatches([]);
            setHint("Tap the exact spot near this landmark.");
          }}
          style={styles.match}
        >
          <Text style={styles.label}>{place.name}</Text>
          <Text style={styles.small}>{place.area}</Text>
        </MotionPressable>
      ))}
      <View style={styles.map}>
        <MapSurface
          ref={map}
          style={StyleSheet.absoluteFill}
          initialRegion={initial}
          onRegionChangeComplete={(next) => {
            region.current = next;
          }}
          onMapPress={pick}
          markers={
            point
              ? [
                  {
                    id: "new-pin",
                    coordinate: point,
                    active: true,
                    label: name.trim() || "Your spot",
                  },
                ]
              : []
          }
          geofence={point ? { center: point, radius: 50 } : undefined}
        />
      </View>
      <View style={styles.hint}>
        <MapPin size={16} color={ask.inkSoft} />
        <Text style={[styles.small, { flex: 1 }]}>
          {hint}
          {point
            ? `\n${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)} · 50 m check area`
            : ""}
        </Text>
      </View>
      <Text style={styles.label}>What kind of spot?</Text>
      <View style={styles.kinds}>
        {SPOT_KINDS.map((item) => (
          <MotionPressable
            key={item.kind}
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityState={{ checked: kind === item.kind }}
            onPress={() => setKind(item.kind)}
            style={[styles.kind, kind === item.kind && styles.selected]}
          >
            <BrandImage kind={item.object} size={42} />
            <Text style={styles.small}>{item.label}</Text>
          </MotionPressable>
        ))}
      </View>
      <Text style={styles.label}>Spot name</Text>
      <TextInput
        accessibilityLabel="Spot name"
        value={name}
        onChangeText={setName}
        maxLength={60}
        placeholder="Creekside picnic tables"
        placeholderTextColor={ask.inkSoft}
        style={styles.input}
      />
      <Text style={styles.label}>How can someone recognize it?</Text>
      <TextInput
        accessibilityLabel="Spot description and landmarks"
        value={description}
        onChangeText={setDescription}
        maxLength={300}
        multiline
        placeholder="Three tables beside the wooden footbridge. Use the public path from Oak Street."
        placeholderTextColor={ask.inkSoft}
        style={[styles.input, { minHeight: 108, textAlignVertical: "top" }]}
      />
      <MotionPressable
        accessibilityRole="checkbox"
        accessibilityLabel="This spot is open to the public, and the pin and description are accurate"
        accessibilityState={{ checked: publicAccess }}
        onPress={() => setPublicAccess(!publicAccess)}
        style={styles.confirm}
      >
        <View style={[styles.check, publicAccess && styles.selected]}>
          {publicAccess && <Check size={17} color={ask.ink} />}
        </View>
        <Text style={[styles.copy, { flex: 1, marginBottom: 0 }]}>
          This spot is open to the public, and the pin and description are
          accurate.
        </Text>
      </MotionPressable>
      <Text style={styles.small}>
        Saved on this device as an unverified community pin. Scouts must match
        the landmarks and capture fresh photos nearby. This does not publish a
        shared map listing.
      </Text>
    </AppScreen>
  );
}
const styles = StyleSheet.create({
  copy: {
    fontFamily: font.ui400,
    fontSize: 14,
    lineHeight: 22,
    color: ask.inkSoft,
    marginBottom: 18,
  },
  label: {
    fontFamily: font.ui700,
    fontSize: 14,
    color: ask.ink,
    marginBottom: 8,
  },
  small: {
    fontFamily: font.ui500,
    fontSize: 12,
    lineHeight: 18,
    color: ask.inkSoft,
  },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  search: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.ui400,
    fontSize: 13,
    color: ask.ink,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 13,
  },
  searchButton: {
    width: 45,
    borderRadius: 15,
    backgroundColor: ask.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  match: {
    padding: 12,
    backgroundColor: "#EEE5F7",
    borderRadius: 13,
    marginBottom: 6,
  },
  map: { height: 290, borderRadius: 24, overflow: "hidden" },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginVertical: 13,
  },
  kinds: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  kind: {
    alignItems: "center",
    width: 67,
    padding: 7,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E2D9",
  },
  selected: { backgroundColor: "#F7EDB3", borderColor: "#CBB949" },
  input: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E2D9",
    borderRadius: 17,
    fontFamily: font.ui400,
    fontSize: 15,
    color: ask.ink,
    marginBottom: 18,
  },
  confirm: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 17,
  },
  check: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: "#B8BEB4",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: font.ui600,
    fontSize: 14,
    lineHeight: 22,
    color: ask.danger,
    marginBottom: 10,
  },
});
