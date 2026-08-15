import { useEffect } from 'react';
import { StyleProp, StyleSheet, TextInput, TextStyle } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { font } from '@/lib/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function TickingNumber({
  value,
  initialValue = 0,
  duration = 620,
  formatter = (number) => Math.round(number).toString(),
  color,
  style,
}: {
  value: number;
  initialValue?: number;
  duration?: number;
  formatter?: (value: number) => string;
  color: string;
  style?: StyleProp<TextStyle>;
}) {
  const progress = useSharedValue(initialValue);

  useEffect(() => {
    progress.value = withTiming(value, { duration, easing: Easing.out(Easing.cubic) });
  }, [duration, progress, value]);

  const animatedProps = useAnimatedProps(() => ({ text: formatter(progress.value), defaultValue: formatter(progress.value) }));

  return (
    <AnimatedTextInput
      animatedProps={animatedProps as never}
      editable={false}
      underlineColorAndroid="transparent"
      style={[styles.text, { color }, style]}
    />
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: font.mono500, padding: 0, margin: 0, pointerEvents: 'none' },
});
