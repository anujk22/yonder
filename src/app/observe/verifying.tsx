import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { DeclineSheet } from '@/components/DeclineSheet';
import { Glyph } from '@/components/Glyph';
import { AppScreen, Entrance, MissingDataState, SectionLabel } from '@/components/ui';
import { YMark } from '@/components/YMark';
import { registerAutopilotAbortHandler } from '@/lib/autopilot';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

export default function VerifyingScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const activeTaskId = useYonderStore((state) => state.activeTaskId);
  const query = useYonderStore((state) => state.queries.find((item) => item.id === state.activeTaskId));
  const updateQueryState = useYonderStore((state) => state.updateQueryState);
  const completeObservation = useYonderStore((state) => state.completeObservation);
  const [visibleCount, setVisibleCount] = useState(0);
  const [declineVisible, setDeclineVisible] = useState(false);
  const completed = useRef(false);
  const sceneDetail = query?.placeId === 'pier2'
    ? '4 court surfaces detected'
    : query?.placeId === 'nikesoho'
      ? 'Pegasus 41 display detected'
      : query?.placeId === 'unionsq'
        ? 'elevator entrance detected'
        : 'requested place feature detected';
  const steps = [
    { label: 'Uploading 3 frames' },
    { label: 'Checking location', detail: '21m from target' },
    { label: 'Checking liveness', detail: 'parallax detected across frames' },
    { label: 'Matching scene', detail: sceneDetail },
    { label: 'Reading the scene' },
  ];

  useEffect(() => {
    if (!activeTaskId) return;
    updateQueryState(activeTaskId, 'VERIFYING', 'Verifying observation', 'location, liveness, scene');

    const stepTimers = TIMING.verifySteps.map((delay, index) =>
      setTimeout(() => {
        setVisibleCount(index + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, delay),
    );
    const completionTimer = setTimeout(() => {
      if (completed.current) return;
      completed.current = true;
      completeObservation();
      router.replace('/observe/earned');
    }, TIMING.verifyTotalMs);
    const unregisterAbort = registerAutopilotAbortHandler(() => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(completionTimer);
    });

    return () => {
      stepTimers.forEach(clearTimeout);
      clearTimeout(completionTimer);
      unregisterAbort();
    };
  }, [activeTaskId, completeObservation, router, updateQueryState]);

  if (!activeTaskId || !query) return <MissingDataState title="No captured observation is ready to verify." />;

  return (
    <Animated.View
      entering={FadeIn.duration(240).withInitialValues({ opacity: 0, transform: [{ scale: 0.98 }] } as never)}
      style={styles.flex}
    >
      <AppScreen scroll={false}>
        <View style={styles.headerRow}>
          <View>
            <SectionLabel>VERIFICATION PIPELINE</SectionLabel>
            <Text style={[type.title, styles.title, { color: theme.ink }]}>Turning photons into information.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decline observation"
            onPress={() => setDeclineVisible(true)}
            style={({ pressed }) => [styles.declineButton, { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Glyph name="close" color={theme.inkSoft} size={18} />
          </Pressable>
        </View>

        <Entrance index={1} style={styles.markWrap}>
          <YMark size={76} bodyColor={theme.accent} headPulse />
        </Entrance>

        <View style={styles.timeline}>
          {steps.slice(0, visibleCount).map((step, index) => {
            const done = index < visibleCount - 1;
            const active = index === visibleCount - 1;
            return (
              <Animated.View
                key={step.label}
                entering={FadeInDown.springify().damping(18).stiffness(140)}
                style={[styles.step, { opacity: done ? 0.58 : 1 }]}
              >
                <View style={styles.rail}>
                  <View style={[styles.dot, { backgroundColor: done ? theme.fresh : theme.accent }]} />
                  {index < steps.length - 1 ? <View style={[styles.line, { backgroundColor: theme.border }]} /> : null}
                </View>
                <View style={[styles.stepCard, { backgroundColor: active ? theme.surface : theme.transparent, borderColor: active ? theme.border : theme.transparent }]}>
                  <Text style={[type.mono, styles.stepLabel, { color: theme.ink }]}>{step.label}</Text>
                  {'detail' in step && step.detail ? (
                    <View style={styles.detailRow}>
                      <Text style={[type.mono, styles.stepDetail, { color: theme.inkSoft }]}>{step.detail}</Text>
                      {done ? <Glyph name="check" color={theme.fresh} size={16} /> : null}
                    </View>
                  ) : null}
                </View>
              </Animated.View>
            );
          })}
        </View>

        <Entrance index={2} style={styles.footer}>
          <Text style={[type.body, styles.footerCopy, { color: theme.inkSoft }]}>The observer provides the evidence.{`\n`}Yonder produces the answer.</Text>
        </Entrance>
      </AppScreen>
      <DeclineSheet visible={declineVisible} onClose={() => setDeclineVisible(false)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md, paddingTop: space.md },
  title: { marginTop: space.xs, maxWidth: 315 },
  declineButton: { width: 40, height: 40, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  markWrap: { alignItems: 'center', marginTop: space.lg, marginBottom: space.md },
  timeline: { flex: 1, justifyContent: 'center', paddingVertical: space.sm },
  step: { minHeight: 62, flexDirection: 'row' },
  rail: { width: 28, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 17 },
  line: { position: 'absolute', top: 29, bottom: -17, width: 1 },
  stepCard: { flex: 1, minHeight: 54, borderWidth: 1, borderRadius: radii.small, paddingHorizontal: space.md, paddingVertical: 10, marginBottom: space.xs },
  stepLabel: { fontSize: 13, lineHeight: 18 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDetail: { flexShrink: 1, fontSize: 10, lineHeight: 15 },
  footer: { paddingBottom: space.lg },
  footerCopy: { textAlign: 'center' },
});
