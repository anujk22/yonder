import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { YMark } from '@/components/YMark';
import { ask, brand, observe } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

export function LaunchOverlay({ onFinish }: { onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  const [pulsing, setPulsing] = useState(false);
  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.9);
  const revealScale = useSharedValue(0.04);

  useEffect(() => {
    markOpacity.value = withTiming(1, { duration: TIMING.splashMarkInMs });
    markScale.value = withSpring(1, { damping: 15, stiffness: 125 });
    const pulseTimer = setTimeout(() => setPulsing(true), TIMING.splashMarkInMs);
    const revealTimer = setTimeout(() => {
      setPulsing(false);
      revealScale.value = withTiming(Math.hypot(width, height) / 10, {
        duration: TIMING.modeRevealMs,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    }, TIMING.splashMarkInMs + TIMING.splashPulseMs);
    const doneTimer = setTimeout(onFinish, TIMING.splashMarkInMs + TIMING.splashPulseMs + TIMING.modeRevealMs + 40);
    return () => {
      clearTimeout(pulseTimer);
      clearTimeout(revealTimer);
      clearTimeout(doneTimer);
    };
  }, [height, markOpacity, markScale, onFinish, revealScale, width]);

  const markStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value, transform: [{ scale: markScale.value }] }));
  const revealStyle = useAnimatedStyle(() => ({ transform: [{ scale: revealScale.value }] }));

  return (
    <View style={[styles.container, { backgroundColor: observe.bg }]}> 
      <Animated.View style={markStyle}>
        <YMark size={96} bodyColor={brand.oat} headColor={brand.oat} headPulse={pulsing} headPulseHalfDuration={260} />
      </Animated.View>
      <Animated.View style={[styles.reveal, { backgroundColor: ask.bg }, revealStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, zIndex: 1000, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  reveal: { position: 'absolute', width: 20, height: 20, borderRadius: 10 },
});
