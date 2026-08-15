import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  detailRegion,
  LOWER_MANHATTAN_REGION,
  MapSurface,
  MapSurfaceHandle,
} from '@/components/MapSurface';
import { Glyph } from '@/components/Glyph';
import {
  SEARCH_DISTANCE_MI,
  SEARCH_PLACE_NAME,
  searchPlaces,
} from '@/lib/places';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

export default function AskSearchScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const mapRef = useRef<MapSurfaceHandle>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState('');
  const [navigatingPlaceId, setNavigatingPlaceId] = useState<string | null>(null);
  const places = useYonderStore((state) => state.places);
  const answers = useYonderStore((state) => state.answers);
  const setDraftQuestion = useYonderStore((state) => state.setDraftQuestion);
  const setResolvedPlace = useYonderStore((state) => state.setResolvedPlace);
  const setTargetHint = useYonderStore((state) => state.setTargetHint);
  const results = useMemo(() => searchPlaces(search), [search]);
  const hasSearch = search.length > 0;
  const markers = useMemo(
    () => answers.flatMap((answer) => {
      const place = places.find((candidate) => candidate.id === answer.placeId);
      return place
        ? [{ id: answer.id, coordinate: { latitude: place.lat, longitude: place.lng }, label: place.name }]
        : [];
    }),
    [answers, places],
  );

  useEffect(() => () => {
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
  }, []);

  const selectPlace = (placeId: string, lat: number, lng: number) => {
    if (navigatingPlaceId) return;
    Keyboard.dismiss();
    Haptics.selectionAsync();
    setNavigatingPlaceId(placeId);
    setResolvedPlace(placeId);
    setDraftQuestion('');
    setTargetHint('');
    mapRef.current?.animateToRegion(detailRegion({ latitude: lat, longitude: lng }), 600);
    navigationTimer.current = setTimeout(() => router.push({ pathname: '/ask/place' }), 600);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <MapSurface
        ref={mapRef}
        mode="ask"
        initialRegion={LOWER_MANHATTAN_REGION}
        markers={markers}
        style={styles.map}
      />

      <Animated.View
        entering={FadeInDown.springify().damping(18).stiffness(140)}
        layout={LinearTransition.springify().damping(18).stiffness(140)}
        style={[styles.sheet, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}
      >
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <View style={[styles.observerBand, { backgroundColor: theme.accent }]}>
          <Text style={[type.mono, styles.observerCount, { color: theme.onAccent }]}>1,847 observers active in NYC</Text>
        </View>

        {!hasSearch ? (
          <Animated.Text
            entering={FadeInDown.springify().damping(18).stiffness(140)}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            numberOfLines={1}
            style={[type.serifTitle, styles.title, { color: theme.ink }]}
          >
            Where do you want to see?
          </Animated.Text>
        ) : null}

        <View style={[styles.searchField, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <SearchIcon color={theme.ink} />
          <TextInput
                  accessibilityLabel="Search for a place"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setSearch}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Search a place"
            placeholderTextColor={theme.inkFaint}
            returnKeyType="search"
            selectionColor={theme.accent}
            style={[type.mono, styles.searchInput, { color: theme.ink }]}
            value={search}
          />
          {hasSearch ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
              onPress={() => {
                Haptics.selectionAsync();
                setSearch('');
              }}
              style={[styles.clearButton, { backgroundColor: theme.surfaceAlt }]}
            >
              <Glyph name="close" color={theme.inkSoft} size={16} strokeWidth={2.2} />
            </Pressable>
          ) : null}
        </View>

        {hasSearch ? (
          <Animated.View entering={FadeInDown.springify().damping(18).stiffness(140)} style={styles.results}>
            {results.map((place, index) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                accessibilityLabel={`${SEARCH_PLACE_NAME[place.id] ?? place.name}, ${place.area}`}
                disabled={navigatingPlaceId !== null}
                onPress={() => selectPlace(place.id, place.lat, place.lng)}
                style={({ pressed }) => [
                  styles.resultRow,
                  index < results.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  { opacity: navigatingPlaceId === place.id ? 0.45 : pressed ? 0.65 : 1 },
                ]}
              >
                <PlacePin color={theme.accent} centerColor={theme.surface} />
                <View style={styles.resultCopy}>
                  <Text style={[type.serifHeading, styles.resultName, { color: theme.ink }]} numberOfLines={1}>
                    {SEARCH_PLACE_NAME[place.id] ?? place.name}
                  </Text>
                  <Text style={[type.mono, styles.resultMeta, { color: theme.inkSoft }]} numberOfLines={1}>
                    {place.area} · {SEARCH_DISTANCE_MI[place.id] ?? 'Nearby'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="m15.5 15.5 5 5" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function PlacePin({ color, centerColor }: { color: string; centerColor: string }) {
  return (
    <View style={styles.pinIconFrame}>
      <View style={[styles.pinIcon, { backgroundColor: color }]}>
        <View style={[styles.pinCenter, { backgroundColor: centerColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  map: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '55%',
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: space.sm,
    paddingHorizontal: 28,
    paddingBottom: 96,
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
  },
  handle: { width: 34, height: 4, borderRadius: radii.pill, alignSelf: 'center', marginBottom: space.lg },
  observerBand: { marginHorizontal: -28, paddingHorizontal: 28, paddingVertical: 10 },
  observerCount: { fontSize: 11, lineHeight: 17, letterSpacing: 1.1 },
  title: { marginTop: space.md, marginBottom: space.lg, fontSize: 27, lineHeight: 34, letterSpacing: -0.5 },
  searchField: {
    minHeight: 56,
    borderRadius: radii.small,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    marginTop: space.md,
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontSize: 16, lineHeight: 22 },
  clearButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  results: { marginTop: space.md },
  resultRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 7, paddingHorizontal: space.xs },
  resultCopy: { flex: 1, gap: 3 },
  resultName: { fontSize: 24, lineHeight: 28 },
  resultMeta: { fontSize: 11, lineHeight: 16 },
  pinIconFrame: { width: 34, height: 42, alignItems: 'center', justifyContent: 'center' },
  pinIcon: { width: 26, height: 26, borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomRightRadius: 13, borderBottomLeftRadius: 3, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  pinCenter: { width: 9, height: 9, borderRadius: 5 },
});
