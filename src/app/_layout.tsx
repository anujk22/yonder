import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { useFonts as useSpaceGrotesk, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts as useJetBrainsMono, JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';

import { LaunchOverlay } from '@/components/LaunchOverlay';
import { ModeReveal } from '@/components/ModeReveal';
import { ModeToggle } from '@/components/ModeToggle';
import { useActiveTheme, useYonderStore } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const pathname = usePathname();
  const theme = useActiveTheme();
  const mode = useYonderStore((state) => state.mode);
  const [showLaunch, setShowLaunch] = useState(true);
  const [spaceLoaded, spaceError] = useSpaceGrotesk({ SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold });
  const [interLoaded, interError] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  const [monoLoaded, monoError] = useJetBrainsMono({ JetBrainsMono_400Regular, JetBrainsMono_500Medium });
  const fontsLoaded = spaceLoaded && interLoaded && monoLoaded;
  const fontError = spaceError ?? interError ?? monoError;

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  const finishLaunch = useCallback(() => setShowLaunch(false), []);

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={[styles.root, { backgroundColor: theme.bg }]}>
        <StatusBar style={mode === 'ask' ? 'dark' : 'light'} animated />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
            animation: mode === 'ask' ? 'slide_from_right' : 'fade',
            gestureEnabled: true,
          }}
        />
        {pathname !== '/observe/capture' ? <ModeToggle /> : null}
        <ModeReveal />
        {showLaunch ? <LaunchOverlay onFinish={finishLaunch} /> : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
