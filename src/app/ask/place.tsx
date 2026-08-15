import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { detailRegion, MapRegion, MapSurface } from '@/components/MapSurface';
import { TickingNumber } from '@/components/TickingNumber';
import { YMark } from '@/components/YMark';
import { MissingDataState } from '@/components/ui';
import { inferQueryType, OBSERVERS_NEARBY } from '@/lib/places';
import { priceQuery } from '@/lib/pricing';
import { isUnsafeQuestion } from '@/lib/safety';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

const DEADLINES = [5, 10, 15, 30] as const;

const SUGGESTIONS = [
  'Are any pickleball courts free?',
  'How long is the line?',
  'Is the elevator working?',
  'Is this item in stock?',
] as const;

export default function PinQuestionScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const places = useYonderStore((state) => state.places);
  const resolvedPlaceId = useYonderStore((state) => state.resolvedPlaceId);
  const pinnedCoordinate = useYonderStore((state) => state.pinnedCoordinate);
  const draftQuestion = useYonderStore((state) => state.draftQuestion);
  const deadlineMinutes = useYonderStore((state) => state.deadlineMinutes);
  const setPinnedCoordinate = useYonderStore((state) => state.setPinnedCoordinate);
  const setDraftQuestion = useYonderStore((state) => state.setDraftQuestion);
  const setDeadline = useYonderStore((state) => state.setDeadline);
  const [showError, setShowError] = useState(false);
  const pinLift = useSharedValue(0);
  const shake = useSharedValue(0);
  const place = places.find((candidate) => candidate.id === resolvedPlaceId) ?? null;
  const coordinate = pinnedCoordinate ?? (place ? { lat: place.lat, lng: place.lng } : null);
  const queryType = draftQuestion.trim() ? inferQueryType(draftQuestion) : place?.categories[0] ?? 'crowd';
  const pricing = useMemo(
    () => (place ? priceQuery(place.id, queryType, deadlineMinutes) : null),
    [deadlineMinutes, place, queryType],
  );
  const observersNearby = place ? OBSERVERS_NEARBY[place.id] ?? 0 : 0;
  const geofenceDiameter = place ? Math.max(170, Math.min(270, place.geofenceM * 3)) : 220;

  const pinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -6 * pinLift.value },
      { scale: 1 + 0.08 * pinLift.value },
    ],
  }));
  const questionStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  if (!place || !coordinate || !pricing) return <MissingDataState title="No place is ready for this question." />;

  const handleRegionChange = () => {
    pinLift.value = withTiming(1, { duration: 90 });
  };

  const handleRegionChangeComplete = (region: MapRegion) => {
    pinLift.value = withSpring(0, { damping: 18, stiffness: 220 });
    setPinnedCoordinate({ lat: region.latitude, lng: region.longitude });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const submit = () => {
    if (!draftQuestion.trim()) {
      setShowError(true);
      shake.value = withSequence(
        withTiming(-8, { duration: 55 }),
        withTiming(8, { duration: 70 }),
        withTiming(-5, { duration: 65 }),
        withTiming(0, { duration: 70 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(isUnsafeQuestion(draftQuestion) ? '/ask/rejected' : '/ask/compile');
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <MapSurface
        mode="ask"
        initialRegion={detailRegion({ latitude: coordinate.lat, longitude: coordinate.lng })}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        style={styles.map}
      />

      <View pointerEvents="none" style={styles.pinLayer}>
        <View style={[styles.geofence, { width: geofenceDiameter, height: geofenceDiameter, borderRadius: geofenceDiameter / 2 }]}>
          <View style={[styles.geofenceFill, { backgroundColor: theme.fresh, borderRadius: geofenceDiameter / 2 }]} />
          <View style={[styles.geofenceBorder, { borderColor: theme.fresh, borderRadius: geofenceDiameter / 2 }]} />
        </View>
        <Animated.View style={[styles.centerPin, pinStyle]}>
          <View style={[styles.pinBody, { backgroundColor: theme.accent, shadowColor: theme.shadow }]}>
            <View style={styles.pinMarkRotation}>
              <YMark size={42} bodyColor={theme.onAccent} headColor={theme.onAccent} />
            </View>
          </View>
          <Text style={[type.mono, styles.coordinate, { color: theme.ink, backgroundColor: theme.surface }]}>
            {coordinate.lat.toFixed(4)}, {coordinate.lng.toFixed(4)}
          </Text>
        </Animated.View>
      </View>

      <View style={[styles.sheet, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <Text style={[type.mono, styles.instruction, { color: theme.inkFaint }]}>Drag the pin to the exact spot</Text>

        <Animated.View style={questionStyle}>
          <TextInput
            accessibilityLabel={`Question about ${place.name}`}
            multiline
            onChangeText={(value) => {
              setDraftQuestion(value);
              if (value.trim()) setShowError(false);
            }}
            placeholder="Are any pickleball courts free?"
            placeholderTextColor={theme.inkFaint}
            selectionColor={theme.accent}
            style={[
              type.serifTitle,
              styles.question,
              { color: theme.ink, borderBottomColor: showError ? theme.danger : theme.transparent },
            ]}
            value={draftQuestion}
          />
        </Animated.View>
        {showError ? <Text style={[type.label, styles.error, { color: theme.danger }]}>Ask something about this place</Text> : null}

        {!draftQuestion.trim() ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions} keyboardShouldPersistTaps="handled">
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setDraftQuestion(suggestion);
                  setShowError(false);
                }}
                style={[styles.chip, { borderColor: theme.border }]}
              >
                <Text style={[type.label, styles.chipText, { color: theme.inkSoft }]}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <Text style={[type.micro, styles.deadlineLabel, { color: theme.inkSoft }]}>DEADLINE</Text>
        <View style={[styles.segmented, { borderColor: theme.border }]}>
          {DEADLINES.map((minutes, index) => {
            const selected = deadlineMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDeadline(minutes);
                }}
                style={[
                  styles.segment,
                  index > 0 && { borderLeftColor: theme.border, borderLeftWidth: StyleSheet.hairlineWidth },
                  selected && { backgroundColor: theme.accent },
                ]}
              >
                <Text style={[type.mono, styles.segmentText, { color: selected ? theme.onAccent : theme.ink }]}>{minutes} min</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.priceBlock, { backgroundColor: theme.accent }]}>
          <TickingNumber
            value={pricing.bountyCents}
            initialValue={pricing.bountyCents}
            color={theme.onAccent}
            formatter={(value) => `$${(Math.round(value) / 100).toFixed(2)}`}
            style={styles.price}
          />
          <Text style={[type.mono, styles.priceReason, { color: theme.onAccent }]}>{observersNearby} observers within 5 minutes</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={submit}
          style={({ pressed }) => [styles.askButton, { backgroundColor: theme.accent, opacity: pressed ? 0.86 : 1 }]}
        >
          <Text style={[type.label, styles.askButtonText, { color: theme.onAccent }]}>Ask Yonder</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  map: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  pinLayer: { position: 'absolute', top: 0, right: 0, left: 0, height: '55%', alignItems: 'center', justifyContent: 'center' },
  geofence: { position: 'absolute' },
  geofenceFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.12 },
  geofenceBorder: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 1, opacity: 0.4 },
  centerPin: { alignItems: 'center', marginTop: 24 },
  pinBody: {
    width: 70,
    height: 70,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    borderBottomRightRadius: 35,
    borderBottomLeftRadius: 8,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  pinMarkRotation: { transform: [{ rotate: '-45deg' }] },
  coordinate: { marginTop: space.md, borderRadius: 6, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, lineHeight: 16 },
  sheet: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '45%',
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: 10,
    paddingHorizontal: space.lg,
    paddingBottom: 82,
    shadowOpacity: 0.14,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
  },
  handle: { width: 34, height: 4, borderRadius: radii.pill, alignSelf: 'center', marginBottom: 9 },
  instruction: { fontSize: 10, lineHeight: 15, letterSpacing: 1.1 },
  question: { minHeight: 52, maxHeight: 70, padding: 0, marginTop: 4, fontSize: 32, lineHeight: 35, borderBottomWidth: 1 },
  error: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  suggestions: { gap: space.xs, paddingTop: 7, paddingBottom: 2 },
  chip: { height: 34, borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: space.sm },
  chipText: { fontSize: 11, lineHeight: 15 },
  deadlineLabel: { marginTop: 6, marginBottom: 4 },
  segmented: { height: 40, borderRadius: radii.pill, borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 11, lineHeight: 16 },
  priceBlock: { marginHorizontal: -space.lg, marginTop: 6, paddingHorizontal: space.lg, paddingVertical: 6 },
  price: { width: '100%', fontSize: 34, lineHeight: 36 },
  priceReason: { fontSize: 10, lineHeight: 14, letterSpacing: 0.2, opacity: 0.82 },
  askButton: { minHeight: 46, borderRadius: radii.small, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  askButtonText: { fontSize: 15, letterSpacing: 0.4 },
});
