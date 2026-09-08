import { useCallback, useEffect, useRef } from "react";
import {
  GestureResponderEvent,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_500Medium_Italic,
} from "@expo-google-fonts/fraunces";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { BottomNavigation } from "@/components/BottomNavigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AutopilotLayer } from "@/components/AutopilotLayer";
import { ModeReveal } from "@/components/ModeReveal";
import { ModeToggle } from "@/components/ModeToggle";
import { useActiveTheme, useYonderStore } from "@/lib/store";
import { DEMO_FLAGS } from "@/lib/demoFlags";
import { abortAutopilot } from "@/lib/autopilot";
import { AppHeader } from "@/components/Brand";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const reloadHandled = useRef(false);
  const theme = useActiveTheme();
  const { width } = useWindowDimensions();
  const isExplore =
    pathname === "/" || pathname === "/ask" || pathname === "/map";
  const isImmersive = pathname === "/observe/capture";
  const mode = useYonderStore((state) => state.mode);
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_500Medium_Italic,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  const hideModeToggle = !DEMO_FLAGS.autopilotEnabled;

  useEffect(() => {
    useYonderStore
      .getState()
      .swapMode(pathname.startsWith("/observe") ? "observe" : "ask");
  }, [pathname]);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      !DEMO_FLAGS.enableDemoReset ||
      !fontsLoaded ||
      reloadHandled.current
    )
      return;
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    reloadHandled.current = true;
    if (navigation?.type === "reload" && pathname !== "/") router.replace("/");
  }, [fontsLoaded, pathname, router]);

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    // DEMO: deterministic path for recording. Real implementation below.
    if (DEMO_FLAGS.autopilotEnabled && event.nativeEvent.touches.length >= 2)
      abortAutopilot();
  }, []);

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <View
          onTouchStart={
            DEMO_FLAGS.autopilotEnabled ? handleTouchStart : undefined
          }
          style={[styles.root, { backgroundColor: theme.bg }]}
        >
          <StatusBar style={mode === "ask" ? "dark" : "light"} animated />
          {!isImmersive &&
            pathname !== "/map" &&
            !isExplore && <AppHeader />}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[
              styles.root,
              !isExplore &&
                width > 800 && {
                  width: "100%",
                  maxWidth: pathname === "/about" ? 1040 : 780,
                  alignSelf: "center",
                  paddingTop: 24,
                },
            ]}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.bg },
                animation: mode === "ask" ? "slide_from_right" : "fade",
                gestureEnabled: true,
              }}
            >
              <Stack.Screen name="index" options={{ animation: "fade" }} />
              <Stack.Screen name="map" options={{ animation: "fade" }} />
              <Stack.Screen name="saved" options={{ animation: "fade" }} />
              <Stack.Screen name="activity" options={{ animation: "fade" }} />
              <Stack.Screen
                name="observe/index"
                options={{ animation: "fade" }}
              />
            </Stack>
          </KeyboardAvoidingView>
          {!isImmersive && width < 900 && <BottomNavigation />}
          {!hideModeToggle ? <ModeToggle /> : null}
          <ModeReveal />
          {DEMO_FLAGS.autopilotEnabled ? <AutopilotLayer /> : null}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
