import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DeclineSheet } from '@/components/DeclineSheet';
import { AppScreen, Entrance, PrimaryButton, ScreenHeader, SectionLabel } from '@/components/ui';
import { Glyph } from '@/components/Glyph';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { money } from '@/lib/pricing';
import { radii, space, type } from '@/lib/theme';

export default function ObservationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useActiveTheme();
  const query = useYonderStore((state) => state.queries.find((item) => item.id === id));
  const place = useYonderStore((state) => state.places.find((item) => item.id === query?.placeId));
  const setActiveTask = useYonderStore((state) => state.setActiveTask);
  const acceptActiveTask = useYonderStore((state) => state.acceptActiveTask);
  const [declineVisible, setDeclineVisible] = useState(false);

  useEffect(() => {
    if (query) setActiveTask(query.id);
  }, [query?.id, setActiveTask]);

  if (!query || !place) return null;

  const indoor = place.status === 'indoor' || place.status === 'verified_vendor';

  return (
    <Animated.View
      entering={FadeIn.duration(240).withInitialValues({ opacity: 0, transform: [{ scale: 0.98 }] } as never)}
      style={styles.flex}
    >
      <AppScreen>
        <ScreenHeader eyebrow="OBSERVATION" title={place.name} />

        <Entrance>
          <View style={styles.rewardRow}>
            <Text style={[type.monoBig, { color: theme.accent }]}>{money(query.observerRewardCents)}</Text>
            <Text style={[type.mono, { color: theme.inkSoft }]}>~20 sec</Text>
          </View>
        </Entrance>

        <Entrance index={1}>
          <Text style={[type.title, styles.question, { color: theme.ink }]}>{query.question}</Text>
          <Text style={[type.label, styles.area, { color: theme.inkSoft }]}>{place.name} · {place.area}</Text>
        </Entrance>

        {query.targetHint ? (
          <Entrance index={2} style={[styles.hintCard, { backgroundColor: theme.accentSoft, borderColor: theme.border }]}>
            <SectionLabel color={theme.accent}>REQUESTER'S NOTE</SectionLabel>
            <Text style={[type.body, { color: theme.ink }]}>{query.targetHint}</Text>
          </Entrance>
        ) : null}

        {place.status === 'verified_vendor' ? (
          <Entrance index={3} style={[styles.vendorBadge, { borderColor: theme.fresh }]}>
            <Glyph name="check" color={theme.fresh} size={17} />
            <Text style={[type.micro, styles.vendorText, { color: theme.fresh }]}>PHOTOGRAPHY PERMITTED HERE · Verified by {place.name}</Text>
          </Entrance>
        ) : null}

        {indoor ? (
          <Entrance index={4} style={[styles.notice, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <SectionLabel color={theme.accent}>INDOOR OBSERVATION</SectionLabel>
            <Text style={[type.body, { color: theme.ink }]}>Photography is permitted in most stores.{`\n`}If anyone asks you to stop, tap Decline.{`\n`}No penalty to you, and we'll remove this place.</Text>
          </Entrance>
        ) : null}

        <Entrance index={5} style={[styles.safety, { borderColor: theme.border }]}>
          <View style={styles.safetyTitle}>
            <Glyph name="shield" color={theme.accent} size={20} />
            <SectionLabel color={theme.accent}>BEFORE YOU BEGIN</SectionLabel>
          </View>
          <Text style={[type.body, styles.safetyCopy, { color: theme.inkSoft }]}>Stay on public paths. Never photograph people as subjects.{`\n`}Never do this while driving or crossing traffic.{`\n`}If anything feels unsafe, decline. No penalty.</Text>
        </Entrance>

        <Entrance index={6} style={styles.actions}>
          <PrimaryButton
            label="Accept"
            icon="arrow"
            onPress={() => {
              acceptActiveTask();
              router.push('/observe/approach');
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeclineVisible(true)}
            style={({ pressed }) => [styles.declineButton, { borderColor: theme.border, opacity: pressed ? 0.72 : 1 }]}
          >
            <Text style={[type.label, { color: theme.inkSoft }]}>Decline</Text>
          </Pressable>
        </Entrance>
      </AppScreen>
      <DeclineSheet visible={declineVisible} onClose={() => setDeclineVisible(false)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rewardRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.md },
  question: { maxWidth: 345 },
  area: { marginTop: space.sm },
  hintCard: { marginTop: space.lg, borderRadius: radii.small, borderWidth: 1, padding: space.md, gap: space.xs },
  vendorBadge: { marginTop: space.lg, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: space.xs, alignSelf: 'flex-start' },
  vendorText: { maxWidth: 290 },
  notice: { marginTop: space.lg, borderWidth: 1, borderRadius: radii.card, padding: 19, gap: space.sm },
  safety: { marginTop: space.lg, borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: space.lg, gap: space.sm },
  safetyTitle: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  safetyCopy: { lineHeight: 27 },
  actions: { marginTop: space.xl, gap: space.sm },
  declineButton: { minHeight: 52, borderWidth: 1, borderRadius: radii.small, alignItems: 'center', justifyContent: 'center' },
});
