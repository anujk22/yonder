import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { TickingNumber } from '@/components/TickingNumber';
import { useActiveTheme } from '@/lib/store';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 96;
const CENTER = SIZE / 2;
const RADIUS = 39;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ConfidenceRing({ value }: { value: number }) {
  const theme = useActiveTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress, value]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.value) }));

  return (
    <View style={styles.wrap} accessibilityLabel={`${Math.round(value * 100)} percent confidence`}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill={theme.transparent} stroke={theme.border} strokeWidth={5.5} />
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill={theme.transparent}
          stroke={theme.fresh}
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
          animatedProps={animatedProps}
        />
      </Svg>
      <TickingNumber
        value={value * 100}
        duration={900}
        color={theme.ink}
        formatter={(number) => `${Math.round(number)}%`}
        style={styles.number}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  number: { position: 'absolute', width: 66, textAlign: 'center', fontSize: 22, lineHeight: 28 },
});
