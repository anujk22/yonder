import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CityMap } from '@/components/CityMap';
import { PrimaryButton, Entrance } from '@/components/ui';
import { TickingNumber } from '@/components/TickingNumber';
import { YMark } from '@/components/YMark';
import { isUnsafeQuestion } from '@/lib/safety';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

const SUGGESTIONS = [
  { question: 'Are any pickleball courts free at Pier 2?', placeId: 'pier2' },
  { question: "How long is the line at Joe's Pizza?", placeId: 'joes' },
  { question: 'Is the Union Sq elevator working?', placeId: 'unionsq' },
  { question: 'Is the black Pegasus 41 in a 10 at Nike SoHo?', placeId: 'nikesoho' },
] as const;

export default function AskHomeScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const draftQuestion = useYonderStore((state) => state.draftQuestion);
  const walletCents = useYonderStore((state) => state.walletCents);
  const resolvedPlaceId = useYonderStore((state) => state.resolvedPlaceId);
  const setDraftQuestion = useYonderStore((state) => state.setDraftQuestion);
  const setResolvedPlace = useYonderStore((state) => state.setResolvedPlace);
  const resolveDraftPlace = useYonderStore((state) => state.resolveDraftPlace);
  const setTargetHint = useYonderStore((state) => state.setTargetHint);
  const canContinue = draftQuestion.trim().length > 0;

  const continueWithQuestion = () => {
    if (!canContinue) return;
    setTargetHint('');
    if (isUnsafeQuestion(draftQuestion)) {
      router.push('/ask/rejected');
      return;
    }
    if (!resolvedPlaceId) resolveDraftPlace();
    router.push('/ask/place');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Entrance style={styles.topBar}>
          <View style={styles.brandLockup}>
            <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
              <YMark size={18} bodyColor={theme.onAccent} headColor={theme.onAccent} />
            </View>
            <Text style={[type.micro, { color: theme.ink }]}>YONDER</Text>
          </View>
          <View style={styles.topBarData}>
            <TickingNumber value={walletCents} initialValue={2000} color={theme.ink} formatter={(value) => `$${(Math.round(value) / 100).toFixed(2)}`} style={styles.balance} />
            <Text style={[type.mono, styles.observerCount, { color: theme.inkSoft }]}>1,847 observers active in NYC</Text>
          </View>
        </Entrance>

        <Entrance index={1} style={styles.questionSection}>
          <TextInput
            accessibilityLabel="Question about a place"
            autoCapitalize="sentences"
            multiline
            onChangeText={setDraftQuestion}
            onSubmitEditing={continueWithQuestion}
            placeholder="What's happening over there?"
            placeholderTextColor={theme.inkFaint}
            returnKeyType="go"
            selectionColor={theme.accent}
            style={[type.display, styles.questionInput, { color: theme.ink }]}
            value={draftQuestion}
          />
          <PrimaryButton label="Continue" onPress={continueWithQuestion} disabled={!canContinue} />
        </Entrance>

        <Entrance index={2} style={styles.suggestions}>
          <Text style={[type.micro, { color: theme.inkSoft }]}>TRY A LIVE QUERY</Text>
          <View style={styles.chipList}>
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion.question}
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setDraftQuestion(suggestion.question);
                  setResolvedPlace(suggestion.placeId);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={[type.label, styles.chipText, { color: theme.ink }]}>{suggestion.question}</Text>
              </Pressable>
            ))}
          </View>
        </Entrance>
      </View>

      <Entrance index={3} style={[styles.mapShell, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <CityMap height={292} showOpenBounties />
      </Entrance>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingBottom: 102 },
  content: { flex: 1, paddingHorizontal: space.lg, paddingTop: space.sm },
  topBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  topBarData: { alignItems: 'flex-end' },
  balance: { width: 86, textAlign: 'right', fontSize: 13, lineHeight: 17 },
  observerCount: { fontSize: 9.5, lineHeight: 14 },
  questionSection: { flex: 1, justifyContent: 'center', gap: space.md, paddingVertical: space.md },
  questionInput: { minHeight: 96, maxHeight: 142, padding: 0, textAlignVertical: 'center' },
  suggestions: { gap: space.xs, paddingBottom: space.md },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { width: '48.8%', minHeight: 48, borderWidth: 1, borderRadius: radii.small, paddingHorizontal: space.sm, paddingVertical: 9, justifyContent: 'center' },
  chipText: { fontSize: 11.5, lineHeight: 15 },
  mapShell: { height: 292, overflow: 'hidden', borderTopWidth: 1 },
});
