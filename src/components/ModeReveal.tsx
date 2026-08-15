import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { YMark } from '@/components/YMark';
import { registerAutopilotAbortHandler } from '@/lib/autopilot';
import { useYonderStore } from '@/lib/store';
import { ask, brand, observe } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

export function ModeReveal() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const reveal = useYonderStore((state) => state.modeReveal);
  const activeAnswerId = useYonderStore((state) => state.activeAnswerId);
  const swapMode = useYonderStore((state) => state.swapMode);
  const finishModeReveal = useYonderStore((state) => state.finishModeReveal);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0.4);
  const logoScale = useSharedValue(0.4);

  useEffect(() => {
    if (!reveal) return;
    const duration = reveal.reduceMotion ? 200 : TIMING.modeRevealMs;
    const swapAt = reveal.reduceMotion ? 90 : TIMING.modeSwapAtMs;
    const total = reveal.reduceMotion ? 210 : 620;
    const coverScale = (2 * Math.hypot(width, height)) / 20;
    scale.value = reveal.reduceMotion ? coverScale : 1;
    opacity.value = 1;
    logoOpacity.value = reveal.reduceMotion ? 0 : 0.4;
    logoScale.value = 0.4;
    scale.value = withTiming(coverScale, { duration, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    logoScale.value = withTiming(1.6, { duration: reveal.reduceMotion ? 1 : 380, easing: Easing.out(Easing.cubic) });

    const swapTimer = setTimeout(() => {
      swapMode(reveal.to);
      Haptics.selectionAsync();
      if (reveal.to === 'observe') {
        router.replace('/observe');
      } else if (activeAnswerId) {
        router.replace(`/ask/answer/${activeAnswerId}`);
      } else {
        router.replace('/ask');
      }
    }, swapAt);

    const fadeTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: reveal.reduceMotion ? 110 : TIMING.modeFadeOutMs });
      logoOpacity.value = withTiming(0, { duration: 180 });
    }, reveal.reduceMotion ? 90 : 380);

    const doneTimer = setTimeout(finishModeReveal, total);
    const unregisterAbort = registerAutopilotAbortHandler(() => {
      clearTimeout(swapTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
      finishModeReveal();
    });
    return () => {
      clearTimeout(swapTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
      unregisterAbort();
    };
  }, [activeAnswerId, finishModeReveal, height, logoOpacity, logoScale, opacity, reveal, router, scale, swapMode, width]);

  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const markStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));

  if (!reveal) return null;
  const incoming = reveal.to === 'ask' ? ask : observe;

  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointerEvents]}>
      <Animated.View
        style={[
          styles.disc,
          { left: reveal.x - 10, top: reveal.y - 10, backgroundColor: incoming.bg },
          discStyle,
        ]}
      />
      <Animated.View style={[styles.mark, markStyle]}>
        <YMark size={180} bodyColor={reveal.to === 'ask' ? brand.espresso : brand.oat} headColor={reveal.to === 'ask' ? brand.espresso : brand.oat} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { position: 'absolute', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 999 },
  mark: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  noPointerEvents: { pointerEvents: 'none' },
});
