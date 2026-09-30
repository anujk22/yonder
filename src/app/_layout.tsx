import { DEMO_FEATURES_ENABLED, LIVE_FEATURES_ENABLED } from "@/lib/previewFeatures";
import { useCallback, useEffect, useRef } from "react";
import {
  GestureResponderEvent,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack, useGlobalSearchParams, usePathname, useRouter } from "expo-router";
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
import { observeLiveAuth } from "@/lib/liveAuth";
import { observePurchases } from "@/lib/purchaseStore";
import { observePush } from "@/lib/push";
import { useOnboarding, useOnboardingHydration } from "@/lib/onboarding";
import { Onboarding } from "@/components/Onboarding";
import { CORE_SCREEN_NAMES, DEMO_SCREEN_NAMES, LIVE_SCREEN_NAMES } from "@/lib/demoRoutes";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const { from } = useGlobalSearchParams<{ from?: string }>();
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
  const onboardingHydrated = useOnboardingHydration((s) => s.hydrated);
  const onboardingDone = useOnboarding((s) => s.done);
  const showOnboarding = onboardingHydrated && !onboardingDone;
  const hideModeToggle = !DEMO_FEATURES_ENABLED || !DEMO_FLAGS.autopilotEnabled;

  useEffect(() => observeLiveAuth(), []);
  useEffect(() => observePurchases(), []);
  useEffect(() => observePush(), []);

  useEffect(() => {
    useYonderStore
      .getState()
      .swapMode((DEMO_FEATURES_ENABLED || LIVE_FEATURES_ENABLED) && (pathname.startsWith("/observe") || (pathname.startsWith("/live") && from === "scout")) ? "observe" : "ask");
  }, [pathname, from]);

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
            __DEV__ && DEMO_FLAGS.autopilotEnabled ? handleTouchStart : undefined
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
              <Stack.Protected guard={DEMO_FEATURES_ENABLED || LIVE_FEATURES_ENABLED}>
                {CORE_SCREEN_NAMES.map((name) => (
                  <Stack.Screen key={name} name={name} options={{ animation: "fade" }} />
                ))}
              </Stack.Protected>
              <Stack.Protected guard={LIVE_FEATURES_ENABLED}>
                {LIVE_SCREEN_NAMES.map((name) => <Stack.Screen key={name} name={name} />)}
              </Stack.Protected>
              <Stack.Protected guard={DEMO_FEATURES_ENABLED}>
                {DEMO_SCREEN_NAMES.map((name) => (
                  <Stack.Screen key={name} name={name} />
                ))}
              </Stack.Protected>
            </Stack>
          </KeyboardAvoidingView>
          {!isImmersive && width < 900 && <BottomNavigation />}
          {!hideModeToggle ? <ModeToggle /> : null}
          {DEMO_FEATURES_ENABLED || LIVE_FEATURES_ENABLED ? <ModeReveal /> : null}
          {__DEV__ && DEMO_FLAGS.autopilotEnabled ? <AutopilotLayer /> : null}
          {showOnboarding && !DEMO_FLAGS.skipOnboarding ? <Onboarding /> : null}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
