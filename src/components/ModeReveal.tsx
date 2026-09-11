import { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View, Text } from "react-native";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  cancelAnimation,
} from "react-native-reanimated";
import { BrandImage } from "@/components/BrandImage";
import { registerAutopilotAbortHandler } from "@/lib/autopilot";
import { useYonderStore } from "@/lib/store";
import { font } from "@/lib/theme";
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** A moving band covers the route swap, then recedes to reveal the destination. */
function waveBand(
  width: number,
  height: number,
  progress: number,
  phase: number,
  lead: number,
) {
  "worklet";
  const crest = height + 100 - progress * (height + 200) - lead;
  const bottom = crest + height + 200;
  const amplitude = Math.min(55, width * 0.1);
  let path = "";
  for (let i = 0; i <= 32; i++) {
    const x = -10 + ((width + 20) * i) / 32;
    const y = crest + Math.sin((i / 32) * Math.PI * 2 + phase) * amplitude;
    path += `${i ? "L" : "M"}${x},${y} `;
  }
  for (let i = 32; i >= 0; i--) {
    const x = -10 + ((width + 20) * i) / 32;
    const y =
      bottom + Math.sin((i / 32) * Math.PI * 2 + phase + 1.3) * amplitude;
    path += `L${x},${y} `;
  }
  return path + "Z";
}
export function ModeReveal() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const reveal = useYonderStore((s) => s.modeReveal);
  const activeAnswerId = useYonderStore((s) => s.activeAnswerId);
  const swapMode = useYonderStore((s) => s.swapMode);
  const finish = useYonderStore((s) => s.finishModeReveal);
  const progress = useSharedValue(0);
  const phase = useSharedValue(0);
  const opacity = useSharedValue(1);
  const mark = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(() => {
    if (!reveal) return;
    const reduced = reveal.reduceMotion;
    progress.set(reduced ? 1 : 0);
    phase.set(0);
    opacity.set(1);
    mark.set(0);
    spin.set(0);
    if (!reduced) {
      progress.set(
        withSequence(
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.cubic) }),
          withDelay(
            100,
            withTiming(2, {
              duration: 600,
              easing: Easing.inOut(Easing.cubic),
            }),
          ),
        ),
      );
      phase.set(
        withTiming(Math.PI * 2.8, { duration: 1350, easing: Easing.linear }),
      );
      mark.set(
        withDelay(
          210,
          withSequence(
            withTiming(1, { duration: 250 }),
            withDelay(430, withTiming(0, { duration: 230 })),
          ),
        ),
      );
      spin.set(
        withDelay(
          190,
          withTiming(360, { duration: 810, easing: Easing.out(Easing.cubic) }),
        ),
      );
    }
    const swap = setTimeout(
      () => {
        swapMode(reveal.to);
        void Haptics.selectionAsync().catch(() => {});
        const destination =
          reveal.destination ??
          (reveal.to === "observe"
            ? "/observe"
            : activeAnswerId
              ? `/ask/answer/${activeAnswerId}`
              : "/");
        router.replace(destination as Href);
        if (reduced) opacity.set(withTiming(0, { duration: 140 }));
      },
      reduced ? 0 : 670,
    );
    const done = setTimeout(finish, reduced ? 160 : 1380);
    const abort = registerAutopilotAbortHandler(() => {
      clearTimeout(swap);
      clearTimeout(done);
      finish();
    });
    return () => {
      clearTimeout(swap);
      clearTimeout(done);
      [progress, phase, opacity, mark, spin].forEach(cancelAnimation);
      abort();
    };
  }, [
    reveal,
    activeAnswerId,
    router,
    swapMode,
    finish,
    progress,
    phase,
    opacity,
    mark,
    spin,
  ]);
  const backWave = useAnimatedProps(() => ({
    d: waveBand(width, height, progress.get(), phase.get() + 0.6, 32),
  }));
  const frontWave = useAnimatedProps(() => ({
    d: waveBand(width, height, progress.get(), phase.get(), 0),
  }));
  const shell = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  const label = useAnimatedStyle(() => ({
    opacity: mark.get(),
    transform: [{ translateY: (1 - mark.get()) * 16 }],
  }));
  const mascot = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${spin.get()}deg` },
      { scale: 0.88 + 0.12 * mark.get() },
    ],
  }));
  if (!reveal) return null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.shell, shell]}>
      {reveal.reduceMotion ? (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: "#F7E8AB" }]}
        />
      ) : (
        <Svg
          width={width}
          height={height}
          style={StyleSheet.absoluteFill}
          aria-hidden={true}
        >
          <AnimatedPath animatedProps={backWave} fill="#A7C9BC" />
          <AnimatedPath
            animatedProps={frontWave}
            fill="#F7E8AB"
            stroke="#FFF8DC"
            strokeWidth={2}
          />
        </Svg>
      )}
      <Animated.View style={[styles.center, label]}>
        <Animated.View style={mascot}>
          <View style={{ transform: [{ scaleX: -1 }] }}>
            <BrandImage kind="scout" size={164} />
          </View>
        </Animated.View>
        <Text style={styles.title}>
          {reveal.to === "observe"
            ? "A fresh pair of eyes."
            : "A little more clarity."}
        </Text>
        <Text style={styles.caption}>
          {reveal.to === "observe" ? "LET’S GO SCOUTING" : "BACK TO YOUR WORLD"}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  shell: { zIndex: 2000, elevation: 30, overflow: "hidden" },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
  },
  title: {
    fontFamily: font.ui700,
    fontSize: 28,
    letterSpacing: -1,
    color: "#2C3E33",
    textAlign: "center",
  },
  caption: {
    fontFamily: font.ui700,
    fontSize: 10,
    letterSpacing: 2,
    color: "#596646",
  },
});
