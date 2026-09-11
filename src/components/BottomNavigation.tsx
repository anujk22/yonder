import { useEffect, useState } from "react";
import { Keyboard, Platform, StyleSheet, Text, View } from "react-native";
import { usePathname } from "expo-router";
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

const tabs = [
  { route: "/", label: "Explore", icon: "compass" },
  { route: "/activity", label: "Requests", icon: "chat" },
  { route: "/saved", label: "Saved", icon: "heart" },
  { route: "/observe", label: "Scout", icon: "scout" },
] as const;

function TabItem({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: ArtworkKind;
  active: boolean;
  onPress: (event: import("react-native").GestureResponderEvent) => void;
}) {
  const theme = useActiveTheme();
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
      { translateY: -3 * progress.get() },
      { scale: 0.92 + 0.12 * progress.get() },
      { rotate: `${-6 * progress.get()}deg` },
    ],
  }));
  return (
    <MotionPressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
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
          <View style={icon === "scout" ? styles.scoutFacingLeft : undefined}>
            <BrandImage kind={icon} size={44} />
          </View>
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
    : pathname.startsWith("/ask") || pathname.startsWith("/spots") || pathname === "/map"
      ? "/"
      : pathname;
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {tabs.map((tab) => (
        <TabItem
          key={tab.route}
          {...tab}
          active={current === tab.route}
          onPress={(event) =>
            navigate(tab.route, {
              x: event.nativeEvent.pageX,
              y: event.nativeEvent.pageY,
            })
          }
        />
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  scoutFacingLeft: { transform: [{ scaleX: -1 }] },
  bar: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: 25,
    marginHorizontal: 10,
    marginBottom: 8,
    boxShadow: "0 -3px 18px #243C3210, 0 4px 0 #243C3210",
    paddingTop: 7,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    minHeight: 55,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  icon: {
    width: 48,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  highlight: { position: "absolute", inset: 0, borderRadius: 24 },
  label: { fontSize: 11, lineHeight: 16, letterSpacing: 0.1 },
});
