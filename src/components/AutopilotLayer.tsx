import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { attachAutopilotHost } from '@/lib/autopilot';
import { useActiveTheme, useYonderStore } from '@/lib/store';

type RippleState = { id: number; x: number; y: number } | null;

export function AutopilotLayer() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const resetDemo = useYonderStore((state) => state.resetDemo);
  const theme = useActiveTheme();
  const [ripple, setRipple] = useState<RippleState>(null);
  const rippleId = useRef(0);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const showRipple = useCallback((frame: { x: number; y: number; width: number; height: number }) => {
    rippleId.current += 1;
    setRipple({ id: rippleId.current, x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 });
  }, []);

  useEffect(() => attachAutopilotHost({
    getPathname: () => pathnameRef.current,
    navigate: (route) => router.push(route as never),
    reset: () => {
      resetDemo();
      router.replace('/');
    },
    showRipple,
  }), [resetDemo, router, showRipple]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ripple ? <TapRipple key={ripple.id} x={ripple.x} y={ripple.y} color={theme.accent} /> : null}
    </View>
  );
}

function TapRipple({ x, y, color }: { x: number; y: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 350 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.25 * (1 - progress.value),
    transform: [{ scale: progress.value }],
  }));

  return <Animated.View style={[styles.ripple, { left: x - 22, top: y - 22, backgroundColor: color }, animatedStyle]} />;
}

const styles = StyleSheet.create({
  ripple: { position: 'absolute', width: 44, height: 44, borderRadius: 22 },
});
