import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  FadeInDown,
  LinearTransition,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useActiveTheme } from '@/lib/store';
import { space, type } from '@/lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type TimelineItem = { label: string; detail?: string; time?: string };

export function StatusTimeline({ items, activeIndex }: { items: TimelineItem[]; activeIndex: number; waiting?: boolean }) {
  useEffect(() => {
    if (activeIndex >= 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeIndex]);

  return (
    <View style={styles.timeline}>
      {items.slice(0, activeIndex + 1).map((item, index) => (
        <TimelineStep key={`${index}-${item.label}`} item={item} active={index === activeIndex} completed={index < activeIndex} />
      ))}
    </View>
  );
}

function TimelineStep({ item, active, completed }: { item: TimelineItem; active: boolean; completed: boolean }) {
  const theme = useActiveTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = active
      ? withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true)
      : withTiming(0, { duration: 180 });
  }, [active, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.52 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.05 }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(140)}
      layout={LinearTransition.springify().damping(18).stiffness(140)}
      style={[styles.step, { borderBottomColor: theme.border }]}
    >
      <View style={styles.stateGlyph}>
        {completed ? <CompletedCheck /> : (
          <>
            <Animated.View style={[styles.pulseRing, { borderColor: theme.aging }, pulseStyle]} />
            <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />
          </>
        )}
      </View>
      <View style={styles.copy}>
        <Text style={[type.mono, styles.label, { color: active ? theme.ink : theme.inkSoft }]}>{item.label}</Text>
        {item.detail ? <Text style={[type.mono, styles.detail, { color: theme.inkSoft }]}>{item.detail}</Text> : null}
      </View>
    </Animated.View>
  );
}

function CompletedCheck() {
  const theme = useActiveTheme();
  const offset = useSharedValue(16);

  useEffect(() => {
    offset.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <Svg width={20} height={20} viewBox="0 0 20 20">
      <Circle cx={10} cy={10} r={9} fill={theme.accent} />
      <AnimatedPath
        d="M5.4 10.2 8.5 13 14.8 6.9"
        fill={theme.transparent}
        stroke={theme.onAccent}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="16 16"
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  timeline: { paddingVertical: space.xs },
  step: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  stateGlyph: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  activeDot: { width: 10, height: 10, borderRadius: 5 },
  pulseRing: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  copy: { flex: 1, gap: 1 },
  label: { fontSize: 12, lineHeight: 18 },
  detail: { fontSize: 10, lineHeight: 15 },
});
