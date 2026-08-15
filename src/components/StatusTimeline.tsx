import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { YMark } from '@/components/YMark';
import { useActiveTheme } from '@/lib/store';
import { space, type } from '@/lib/theme';

export type TimelineItem = { label: string; detail?: string; time?: string };

export function StatusTimeline({ items, activeIndex, waiting = false }: { items: TimelineItem[]; activeIndex: number; waiting?: boolean }) {
  const theme = useActiveTheme();

  useEffect(() => {
    if (activeIndex >= 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeIndex]);

  return (
    <View style={styles.timeline}>
      {items.slice(0, activeIndex + 1).map((item, index) => (
        <TimelineStep key={`${index}-${item.label}`} item={item} active={index === activeIndex && !waiting} past={index < activeIndex || waiting} index={index} />
      ))}
      {waiting ? (
        <Animated.View
          entering={FadeInDown.delay(45).springify().damping(18).stiffness(140)}
          layout={LinearTransition.springify().damping(18).stiffness(140)}
          style={styles.waitingRow}
        >
          <View style={styles.markWrap}>
            <YMark size={30} bodyColor={theme.accent} headColor={theme.accent} headPulse />
          </View>
          <View style={styles.copy}>
            <Text style={[type.mono, styles.activeLabel, { color: theme.ink }]}>Waiting for capture</Text>
            <Text style={[type.label, { color: theme.inkSoft }]}>The observer is framing the target</Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function TimelineStep({ item, active, past, index }: { item: TimelineItem; active: boolean; past: boolean; index: number }) {
  const theme = useActiveTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = active ? withRepeat(withTiming(1, { duration: 800 }), -1, true) : withTiming(0, { duration: 180 });
  }, [active, pulse]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(past ? 0.46 : 1, { duration: 240 }),
    transform: [{ scale: withTiming(past ? 0.94 : 1, { duration: 240 }) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: 0.54 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 1.25 }] }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45).springify().damping(18).stiffness(140)}
      layout={LinearTransition.springify().damping(18).stiffness(140)}
    >
      <Animated.View style={[styles.step, rowStyle]}>
        <View style={styles.rail}>
          {index > 0 ? <View style={[styles.lineTop, { backgroundColor: theme.border }]} /> : null}
          {active ? <Animated.View style={[styles.pulseRing, { borderColor: theme.accent }, ringStyle]} /> : null}
          <View style={[styles.dot, { backgroundColor: active ? theme.accent : theme.border }]} />
          <View style={[styles.lineBottom, { backgroundColor: theme.border }]} />
        </View>
        {item.time ? <Text style={[type.mono, styles.time, { color: theme.inkFaint }]}>{item.time}</Text> : null}
        <View style={styles.copy}>
          <Text style={[type.mono, active && styles.activeLabel, { color: active ? theme.ink : theme.inkSoft }]}>{item.label}</Text>
          {item.detail ? <Text style={[type.mono, styles.detail, { color: theme.inkSoft }]}>{item.detail}</Text> : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  timeline: { paddingVertical: space.xs },
  step: { minHeight: 74, flexDirection: 'row', alignItems: 'flex-start', transformOrigin: 'left center' },
  rail: { width: 28, height: '100%', alignItems: 'center' },
  lineTop: { position: 'absolute', top: 0, width: 1, height: 13 },
  lineBottom: { position: 'absolute', top: 25, bottom: 0, width: 1 },
  dot: { width: 11, height: 11, borderRadius: 6, marginTop: 13 },
  pulseRing: { position: 'absolute', top: 8, width: 21, height: 21, borderRadius: 11, borderWidth: 1.5 },
  time: { width: 44, paddingTop: 8, fontSize: 11, lineHeight: 17 },
  copy: { flex: 1, paddingTop: 8, paddingLeft: space.xs, gap: 3 },
  activeLabel: { fontFamily: type.mono.fontFamily },
  detail: { fontSize: 11, lineHeight: 16 },
  waitingRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center' },
  markWrap: { width: 36, marginRight: 20 },
});
