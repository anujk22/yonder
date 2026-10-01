import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { AUTOPILOT_AVAILABLE, attachAutopilotHost, startFilmTake, useAutopilotTouches } from '@/lib/autopilot';
import { usePurchaseStore } from '@/lib/purchaseStore';
import { useOnboarding } from '@/lib/onboarding';
import { useActiveTheme, useYonderStore } from '@/lib/store';

/** Connects the recording autopilot to navigation and draws its taps. Builds with the demo screens only. */
export function AutopilotLayer() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => attachAutopilotHost({
    getPathname: () => pathnameRef.current,
    resetForTake: () => {
      useYonderStore.getState().resetDemo();
      if (pathnameRef.current !== '/') router.dismissTo('/');
      useOnboarding.getState().reset();
    },
  }), [router]);

  // For checking a take from a debugger or the web build: globalThis.__yonderFilmTake().
  useEffect(() => {
    const debug = globalThis as { __yonderFilmTake?: () => ReturnType<typeof startFilmTake> };
    debug.__yonderFilmTake = () => startFilmTake(() => usePurchaseStore.getState().plus);
    return () => {
      delete debug.__yonderFilmTake;
    };
  }, []);

  return <AutopilotTouches />;
}

/** The tap marks. Also placed inside modals, which sit above the root view. */
export function AutopilotTouches() {
  const touches = useAutopilotTouches((state) => state.touches);
  const theme = useActiveTheme();
  if (!AUTOPILOT_AVAILABLE) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      {touches.map((touch) => <TapMark key={touch.id} x={touch.x} y={touch.y} ink={theme.ink} accent={theme.accent} />)}
    </View>
  );
}

const DOT = 14;
const RING = 18;
const out = Easing.out(Easing.cubic);

/** A small dot where the finger lands, with one soft ring spreading out from it. */
function TapMark({ x, y, ink, accent }: { x: number; y: number; ink: string; accent: string }) {
  const press = useSharedValue(0);
  const fade = useSharedValue(1);
  const ring = useSharedValue(0);

  useEffect(() => {
    press.set(withTiming(1, { duration: 120, easing: out }));
    fade.set(withDelay(240, withTiming(0, { duration: 320, easing: out })));
    ring.set(withTiming(1, { duration: 560, easing: out }));
  }, [fade, press, ring]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: fade.get() * 0.92,
    transform: [{ scale: 0.55 + 0.45 * press.get() - 0.12 * (1 - fade.get()) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.85 * (1 - ring.get()),
    transform: [{ scale: 1 + 2.6 * ring.get() }],
  }));

  return (
    <>
      <Animated.View style={[styles.ring, { left: x - RING / 2, top: y - RING / 2, borderColor: accent }, ringStyle]} />
      <Animated.View style={[styles.dot, { left: x - DOT / 2, top: y - DOT / 2, backgroundColor: ink }, dotStyle]} />
    </>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: 5000, elevation: 50 },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
  },
  ring: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2 },
});
