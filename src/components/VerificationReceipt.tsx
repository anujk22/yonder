import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
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
    const timer = setTimeout(() => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, delay + 90);
    return () => clearTimeout(timer);
  }, [delay, offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <View style={styles.row}>
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <AnimatedPath
          d="M4 12.5 9.2 17 20 6"
          fill={theme.transparent}
          stroke={theme.fresh}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24 24"
          animatedProps={animatedProps}
        />
      </Svg>
      <Text style={[type.mono, styles.label, { color: theme.ink }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86}>{label}</Text>
      <Text style={[type.mono, styles.detail, { color: theme.inkSoft }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 50, flexDirection: 'row', gap: space.xs, alignItems: 'center' },
  label: { width: 100, fontSize: 8, lineHeight: 13, letterSpacing: 0.15 },
  detail: { flex: 1, fontSize: 7.5, lineHeight: 12, textAlign: 'right' },
});
