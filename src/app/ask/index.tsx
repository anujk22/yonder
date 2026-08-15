import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import {
  detailRegion,
  LOWER_MANHATTAN_REGION,
  MapSurface,
  MapSurfaceHandle,
} from '@/components/MapSurface';
import { Glyph } from '@/components/Glyph';
import { YMark } from '@/components/YMark';
import {
  SEARCH_DISTANCE_MI,
  SEARCH_PLACE_NAME,
  searchPlaces,
} from '@/lib/places';
import { DEMO_FLAGS } from '@/lib/demoFlags';
import { registerAutopilotAbortHandler, registerAutopilotTarget, startAutopilot, useAutopilotTextTarget } from '@/lib/autopilot';
import { isUnsafeQuestion } from '@/lib/safety';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

export default function AskSearchScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { autopilotDuplicate } = useLocalSearchParams<{ autopilotDuplicate?: string }>();
  const insets = useSafeAreaInsets();
  const theme = useActiveTheme();
  const mapRef = useRef<MapSurfaceHandle>(null);
  const searchRef = useRef<TextInput>(null);
  const resultRefs = useRef<Record<string, View | null>>({});
  const duplicateStarted = useRef(false);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState('');
  const [navigatingPlaceId, setNavigatingPlaceId] = useState<string | null>(null);
  const [showResetToast, setShowResetToast] = useState(false);
  const places = useYonderStore((state) => state.places);
  const answers = useYonderStore((state) => state.answers);
  const setDraftQuestion = useYonderStore((state) => state.setDraftQuestion);
  const setResolvedPlace = useYonderStore((state) => state.setResolvedPlace);
  const setTargetHint = useYonderStore((state) => state.setTargetHint);
  const setDeadline = useYonderStore((state) => state.setDeadline);
  const createDraftQuery = useYonderStore((state) => state.createDraftQuery);
  const resetDemo = useYonderStore((state) => state.resetDemo);
  const results = useMemo(() => searchPlaces(search), [search]);
  const hasSearch = search.length > 0;
  const markers = useMemo(
    () => answers.flatMap((answer) => {
      const place = places.find((candidate) => candidate.id === answer.placeId);
      return place
        ? [{
            id: answer.id,
            coordinate: { latitude: place.lat, longitude: place.lng },
            label: place.name,
            testID: `ask-marker-${place.id}`,
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/ask/answer/${answer.id}`);
            },
          }]
        : [];
    }),
    [answers, places],
  );

  useEffect(() => () => {
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => {
    const unregisterAbort = registerAutopilotAbortHandler(() => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
      navigationTimer.current = null;
    });
    return () => { unregisterAbort(); };
  }, []);

  useEffect(() => {
    if (!DEMO_FLAGS.autopilotEnabled || autopilotDuplicate !== '1' || duplicateStarted.current) return;
    duplicateStarted.current = true;
    setDraftQuestion('Are any basketball courts free?');
    setResolvedPlace('pier2');
    setDeadline(10);
    setTargetHint('');
    const queryId = createDraftQuery();
    if (queryId) router.replace('/ask/options');
  }, [autopilotDuplicate, createDraftQuery, router, setDeadline, setDraftQuestion, setResolvedPlace, setTargetHint]);

  const handleDemoReset = () => {
    // DEMO: deterministic path for recording. Real implementation below.
    if (!DEMO_FLAGS.enableDemoReset) return;
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
    resetDemo();
    setSearch('');
    setNavigatingPlaceId(null);
    setShowResetToast(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/ask');
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowResetToast(false), 1200);
  };

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

  useAutopilotTextTarget('ask-search', searchRef, setSearch, (value) => {
    if (isUnsafeQuestion(value)) {
      setDraftQuestion(value);
      router.push('/ask/rejected');
      return;
    }
    Keyboard.dismiss();
  });

  useEffect(() => {
    if (!isFocused || !DEMO_FLAGS.autopilotEnabled) return undefined;
    const cleanups = results.map((place) => registerAutopilotTarget(`ask-result-${place.id}`, {
      press: () => selectPlace(place.id, place.lat, place.lng),
      measure: () => new Promise((resolve) => {
        const node = resultRefs.current[place.id];
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
      }),
    }));
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [isFocused, results]);

  const handleAutopilotStart = () => {
    setSearch('');
    setNavigatingPlaceId(null);
    setShowResetToast(false);
    startAutopilot();
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Yonder mark"
        delayLongPress={1500}
        onLongPress={handleDemoReset}
        style={[styles.resetMark, { top: insets.top + 10, backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <YMark size={30} bodyColor={theme.accent} />
      </Pressable>

      {DEMO_FLAGS.autopilotEnabled ? (
        <Pressable
          accessible={false}
          testID="autopilot-start"
          onPress={handleAutopilotStart}
          style={[styles.autopilotTrigger, { top: insets.top }]}
        />
      ) : null}

      {showResetToast ? (
        <Animated.View
          entering={FadeInDown.duration(180)}
          style={[styles.resetToast, { top: insets.top + 18, backgroundColor: theme.accent }]}
        >
          <Text style={[type.mono, styles.resetToastText, { color: theme.onAccent }]}>Demo reset</Text>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.springify().damping(18).stiffness(140)}
        layout={LinearTransition.springify().damping(18).stiffness(140)}
        style={[styles.sheet, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}
      >
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <View style={styles.observerBand}>
          <Text style={[type.mono, styles.observerCount, { color: theme.ink }]}>1,847 observers active in NYC</Text>
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
            ref={searchRef}
            testID="ask-search"
            accessibilityLabel="Search for a place"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setSearch}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Search a place"
            placeholderTextColor={theme.inkFaint}
            returnKeyType="search"
            selectionColor={theme.accent}
            style={[type.mono, styles.searchInput, DEMO_FLAGS.autopilotEnabled ? styles.demoInput : null, { color: theme.ink }]}
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
          <Animated.ScrollView
            entering={FadeInDown.springify().damping(18).stiffness(140)}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.results}
            contentContainerStyle={styles.resultsContent}
          >
            {results.map((place, index) => (
              <Pressable
                ref={(node) => { resultRefs.current[place.id] = node; }}
                testID={`ask-result-${place.id}`}
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
          </Animated.ScrollView>
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
  map: { position: 'absolute', top: 0, right: 0, left: 0, height: '52%' },
  resetMark: { position: 'absolute', left: 22, zIndex: 4, width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  autopilotTrigger: { position: 'absolute', right: 0, zIndex: 6, width: 44, height: 44, opacity: 0 },
  resetToast: { position: 'absolute', alignSelf: 'center', zIndex: 5, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8 },
  resetToastText: { fontSize: 11, lineHeight: 16 },
  sheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '52%',
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: space.sm,
    paddingHorizontal: 28,
    paddingBottom: 88,
    overflow: 'hidden',
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
  },
  handle: { width: 34, height: 4, borderRadius: radii.pill, alignSelf: 'center', marginBottom: 22 },
  observerBand: { minHeight: 24, justifyContent: 'center' },
  observerCount: { fontSize: 12, lineHeight: 18, letterSpacing: 1.1 },
  title: { marginTop: space.md, marginBottom: space.lg, fontSize: 27, lineHeight: 34, letterSpacing: -0.5 },
  searchField: {
    minHeight: 56,
    borderRadius: radii.small,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    marginTop: space.sm,
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontSize: 16, lineHeight: 22 },
  demoInput: { outlineStyle: 'solid', outlineWidth: 0, outlineColor: 'transparent' },
  clearButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  results: { flex: 1, minHeight: 0, marginTop: space.xs },
  resultsContent: { paddingBottom: space.sm },
  resultRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 4, paddingHorizontal: space.xs },
  resultCopy: { flex: 1, gap: 2 },
  resultName: { fontSize: 22, lineHeight: 26 },
  resultMeta: { fontSize: 10, lineHeight: 14 },
  pinIconFrame: { width: 34, height: 42, alignItems: 'center', justifyContent: 'center' },
  pinIcon: { width: 26, height: 26, borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomRightRadius: 13, borderBottomLeftRadius: 3, transform: [{ rotate: '45deg' }], alignItems: 'center', justifyContent: 'center' },
  pinCenter: { width: 9, height: 9, borderRadius: 5 },
});
