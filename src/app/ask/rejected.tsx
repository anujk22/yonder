import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Glyph } from '@/components/Glyph';
import { AppScreen, Entrance, PrimaryButton, ScreenHeader } from '@/components/ui';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

export default function RejectedScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const setDraftQuestion = useYonderStore((state) => state.setDraftQuestion);
  const setResolvedPlace = useYonderStore((state) => state.setResolvedPlace);
  const setTargetHint = useYonderStore((state) => state.setTargetHint);

  const startOver = () => {
    setDraftQuestion('');
    setResolvedPlace(null);
    setTargetHint('');
    router.replace('/ask');
  };

  return (
    <AppScreen scroll={false} style={styles.screen}>
      <ScreenHeader eyebrow="QUERY DECLINED" />
      <Entrance style={styles.content}>
        <View style={[styles.icon, { backgroundColor: theme.surface, borderColor: theme.danger }]}>
          <Glyph name="shield" color={theme.danger} size={34} />
        </View>
        <Text style={[type.title, { color: theme.danger }]}>We can't ask this.</Text>
        <Text style={[type.body, styles.explanation, { color: theme.inkSoft }]}>Yonder answers questions about places and conditions, never about identifiable people.</Text>
        <View style={[styles.ruleCard, { backgroundColor: theme.surfaceAlt }]}>
          <Text style={[type.micro, { color: theme.inkSoft }]}>THE BOUNDARY</Text>
          <Text style={[type.heading, { color: theme.ink }]}>Ask about the place instead?</Text>
        </View>
      </Entrance>
      <Entrance index={1}>
        <PrimaryButton label="Ask about a place" onPress={startOver} />
      </Entrance>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', paddingBottom: space.xl },
  icon: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  explanation: { maxWidth: 330, marginTop: space.md },
  ruleCard: { borderRadius: radii.card, padding: space.lg, gap: space.xs, marginTop: space.xl },
});
