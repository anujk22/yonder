import { useCallback, useEffect, useRef } from 'react';
import { GestureResponderEvent, Platform, StyleSheet, View } from 'react-native';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts as useJetBrainsMono, JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import {
  useFonts as useCormorantGaramond,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';

import { AutopilotLayer } from '@/components/AutopilotLayer';
import { ModeReveal } from '@/components/ModeReveal';
import { ModeToggle } from '@/components/ModeToggle';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { DEMO_FLAGS } from '@/lib/demoFlags';
import { abortAutopilot } from '@/lib/autopilot';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const reloadHandled = useRef(false);
  const theme = useActiveTheme();
  const mode = useYonderStore((state) => state.mode);
  const [interLoaded, interError] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [monoLoaded, monoError] = useJetBrainsMono({ JetBrainsMono_400Regular, JetBrainsMono_500Medium });
  const [serifLoaded, serifError] = useCormorantGaramond({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
  });
  const fontsLoaded = interLoaded && monoLoaded && serifLoaded;
  const fontError = interError ?? monoError ?? serifError;
  const hideModeToggle = pathname === '/observe/capture' || pathname === '/observe/earned' || pathname.startsWith('/ask/answer/');

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !DEMO_FLAGS.enableDemoReset || !fontsLoaded || reloadHandled.current) return;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    reloadHandled.current = true;
    if (navigation?.type === 'reload' && pathname !== '/') router.replace('/');
  }, [fontsLoaded, pathname, router]);

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    // DEMO: deterministic path for recording. Real implementation below.
    if (DEMO_FLAGS.autopilotEnabled && event.nativeEvent.touches.length >= 2) abortAutopilot();
  }, []);

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View onTouchStart={DEMO_FLAGS.autopilotEnabled ? handleTouchStart : undefined} style={[styles.root, { backgroundColor: theme.bg }]}>
        <StatusBar style={mode === 'ask' ? 'dark' : 'light'} animated />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
            animation: mode === 'ask' ? 'slide_from_right' : 'fade',
            gestureEnabled: true,
          }}
        />
        {!hideModeToggle ? <ModeToggle /> : null}
        <ModeReveal />
        {DEMO_FLAGS.autopilotEnabled ? <AutopilotLayer /> : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
