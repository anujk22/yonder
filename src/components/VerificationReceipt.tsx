import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { useActiveTheme } from '@/lib/store';
import { space, type } from '@/lib/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function VerificationReceipt({ label, detail, delay = 0 }: { label: string; detail: string; delay?: number }) {
  const theme = useActiveTheme();
  const offset = useSharedValue(24);

  useEffect(() => {
    offset.value = withDelay(delay, withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }));
    const timer = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), delay + 90);
    return () => clearTimeout(timer);
  }, [delay, offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <View style={styles.row}>
      <Svg width={21} height={21} viewBox="0 0 24 24">
        <AnimatedPath d="M4 12.5 9.2 17 20 6" fill="none" stroke={theme.fresh} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24 24" animatedProps={animatedProps} />
      </Svg>
      <View style={styles.copy}>
        <Text style={[type.mono, styles.label, { color: theme.ink }]}>{label}</Text>
        <Text style={[type.mono, styles.detail, { color: theme.inkSoft }]}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', paddingVertical: space.sm },
  copy: { flex: 1, gap: 2 },
  label: { fontSize: 12, lineHeight: 17 },
  detail: { fontSize: 11, lineHeight: 16 },
});
