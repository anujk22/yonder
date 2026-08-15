import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { Glyph } from '@/components/Glyph';
import { YMark } from '@/components/YMark';
import { AppScreen, Entrance, PrimaryButton } from '@/components/ui';
import { startAutopilot } from '@/lib/autopilot';
import { DEMO_FLAGS } from '@/lib/demoFlags';
import { useActiveTheme } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

export default function LandingScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const openAsk = useCallback(() => router.push('/ask'), [router]);

  if (DEMO_FLAGS.skipOnboarding) return <Redirect href="/ask" />;

  return (
    <AppScreen scroll={false} style={styles.content}>
      {DEMO_FLAGS.autopilotEnabled ? (
        <Pressable
          accessible={false}
          testID="autopilot-start"
          onPress={startAutopilot}
          style={styles.autopilotTrigger}
        />
      ) : null}

      <Entrance style={styles.brandRow}>
        <View style={[styles.markShell, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <YMark size={38} bodyColor={theme.ink} />
        </View>
        <Text style={[type.mono, styles.wordmark, { color: theme.inkSoft }]}>YONDER</Text>
      </Entrance>

      <View style={styles.hero}>
        <Entrance index={1}>
          <Text style={[type.serifDisplay, styles.title, { color: theme.ink }]}>Know before{`\n`}you go.</Text>
        </Entrance>
        <Entrance index={2} style={styles.supportRow}>
          <View style={[styles.liveDot, { backgroundColor: theme.fresh }]} />
          <Text style={[type.body, styles.support, { color: theme.inkSoft }]}>Fresh, verified answers from people already there.</Text>
        </Entrance>
      </View>

      <Entrance index={3} style={styles.action}>
        <PrimaryButton label="Ask Yonder" onPress={openAsk} testID="landing-ask" />
        <View style={styles.helperRow}>
          <Glyph name="eye" color={theme.inkFaint} size={16} />
          <Text style={[type.mono, styles.helper, { color: theme.inkFaint }]}>See the place before you leave</Text>
        </View>
      </Entrance>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg },
  autopilotTrigger: { position: 'absolute', top: 0, right: 0, zIndex: 6, width: 44, height: 44, opacity: 0 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  markShell: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, lineHeight: 16, letterSpacing: 2.6 },
  hero: { flex: 1, justifyContent: 'center', paddingBottom: space.xl, gap: space.lg },
  title: { fontSize: 66, lineHeight: 61, letterSpacing: -1.4 },
  supportRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, maxWidth: 320 },
  liveDot: { width: 8, height: 8, borderRadius: radii.pill, marginTop: 8 },
  support: { flex: 1, fontSize: 17, lineHeight: 25 },
  action: { gap: space.md },
  helperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs },
  helper: { fontSize: 10, lineHeight: 15 },
});
