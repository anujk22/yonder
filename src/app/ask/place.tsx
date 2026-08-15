import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { CityMap } from '@/components/CityMap';
import { Entrance, PrimaryButton, ScreenHeader, SectionLabel, AppScreen } from '@/components/ui';
import { PLACE_DISTANCE } from '@/lib/places';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

const DEADLINES = [5, 10, 15, 30] as const;

export default function PlaceScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const places = useYonderStore((state) => state.places);
  const resolvedPlaceId = useYonderStore((state) => state.resolvedPlaceId);
  const deadlineMinutes = useYonderStore((state) => state.deadlineMinutes);
  const resolveDraftPlace = useYonderStore((state) => state.resolveDraftPlace);
  const setResolvedPlace = useYonderStore((state) => state.setResolvedPlace);
  const setDeadline = useYonderStore((state) => state.setDeadline);
  const [choosingPlace, setChoosingPlace] = useState(false);
  const resolvedPlace = places.find((place) => place.id === resolvedPlaceId) ?? null;

  useEffect(() => {
    if (!resolvedPlaceId) resolveDraftPlace();
  }, [resolveDraftPlace, resolvedPlaceId]);

  const showPlaceList = choosingPlace || !resolvedPlace;

  return (
    <AppScreen>
      <ScreenHeader eyebrow="ATTACH TO A PLACE" title="Where should we look?" />

      {!showPlaceList && resolvedPlace ? (
        <Entrance style={[styles.resolvedCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={[styles.mapThumbnail, { backgroundColor: theme.surfaceAlt }]}>
            <CityMap height={112} compact showOpenBounties={false} />
          </View>
          <View style={styles.resolvedCopy}>
            <SectionLabel color={theme.fresh}>RESOLVED</SectionLabel>
            <Text style={[type.heading, { color: theme.ink }]}>{resolvedPlace.name}</Text>
            <View style={styles.resolvedMeta}>
              <Text style={[type.label, styles.area, { color: theme.inkSoft }]}>{resolvedPlace.area}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setChoosingPlace(true);
                }}
              >
                <Text style={[type.label, { color: theme.accent }]}>Change</Text>
              </Pressable>
            </View>
          </View>
        </Entrance>
      ) : (
        <Entrance style={styles.placeList}>
          <SectionLabel>SELECT A PLACE</SectionLabel>
          <View style={[styles.rows, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {places.map((place, index) => (
              <Pressable
                key={place.id}
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setResolvedPlace(place.id);
                  setChoosingPlace(false);
                }}
                style={({ pressed }) => [
                  styles.placeRow,
                  index < places.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  { opacity: pressed ? 0.66 : 1 },
                ]}
              >
                <View style={styles.placeCopy}>
                  <Text style={[type.label, styles.placeName, { color: theme.ink }]}>{place.name}</Text>
                  <Text style={[type.label, styles.placeArea, { color: theme.inkSoft }]}>{place.area}</Text>
                </View>
                <Text style={[type.mono, styles.distance, { color: theme.inkSoft }]}>{PLACE_DISTANCE[place.id]}</Text>
              </Pressable>
            ))}
          </View>
        </Entrance>
      )}

      <Entrance index={1} style={styles.deadlineSection}>
        <View style={styles.deadlineHeading}>
          <SectionLabel>ANSWER WITHIN</SectionLabel>
          <Text style={[type.mono, { color: theme.inkSoft }]}>Changes the bounty</Text>
        </View>
        <View style={[styles.segmented, { backgroundColor: theme.surfaceAlt }]}>
          {DEADLINES.map((minutes) => {
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
                style={[styles.segment, selected && { backgroundColor: theme.accent }]}
              >
                <Text style={[type.mono, styles.segmentText, { color: selected ? theme.onAccent : theme.inkSoft }]}>{minutes} min</Text>
              </Pressable>
            );
          })}
        </View>
      </Entrance>

      <Entrance index={2} style={styles.footer}>
        <PrimaryButton label="Continue" onPress={() => router.push('/ask/compile')} disabled={!resolvedPlace} />
      </Entrance>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  resolvedCard: { borderRadius: radii.card, borderWidth: 1, overflow: 'hidden', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  mapThumbnail: { height: 112, overflow: 'hidden' },
  resolvedCopy: { padding: space.md, gap: space.xxs },
  resolvedMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  area: { flex: 1 },
  placeList: { gap: space.xs },
  rows: { borderRadius: radii.card, borderWidth: 1, overflow: 'hidden' },
  placeRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingVertical: 10, gap: space.sm },
  placeCopy: { flex: 1, gap: 1 },
  placeName: { fontSize: 14 },
  placeArea: { fontSize: 11, lineHeight: 15 },
  distance: { fontSize: 11 },
  deadlineSection: { marginTop: space.xl, gap: space.sm },
  deadlineHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segmented: { flexDirection: 'row', borderRadius: radii.small, padding: 4 },
  segment: { flex: 1, minHeight: 46, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 12 },
  footer: { marginTop: space.xl },
});
