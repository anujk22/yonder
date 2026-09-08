import { PropsWithChildren, ReactNode, useEffect, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { usePathname, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { MotionPressable } from "./MotionPressable";
import { SafeAreaView } from "react-native-safe-area-context";

import { Glyph } from "@/components/Glyph";
import { useAutopilotPressTarget } from "@/lib/autopilot";
import { useActiveTheme } from "@/lib/store";
import { font, space, type } from "@/lib/theme";

export function AppScreen({
  children,
  scroll = true,
  style,
  bottomInset = true,
  footer,
}: PropsWithChildren<{
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  bottomInset?: boolean;
  footer?: ReactNode;
}>) {
  const theme = useActiveTheme();
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        bottomInset && styles.bottomInset,
        style,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.content,
        styles.flex,
        bottomInset && styles.bottomInset,
        style,
      ]}
    >
      {children}
    </View>
  );
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      edges={["left", "right"]}
    >
      {body}
      {footer && (
        <View
          style={{
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: 12,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: theme.border,
          }}
        >
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

export function MissingDataState({
  title = "This step is not available yet.",
}: {
  title?: string;
}) {
  const theme = useActiveTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isObserveRoute = pathname.startsWith("/observe");
  return (
    <AppScreen scroll={false}>
      <ScreenHeader eyebrow="DEMO STATE UNAVAILABLE" />
      <View style={styles.missingData}>
        <Text style={[type.heading, { color: theme.ink }]}>{title}</Text>
        <Text style={[type.body, { color: theme.inkSoft }]}>
          Return home and start the flow again.
        </Text>
        <View style={styles.missingDataAction}>
          <PrimaryButton
            label={isObserveRoute ? "Back to tasks" : "Back to Ask home"}
            onPress={() => router.replace(isObserveRoute ? "/observe" : "/ask")}
          />
        </View>
      </View>
    </AppScreen>
  );
}

export function Entrance({
  children,
  index = 0,
  style,
}: PropsWithChildren<{ index?: number; style?: StyleProp<ViewStyle> }>) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    progress.set(
      reduced ? 1 : withDelay(index * 35, withTiming(1, { duration: 350 })),
    );
  }, [index, progress, reduced]);
  const entrance = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * 12 }],
  }));
  return <Animated.View style={[style, entrance]}>{children}</Animated.View>;
}

export function ScreenHeader({
  title,
  eyebrow,
  right,
}: {
  title?: string;
  eyebrow?: string;
  right?: ReactNode;
}) {
  const theme = useActiveTheme();
  const router = useRouter();
  return (
    <View style={styles.headerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => {
          Haptics.selectionAsync();
          if (router.canGoBack()) router.back();
          else router.replace("/");
        }}
        style={[
          styles.backButton,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Glyph name="back" color={theme.ink} size={19} />
      </Pressable>
      <View style={styles.headerTitle}>
        {eyebrow ? (
          <Text style={[type.micro, { color: theme.inkSoft }]}>{eyebrow}</Text>
        ) : null}
        {title ? (
          <Text style={[type.heading, { color: theme.ink }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  icon = "arrow",
  variant = "primary",
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: "arrow" | "camera" | "check" | "lock";
  variant?: "primary" | "secondary" | "danger";
  testID?: string;
}) {
  const theme = useActiveTheme();
  const ref = useRef<View>(null);
  const palette =
    variant === "primary"
      ? {
          background: theme.accent,
          foreground: theme.onAccent,
          border: theme.accent,
        }
      : variant === "danger"
        ? {
            background: theme.danger,
            foreground: theme.onAccent,
            border: theme.danger,
          }
        : {
            background: theme.surface,
            foreground: theme.ink,
            border: theme.border,
          };
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  useAutopilotPressTarget(testID, ref, handlePress);
  return (
    <MotionPressable
      ref={ref}
      haptic={false}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: palette.background,
          borderColor: variant === "primary" ? "#FFEC96" : palette.border,
          boxShadow:
            variant === "primary"
              ? "0 4px 0 #BCAA43, 0 8px 15px #72672718"
              : "0 3px 0 #243C3210",
          opacity: disabled ? 0.42 : pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text
        style={[type.label, styles.buttonLabel, { color: palette.foreground }]}
      >
        {label}
      </Text>
      <Glyph name={icon} color={palette.foreground} size={20} />
    </MotionPressable>
  );
}

export function SectionLabel({
  children,
  color,
}: PropsWithChildren<{ color?: string }>) {
  const theme = useActiveTheme();
  return (
    <Text style={[type.micro, { color: color ?? theme.inkSoft }]}>
      {children}
    </Text>
  );
}

export function Hairline() {
  const theme = useActiveTheme();
  return <View style={[styles.hairline, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm },
  bottomInset: { paddingBottom: 48 },
  headerRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { flex: 1, paddingHorizontal: space.sm, gap: 1 },
  headerRight: { minWidth: 42, alignItems: "flex-end" },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonLabel: {
    fontFamily: font.ui600,
    fontSize: 15,
    textTransform: "none",
    letterSpacing: 0.1,
  },
  hairline: { height: StyleSheet.hairlineWidth, width: "100%" },
  missingData: {
    flex: 1,
    justifyContent: "center",
    gap: space.sm,
    paddingBottom: space.xl,
  },
  missingDataAction: { marginTop: space.lg },
});
