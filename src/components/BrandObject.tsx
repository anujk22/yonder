import { useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useIsFocused } from "expo-router";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { brandArtwork } from "./BrandImage";
import { MotionPressable } from "./MotionPressable";

const artwork = brandArtwork;
export type BrandObjectKind = keyof typeof artwork;

/** Raster art is a separate moving layer; it never replaces a control or map. */
export function BrandObject({
  kind = "scout",
  size = 140,
  playful = false,
  delay = 0,
}: {
  kind?: BrandObjectKind;
  size?: number;
  playful?: boolean;
  delay?: number;
}) {
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const float = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const reveal = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (focused)
      reveal.set(
        reduced
          ? 1
          : withDelay(delay, withSpring(1, { damping: 12, stiffness: 180 })),
      );
    return () => {
      cancelAnimation(reveal);
      cancelAnimation(wiggle);
    };
  }, [delay, focused, reduced, reveal, wiggle]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (!focused || !foreground || reduced) {
      cancelAnimation(float);
      float.set(0);
      return;
    }
    const timer = setTimeout(
      () =>
        float.set(
          withRepeat(
            withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
            -1,
            true,
          ),
        ),
      delay,
    );
    return () => {
      clearTimeout(timer);
      cancelAnimation(float);
    };
  }, [delay, float, focused, foreground, reduced]);
  const animated = useAnimatedStyle(() => ({
    opacity: Math.min(1, reveal.get() * 2),
    transform: [
      { translateY: float.get() * -6 },
      { rotate: `${float.get() * 3 + wiggle.get()}deg` },
      { scale: 0.72 + reveal.get() * 0.28 + Math.abs(wiggle.get()) / 150 },
    ],
  }));
  const art = (
    <Animated.View style={[{ width: size, height: size }, animated]}>
      <Image
        source={artwork[kind]}
        contentFit="contain"
        cachePolicy="memory-disk"
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
    </Animated.View>
  );
  if (!playful)
    return (
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {art}
      </View>
    );
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel="Say hi to Scout"
      onPress={() => {
        if (!reduced)
          wiggle.set(
            withSequence(
              withTiming(-12, { duration: 100 }),
              withSpring(0, { damping: 5, stiffness: 220 }),
            ),
          );
      }}
      style={{ width: size, height: size }}
    >
      {art}
    </MotionPressable>
  );
}

/** Two independent image planes, with staggered movement and a generous touch target. */
export function BrandScene({
  compact = false,
  complete = false,
}: {
  compact?: boolean;
  complete?: boolean;
}) {
  return (
    <View
      style={{ width: 280, height: compact ? 160 : 202, alignSelf: "center" }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 175,
          height: 120,
          left: 38,
          top: 38,
          backgroundColor: "#C6B0EE22",
          borderRadius: 70,
          transform: [{ rotate: "-12deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: complete ? 22 : 4,
          top: compact ? -22 : -5,
        }}
      >
        <BrandObject
          kind={complete ? "done" : "map"}
          size={complete ? 198 : 245}
          delay={200}
        />
      </View>
      <View
        style={{
          position: "absolute",
          right: 0,
          top: complete ? 70 : compact ? 8 : 25,
        }}
      >
        <BrandObject size={125} playful delay={650} />
      </View>
      {complete && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {[
            [-5, 38, "#B9A0EB"],
            [238, 17, "#F5D547"],
            [15, 160, "#D7E9A3"],
            [254, 130, "#B9A0EB"],
          ].map(([left, top, color], i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: Number(left),
                top: Number(top),
                width: 9,
                height: i % 2 ? 9 : 18,
                borderRadius: i % 2 ? 5 : 3,
                backgroundColor: String(color),
                transform: [{ rotate: `${i * 37 - 25}deg` }],
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
