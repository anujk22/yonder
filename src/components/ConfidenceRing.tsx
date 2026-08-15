import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { TickingNumber } from '@/components/TickingNumber';
import { useActiveTheme } from '@/lib/store';
import { type } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ConfidenceRing({ value }: { value: number }) {
  const theme = useActiveTheme();
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress, value]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));

  return (
    <View style={styles.wrap} accessibilityLabel={`${Math.round(value * 100)} percent confidence`}>
      <Svg width={128} height={128} viewBox="0 0 128 128">
        <Circle cx={64} cy={64} r={radius} fill="none" stroke={theme.border} strokeWidth={8} />
        <AnimatedCircle
          cx={64}
          cy={64}
          r={radius}
          fill="none"
          stroke={theme.fresh}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          transform="rotate(-90 64 64)"
          animatedProps={animatedProps}
        />
      </Svg>
      <TickingNumber value={value * 100} duration={900} color={theme.ink} formatter={(number) => `${Math.round(number)}%`} style={styles.number} />
      <View style={styles.labelWrap}>
        <Animated.Text style={[type.micro, { color: theme.inkSoft }]}>CONFIDENCE</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 128, height: 128, alignItems: 'center', justifyContent: 'center' },
  number: { position: 'absolute', width: 76, textAlign: 'center', fontSize: 24, lineHeight: 30 },
  labelWrap: { position: 'absolute', bottom: 29 },
});
