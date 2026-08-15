import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Glyph } from '@/components/Glyph';
import { YMark } from '@/components/YMark';
import { AppScreen, Entrance, PrimaryButton, ScreenHeader } from '@/components/ui';
import { inferQueryType } from '@/lib/places';
import { compileSpec } from '@/lib/results';
import { isUnsafeQuestion } from '@/lib/safety';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

const LABELS = ['TARGET', 'CHECKING', 'RETURNS', 'GOOD FOR'] as const;

export default function CompileScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const draftQuestion = useYonderStore((state) => state.draftQuestion);
  const places = useYonderStore((state) => state.places);
  const resolvedPlaceId = useYonderStore((state) => state.resolvedPlaceId);
  const targetHint = useYonderStore((state) => state.targetHint);
  const setTargetHint = useYonderStore((state) => state.setTargetHint);
  const createDraftQuery = useYonderStore((state) => state.createDraftQuery);
  const [compiled, setCompiled] = useState(false);
  const place = places.find((item) => item.id === resolvedPlaceId) ?? null;
  const queryType = useMemo(() => inferQueryType(draftQuestion), [draftQuestion]);
  const spec = useMemo(() => (place ? compileSpec(place.id, queryType) : []), [place, queryType]);

  useEffect(() => {
    if (isUnsafeQuestion(draftQuestion)) {
      router.replace('/ask/rejected');
      return;
    }
    if (place?.status === 'blocked') return;
    const timer = setTimeout(() => setCompiled(true), TIMING.compileMs);
    return () => clearTimeout(timer);
  }, [draftQuestion, place?.status, router]);

  if (!place) return null;

  if (place.status === 'blocked') {
    return (
      <AppScreen scroll={false} style={styles.blockedScreen}>
        <ScreenHeader eyebrow="LOCATION UNAVAILABLE" />
        <Entrance style={styles.blockedContent}>
          <View style={[styles.blockedIcon, { backgroundColor: theme.surface, borderColor: theme.danger }]}>
            <Glyph name="shield" color={theme.danger} size={32} />
          </View>
          <Text style={[type.title, styles.blockedTitle, { color: theme.danger }]}>This location no longer permits observations.</Text>
          <Text style={[type.body, styles.blockedBody, { color: theme.inkSoft }]}>Someone was asked to stop photographing here, so we removed it from Yonder.</Text>
          <Text style={[type.heading, styles.blockedQuestion, { color: theme.ink }]}>Ask about the sidewalk outside instead?</Text>
        </Entrance>
        <Entrance index={1}>
          <PrimaryButton label="Ask about another place" onPress={() => router.replace('/ask')} variant="secondary" />
        </Entrance>
      </AppScreen>
    );
  }

  if (!compiled) {
    return (
      <AppScreen scroll={false} style={styles.loadingScreen}>
        <View style={[styles.loadingMark, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <YMark size={88} bodyColor={theme.accent} headColor={theme.accent} headPulse />
        </View>
        <Text style={[type.micro, { color: theme.inkSoft }]}>COMPILING QUERY</Text>
        <Text style={[type.heading, styles.loadingTitle, { color: theme.ink }]}>Making your question machine-checkable</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader eyebrow="QUERY COMPILED" title="Here's what we'll check" />
      <Entrance style={[styles.specCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.specRow}>
          <Text style={[type.mono, styles.specLabel, { color: theme.inkSoft }]}>PLACE</Text>
          <Text style={[type.mono, styles.specValue, { color: theme.ink }]}>{place.name}</Text>
        </View>
        {spec.map((value, index) => (
          <View key={LABELS[index]} style={styles.specRow}>
            <Text style={[type.mono, styles.specLabel, { color: theme.inkSoft }]}>{LABELS[index]}</Text>
            <Text style={[type.mono, styles.specValue, { color: theme.ink }]}>{value}</Text>
          </View>
        ))}
      </Entrance>

      <Entrance index={1} style={styles.hintSection}>
        <Text style={[type.label, { color: theme.ink }]}>Anything that would help find it?</Text>
        <Text style={[type.micro, { color: theme.inkFaint }]}>OPTIONAL</Text>
        <TextInput
          accessibilityLabel="Optional directions for the observer"
          onChangeText={setTargetHint}
          placeholder='e.g. "Court 3 is the one closest to the water"'
          placeholderTextColor={theme.inkFaint}
          returnKeyType="done"
          selectionColor={theme.accent}
          style={[type.body, styles.hintInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.ink }]}
          value={targetHint}
        />
      </Entrance>

      <Entrance index={2} style={styles.footer}>
        <PrimaryButton
          label="Choose your answer"
          onPress={() => {
            const queryId = createDraftQuery();
            if (queryId) router.push('/ask/options');
          }}
        />
      </Entrance>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { alignItems: 'center', justifyContent: 'center', paddingBottom: 140 },
  loadingMark: { width: 136, height: 136, borderRadius: 68, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, marginBottom: space.lg },
  loadingTitle: { textAlign: 'center', maxWidth: 280, marginTop: space.xs },
  blockedScreen: { justifyContent: 'space-between' },
  blockedContent: { flex: 1, justifyContent: 'center', paddingBottom: space.xl },
  blockedIcon: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  blockedTitle: { maxWidth: 320 },
  blockedBody: { marginTop: space.md, maxWidth: 330 },
  blockedQuestion: { marginTop: space.xl, maxWidth: 300 },
  specCard: { borderRadius: radii.card, borderWidth: 1, padding: space.md, gap: space.md, shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  specRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  specLabel: { width: 74, fontSize: 11, lineHeight: 17 },
  specValue: { flex: 1, fontSize: 12, lineHeight: 18 },
  hintSection: { marginTop: space.xl },
  hintInput: { minHeight: 58, borderRadius: radii.small, borderWidth: 1, paddingHorizontal: space.md, marginTop: space.sm },
  footer: { marginTop: space.xl },
});
