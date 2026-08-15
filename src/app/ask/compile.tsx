import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Glyph } from '@/components/Glyph';
import { YMark } from '@/components/YMark';
import { AppScreen, Entrance, MissingDataState, PrimaryButton, ScreenHeader } from '@/components/ui';
import { registerAutopilotAbortHandler, useAutopilotPressTarget } from '@/lib/autopilot';
import { DEMO_FLAGS } from '@/lib/demoFlags';
import { inferQueryType } from '@/lib/places';
import { compileSpec } from '@/lib/results';
import { isUnsafeQuestion } from '@/lib/safety';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

const LABELS = ['AREA TO CHECK', 'QUESTION', 'ANSWER', 'FRESH FOR'] as const;

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
  const ownerRef = useRef<View>(null);
  const place = places.find((item) => item.id === resolvedPlaceId) ?? null;
  const queryType = useMemo(() => inferQueryType(draftQuestion), [draftQuestion]);
  const spec = useMemo(() => (place ? compileSpec(place.id, queryType) : []), [place, queryType]);
  const openVendor = () => {
    Haptics.selectionAsync();
    router.push('/ask/vendor');
  };
  useAutopilotPressTarget(place?.status === 'blocked' ? 'blocked-owner' : undefined, ownerRef, openVendor);

  useEffect(() => {
    if (isUnsafeQuestion(draftQuestion)) {
      router.replace('/ask/rejected');
      return;
    }
    if (place?.status === 'blocked') return;
    const timer = setTimeout(() => setCompiled(true), TIMING.compileMs);
    const unregisterAbort = registerAutopilotAbortHandler(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      unregisterAbort();
    };
  }, [draftQuestion, place?.status, router]);

  if (!place) return <MissingDataState title="No place is attached to this query." />;

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
          <Pressable
            ref={ownerRef}
            testID="blocked-owner"
            accessibilityRole="link"
            onPress={openVendor}
            style={({ pressed }) => [styles.ownerLink, { opacity: pressed ? 0.62 : 1 }]}
          >
            <Text style={[type.label, { color: theme.accent }]}>Are you the owner?</Text>
          </Pressable>
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
      <ScreenHeader eyebrow="READY TO CHECK" title="Here's what we'll look for" />
      <Entrance style={[styles.specCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.cardIntro}>
          <View style={[styles.liveDot, { backgroundColor: theme.fresh }]} />
          <Text style={[type.micro, { color: theme.fresh }]}>LIVE PLACE CHECK</Text>
        </View>
        <View style={styles.placeBlock}>
          <Text style={[type.micro, styles.specLabel, { color: theme.inkSoft }]}>PLACE</Text>
          <Text style={[type.title, styles.placeName, { color: theme.ink }]}>{place.name}</Text>
          <Text style={[type.body, styles.placeArea, { color: theme.inkSoft }]}>{place.area}</Text>
        </View>
        <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
        {spec.map((value, index) => (
          <View key={LABELS[index]} style={styles.specRow}>
            <Text style={[type.micro, styles.specLabel, { color: theme.inkSoft }]}>{LABELS[index]}</Text>
            <Text style={[type.body, styles.specValue, { color: theme.ink }]}>{value}</Text>
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
          style={[type.body, styles.hintInput, DEMO_FLAGS.autopilotEnabled ? styles.demoInput : null, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.ink }]}
          value={targetHint}
        />
      </Entrance>

      <Entrance index={2} style={styles.footer}>
        <PrimaryButton
          testID="compile-continue"
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
  ownerLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  specCard: { borderRadius: radii.card, borderWidth: 1, padding: space.lg, gap: space.md, shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  cardIntro: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  placeBlock: { gap: space.xxs },
  placeName: { marginTop: space.xxs },
  placeArea: { fontSize: 13, lineHeight: 19 },
  cardDivider: { height: StyleSheet.hairlineWidth, width: '100%', marginVertical: space.xs },
  specRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  specLabel: { width: 100, fontSize: 10, lineHeight: 15 },
  specValue: { flex: 1, fontSize: 14, lineHeight: 20 },
  hintSection: { marginTop: space.xl },
  hintInput: { minHeight: 58, borderRadius: radii.small, borderWidth: 1, paddingHorizontal: space.md, marginTop: space.sm },
  demoInput: { outlineStyle: 'solid', outlineWidth: 0, outlineColor: 'transparent' },
  footer: { marginTop: space.xl },
});
