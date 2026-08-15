import { useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { YMark } from '@/components/YMark';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { ask, observe, radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

export function ModeToggle() {
  const ref = useRef<View>(null);
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
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
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

  return (
    <View style={styles.shell}>
      <BlurView tint={mode === 'ask' ? 'light' : 'dark'} intensity={78} style={[styles.blur, { borderColor: theme.inkFaint }]}>
        <View ref={ref} collapsable={false} style={styles.content}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to Ask mode"
            accessibilityState={{ selected: mode === 'ask' }}
            onPress={() => switchTo('ask')}
            style={[styles.segment, mode === 'ask' && { backgroundColor: theme.accent }]}
          >
            {mode === 'ask' ? (
              <YMark
                size={18}
                bodyColor={theme.onAccent}
                headColor={theme.onAccent}
                transitionProgress={colorProgress}
                transitionBodyColors={markColors}
                transitionHeadColors={markColors}
              />
            ) : null}
            <Text style={[type.mono, styles.segmentLabel, { color: mode === 'ask' ? theme.onAccent : theme.inkSoft }]}>Ask</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to Observe mode"
            accessibilityState={{ selected: mode === 'observe' }}
            onPress={() => switchTo('observe')}
            style={[styles.segment, mode === 'observe' && { backgroundColor: theme.accent }]}
          >
            {mode === 'observe' ? (
              <YMark
                size={18}
                bodyColor={theme.onAccent}
                headColor={theme.onAccent}
                transitionProgress={colorProgress}
                transitionBodyColors={markColors}
                transitionHeadColors={markColors}
              />
            ) : null}
            <Text style={[type.mono, styles.segmentLabel, { color: mode === 'observe' ? theme.onAccent : theme.inkSoft }]}>Observe</Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 0, right: 0, bottom: 20, zIndex: 80, alignItems: 'center', pointerEvents: 'box-none' },
  blur: { borderRadius: radii.pill, overflow: 'hidden', borderWidth: 1 },
  content: { flexDirection: 'row', alignItems: 'center', padding: 4, gap: 3 },
  segment: { minWidth: 104, height: 42, borderRadius: radii.pill, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  segmentLabel: { fontSize: 13, lineHeight: 18 },
});
