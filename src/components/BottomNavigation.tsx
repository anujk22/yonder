import { DEMO_FEATURES_ENABLED, LIVE_FEATURES_ENABLED } from "@/lib/previewFeatures";
import { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, StyleSheet, Text, View } from "react-native";
import { useGlobalSearchParams, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandImage, type ArtworkKind } from "./BrandImage";
import { useScoutNavigation } from "@/lib/useScoutNavigation";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MotionPressable } from "./MotionPressable";
import { useActiveTheme } from "@/lib/store";
import { font } from "@/lib/theme";
import { measureAutopilotRef, useAutopilotGlobalTarget } from "@/lib/autopilot";

const tabs = [
  { route: "/", label: "Explore", icon: "compass" },
  { route: "/activity", label: "Requests", icon: "chat" },
  { route: "/saved", label: "Saved", icon: "heart" },
  { route: "/observe", label: "Scout", icon: "scoutFront" },
] as const;

function TabItem({
  label,
  icon,
  active,
  onPress,
  autopilotId,
}: {
  label: string;
  icon: ArtworkKind;
  active: boolean;
  onPress: (origin: { x: number; y: number }) => void;
  autopilotId?: string;
}) {
  const theme = useActiveTheme();
  const ref = useRef<View>(null);
  useAutopilotGlobalTarget(autopilotId, ref, async () => {
    const frame = await measureAutopilotRef(ref);
    onPress(frame ? { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 } : { x: 0, y: 0 });
  });
  const progress = useSharedValue(active ? 1 : 0);
  const reduced = useReducedMotion();
  useEffect(() => {
    progress.set(
      reduced
        ? Number(active)
        : withSpring(Number(active), { damping: 18, stiffness: 240 }),
    );
  }, [active, progress, reduced]);
  const highlight = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 0.8 + 0.2 * progress.get() }],
  }));
  const objectMotion = useAnimatedStyle(() => ({
    transform: [
      { translateY: -1.5 * progress.get() },
      { scale: 0.94 + 0.1 * progress.get() },
      { rotate: `${icon === "scoutFront" ? 0 : -6 * progress.get()}deg` },
    ],
  }));
  return (
    <MotionPressable
      ref={ref}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={(event) => onPress({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })}
      style={styles.tab}
    >
      <View style={styles.icon}>
        <Animated.View
          style={[
            styles.highlight,
            { backgroundColor: theme.accentSoft },
            highlight,
          ]}
        />
        <Animated.View style={[{ zIndex: 1 }, objectMotion]}>
          <BrandImage kind={icon} size={36} />
        </Animated.View>
      </View>
      <Text
        style={[
          styles.label,
          {
            color: active ? theme.ink : theme.inkSoft,
            fontFamily: active ? font.ui700 : font.ui500,
          },
        ]}
      >
        {label}
      </Text>
    </MotionPressable>
  );
}

export function BottomNavigation() {
  const pathname = usePathname();
  const { from } = useGlobalSearchParams<{ from?: string }>();
  const navigate = useScoutNavigation();
  const insets = useSafeAreaInsets();
  const theme = useActiveTheme();
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboard(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboard(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboard) return null;
  const current = pathname.startsWith("/observe")
    ? "/observe"
    : pathname.startsWith("/live")
      ? pathname === "/live/new" ? "/" : from === "scout" ? "/observe" : "/activity"
      : pathname.startsWith("/ask") || pathname.startsWith("/spots") || pathname === "/map"
      ? "/"
      : pathname;
  return (
    <View style={{ backgroundColor: theme.bg, paddingBottom: Math.max(insets.bottom - 12, 8) }}>
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
        },
      ]}
    >
      {tabs.filter((tab) => DEMO_FEATURES_ENABLED || LIVE_FEATURES_ENABLED || tab.route === "/" || tab.route === "/saved").map((tab) => (
        <TabItem
          key={tab.route}
          {...tab}
          active={current === tab.route}
          autopilotId={tab.route === "/" ? "nav-explore" : undefined}
          onPress={(origin) => navigate(tab.route, origin)}
        />
      ))}
    </View>
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 25,
    marginHorizontal: 10,
    boxShadow: "0 -3px 18px #243C3210, 0 4px 0 #243C3210",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  icon: {
    width: 44,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  highlight: { position: "absolute", inset: 0, borderRadius: 19 },
  label: { fontSize: 11, lineHeight: 16, letterSpacing: 0.1 },
});
