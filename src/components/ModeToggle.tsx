import { useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { Glyph } from '@/components/Glyph';
import { YMark } from '@/components/YMark';
import { isAutopilotRunning, useAutopilotPressTarget } from '@/lib/autopilot';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { ask, observe, radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

export function ModeToggle() {
  const ref = useRef<View>(null);
  const askRef = useRef<View>(null);
  const observeRef = useRef<View>(null);
  const mode = useYonderStore((state) => state.mode);
  const revealTo = useYonderStore((state) => state.modeReveal?.to);
  const isSwitching = useYonderStore((state) => state.isModeSwitching);
  const startModeReveal = useYonderStore((state) => state.startModeReveal);
  const theme = useActiveTheme();
  const colorProgress = useSharedValue(0);
  const markColors: readonly [string, string] = revealTo === 'observe'
    ? [ask.onAccent, observe.onAccent]
    : revealTo === 'ask'
      ? [observe.onAccent, ask.onAccent]
      : [theme.onAccent, theme.onAccent];

  const switchTo = async (to: 'ask' | 'observe') => {
    if (to === mode || isSwitching) return;
    const startedByAutopilot = isAutopilotRunning();
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
    if (startedByAutopilot && !isAutopilotRunning()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ref.current?.measureInWindow((x, y, width, height) => {
      colorProgress.value = 0;
      colorProgress.value = withTiming(1, {
        duration: reduceMotion ? 200 : TIMING.modeRevealMs,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
      startModeReveal({ id: Date.now(), x: x + width / 2, y: y + height / 2, to, reduceMotion });
    });
  };
  useAutopilotPressTarget('mode-ask', askRef, () => switchTo('ask'));
  useAutopilotPressTarget('mode-observe', observeRef, () => switchTo('observe'));

  return (
    <View style={styles.shell}>
      <View style={[styles.blur, { backgroundColor: theme.surface, borderColor: theme.inkFaint }]}>
        <View ref={ref} collapsable={false} style={styles.content}>
          <Pressable
            ref={askRef}
            testID="mode-ask"
            accessibilityRole="button"
            accessibilityLabel="Switch to Ask mode"
            accessibilityState={{ selected: mode === 'ask' }}
            onPress={() => switchTo('ask')}
            style={[styles.segment, mode === 'ask' && { backgroundColor: theme.accent }]}
          >
            <YMark
              size={20}
              bodyColor={mode === 'ask' ? theme.onAccent : theme.inkSoft}
              headColor={mode === 'ask' ? theme.onAccent : theme.inkSoft}
              transitionProgress={mode === 'ask' ? colorProgress : undefined}
              transitionBodyColors={mode === 'ask' ? markColors : undefined}
              transitionHeadColors={mode === 'ask' ? markColors : undefined}
            />
            <Text style={[type.label, styles.segmentLabel, { color: mode === 'ask' ? theme.onAccent : theme.inkSoft }]}>Ask</Text>
          </Pressable>
          <Pressable
            ref={observeRef}
            testID="mode-observe"
            accessibilityRole="button"
            accessibilityLabel="Switch to Observe mode"
            accessibilityState={{ selected: mode === 'observe' }}
            onPress={() => switchTo('observe')}
            style={[styles.segment, mode === 'observe' && { backgroundColor: theme.accent }]}
          >
            <Glyph name="eye" color={mode === 'observe' ? theme.onAccent : theme.inkSoft} size={20} />
            <Text style={[type.label, styles.segmentLabel, { color: mode === 'observe' ? theme.onAccent : theme.inkSoft }]}>Observe</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 0, right: 0, bottom: 18, zIndex: 80, alignItems: 'center', pointerEvents: 'box-none' },
  blur: { borderRadius: radii.pill, overflow: 'hidden', borderWidth: 1 },
  content: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  segment: { minWidth: 96, height: 42, borderRadius: radii.pill, paddingHorizontal: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  segmentLabel: { fontSize: 13, lineHeight: 18 },
});
