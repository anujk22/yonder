import { useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { YMark } from '@/components/YMark';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { ask, observe, radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

export function ModeToggle() {
  const router = useRouter();
  const ref = useRef<View>(null);
  const mode = useYonderStore((state) => state.mode);
  const isSwitching = useYonderStore((state) => state.isModeSwitching);
  const startModeReveal = useYonderStore((state) => state.startModeReveal);
  const theme = useActiveTheme();
  const colorProgress = useSharedValue(0);

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
      <BlurView tint={mode === 'ask' ? 'light' : 'dark'} intensity={78} style={[styles.blur, { borderColor: theme.border }]}>
        <View ref={ref} collapsable={false} style={styles.content}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to Ask mode"
            accessibilityState={{ selected: mode === 'ask' }}
            onPress={() => switchTo('ask')}
            style={[styles.segment, mode === 'ask' && { backgroundColor: theme.accent }]}
          >
            <YMark
              size={18}
              bodyColor={mode === 'ask' ? ask.onAccent : observe.inkSoft}
              headColor={mode === 'ask' ? ask.onAccent : observe.inkSoft}
              transitionProgress={colorProgress}
              transitionBodyColors={mode === 'ask' ? [ask.onAccent, observe.inkSoft] : [observe.inkSoft, ask.onAccent]}
              transitionHeadColors={mode === 'ask' ? [ask.onAccent, observe.inkSoft] : [observe.inkSoft, ask.onAccent]}
            />
            <Text style={[type.micro, { color: mode === 'ask' ? theme.onAccent : theme.inkSoft }]}>Ask</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch to Observe mode"
            accessibilityState={{ selected: mode === 'observe' }}
            onPress={() => switchTo('observe')}
            style={[styles.segment, mode === 'observe' && { backgroundColor: theme.accent }]}
          >
            <Text style={[type.micro, { color: mode === 'observe' ? theme.onAccent : theme.inkSoft }]}>Observe</Text>
            <View style={[styles.sensorDot, { backgroundColor: mode === 'observe' ? theme.onAccent : theme.inkFaint }]} />
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 0, right: 0, bottom: 22, zIndex: 80, alignItems: 'center', pointerEvents: 'box-none' },
  blur: { borderRadius: radii.pill, overflow: 'hidden', borderWidth: 1 },
  content: { flexDirection: 'row', alignItems: 'center', padding: 5, gap: 4 },
  segment: { minWidth: 126, height: 48, borderRadius: radii.pill, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  sensorDot: { width: 6, height: 6, borderRadius: 3 },
});
