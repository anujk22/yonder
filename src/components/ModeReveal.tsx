import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View, Text } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  cancelAnimation,
} from "react-native-reanimated";

import { BrandImage } from "@/components/BrandImage";
import { registerAutopilotAbortHandler } from "@/lib/autopilot";
import { useYonderStore } from "@/lib/store";
import { font } from "@/lib/theme";

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
    const duration = reveal.reduceMotion ? 0 : 430;
    const swapAt = reveal.reduceMotion ? 0 : 450;
    const total = reveal.reduceMotion ? 160 : 1080;
    const coverScale = (2 * Math.hypot(width, height)) / 20;
    scale.value = reveal.reduceMotion ? coverScale : 1;
    opacity.value = 1;
    logoOpacity.value = 0;
    logoOpacity.value = withTiming(reveal.reduceMotion ? 0 : 1, {
      duration: 300,
    });
    logoScale.value = 0.4;
    scale.value = withTiming(coverScale, {
      duration,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    logoScale.value = reveal.reduceMotion
      ? 1
      : withSpring(1, { damping: 12, stiffness: 140 });

    const swapTimer = setTimeout(() => {
      swapMode(reveal.to);
      void Haptics.selectionAsync().catch(() => {});
      if (reveal.to === "observe") {
        router.replace("/observe");
      } else if (activeAnswerId) {
        router.replace(`/ask/answer/${activeAnswerId}`);
      } else {
        router.replace("/ask");
      }
    }, swapAt);

    const fadeTimer = setTimeout(
      () => {
        opacity.value = withTiming(0, {
          duration: reveal.reduceMotion ? 140 : 260,
        });
        logoOpacity.value = withTiming(0, { duration: 180 });
      },
      reveal.reduceMotion ? 10 : 800,
    );

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
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(logoOpacity);
      cancelAnimation(logoScale);
      unregisterAbort();
    };
  }, [
    activeAnswerId,
    finishModeReveal,
    height,
    logoOpacity,
    logoScale,
    opacity,
    reveal,
    router,
    scale,
    swapMode,
    width,
  ]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  if (!reveal) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointerEvents]}>
      <Animated.View
        style={[
          styles.disc,
          {
            left: reveal.x - 10,
            top: reveal.y - 10,
            backgroundColor: "#F5E6A7",
          },
          discStyle,
        ]}
      />
      <Animated.View style={[styles.mark, markStyle]}>
        <BrandImage kind="scout" size={180} />
        <Text style={styles.title}>
          {reveal.to === "observe"
            ? "A fresh pair of eyes."
            : "A little more clarity."}
        </Text>
        <Text style={styles.subtitle}>
          {reveal.to === "observe" ? "SCOUT MODE" : "EXPLORE YONDER"}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 999,
  },
  mark: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  title: {
    fontFamily: font.ui700,
    fontSize: 29,
    color: "#2C3E33",
    letterSpacing: -1,
    textAlign: "center",
    marginTop: 12,
  },
  subtitle: {
    fontFamily: font.ui700,
    fontSize: 11,
    letterSpacing: 2,
    color: "#596646",
    marginTop: 14,
  },
  noPointerEvents: { zIndex: 2000, elevation: 30, overflow: "hidden" },
});
