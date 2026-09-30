import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/** Soft rings pulsing out from the mascot: someone, somewhere, is already there. */
export function SignalRings({ size, color }: { size: number; color: string }) {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
    {[0, 1, 2].map((index) => <Ring key={index} index={index} size={size} color={color} />)}
  </View>;
}

function Ring({ index, size, color }: { index: number; size: number; color: string }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 0.35 + index * 0.25 : 0);
  useEffect(() => {
    if (reduced) return;
    progress.set(withDelay(index * 900, withRepeat(withTiming(1, { duration: 2700, easing: Easing.out(Easing.quad) }), -1, false)));
    return () => cancelAnimation(progress);
  }, [index, progress, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: reduced ? 0.5 - index * 0.12 : 0.55 * (1 - progress.get()),
    transform: [{ scale: 0.45 + 0.75 * progress.get() }],
  }));
  return <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: color }, style]} />;
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", borderWidth: 1.5 },
});
