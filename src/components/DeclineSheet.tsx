import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glyph } from '@/components/Glyph';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

export type DeclineReason = 'not_found' | 'unsafe' | 'staff';

type DeclineSheetProps = {
  visible: boolean;
  onClose: () => void;
  onComplete?: (reason: DeclineReason) => void;
};

const REASONS: { id: DeclineReason; label: string }[] = [
  { id: 'not_found', label: "Can't find it" },
  { id: 'unsafe', label: "Doesn't feel safe" },
  { id: 'staff', label: 'Staff asked me not to photograph' },
];

export function DeclineSheet({ visible, onClose, onComplete }: DeclineSheetProps) {
  const theme = useActiveTheme();
  const router = useRouter();
  const releaseActiveTask = useYonderStore((state) => state.releaseActiveTask);
  const blockActivePlace = useYonderStore((state) => state.blockActivePlace);
  const setWideShot = useYonderStore((state) => state.setWideShot);
  const [confirmation, setConfirmation] = useState<'blocked' | 'unsafe' | null>(null);

  useEffect(() => {
    if (!visible) setConfirmation(null);
  }, [visible]);

  const dismiss = () => {
    setConfirmation(null);
    onClose();
  };

  const finish = (reason: DeclineReason) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete?.(reason);

    if (reason === 'not_found') {
      setWideShot(true);
      onClose();
      router.replace('/observe/capture');
      return;
    }
    if (reason === 'unsafe') {
      releaseActiveTask("Doesn't feel safe");
      setConfirmation('unsafe');
      return;
    }

    blockActivePlace();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmation('blocked');
  };

  const closeConfirmation = () => {
    setConfirmation(null);
    onClose();
    router.replace('/observe');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss} presentationStyle="overFullScreen">
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <Animated.View entering={FadeIn.duration(180)} style={[StyleSheet.absoluteFill, { backgroundColor: theme.scrim }]} />
        <Pressable accessibilityLabel="Close decline sheet" onPress={dismiss} style={StyleSheet.absoluteFill} />
        <Animated.View
          entering={FadeInDown.springify().damping(18).stiffness(140)}
          style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          {confirmation ? (
            <View style={styles.confirmation}>
              <Text style={[type.title, { color: theme.ink }]}>{confirmation === 'blocked' ? 'Thanks for telling us.' : 'Thanks.'}</Text>
              <Text style={[type.body, { color: theme.inkSoft }]}>
                {confirmation === 'blocked'
                  ? `We've removed this location from Yonder.\nYou've been paid in full.`
                  : `Never take an observation that doesn't feel right.\nNo penalty.`}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={closeConfirmation}
                style={({ pressed }) => [styles.doneButton, { backgroundColor: theme.accent, opacity: pressed ? 0.86 : 1 }]}
              >
                <Text style={[type.label, styles.doneLabel, { color: theme.onAccent }]}>Done</Text>
                <Glyph name="check" color={theme.onAccent} />
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.titleRow}>
                <View style={styles.titleCopy}>
                  <Text style={[type.title, { color: theme.ink }]}>Decline observation</Text>
                  <Text style={[type.body, { color: theme.inkSoft }]}>No penalty. Choose what happened.</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={dismiss} style={styles.closeButton}>
                  <Glyph name="close" color={theme.inkSoft} />
                </Pressable>
              </View>
              <View style={styles.reasons}>
                {REASONS.map((reason) => (
                  <Pressable
                    key={reason.id}
                    accessibilityRole="button"
                    onPress={() => finish(reason.id)}
                    style={({ pressed }) => [
                      styles.reason,
                      { backgroundColor: theme.surfaceAlt, borderColor: theme.border, opacity: pressed ? 0.76 : 1 },
                    ]}
                  >
                    <Text style={[type.label, styles.reasonLabel, { color: theme.ink }]}>{reason.label}</Text>
                    <Glyph name="chevron" color={theme.inkSoft} size={18} />
                  </Pressable>
                ))}
              </View>
              <Text style={[type.label, styles.reassurance, { color: theme.inkSoft }]}>Observers are always paid for valid evidence, never for a particular answer.</Text>
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, borderWidth: 1, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.lg },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: space.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  titleCopy: { flex: 1, gap: space.xs },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  reasons: { gap: space.xs, marginTop: space.lg },
  reason: { minHeight: 58, borderRadius: radii.small, borderWidth: 1, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reasonLabel: { fontSize: 15, textTransform: 'none', letterSpacing: 0.1 },
  reassurance: { marginTop: space.md, textAlign: 'center' },
  confirmation: { paddingTop: space.md, paddingBottom: space.sm, gap: space.md },
  doneButton: { minHeight: 58, borderRadius: radii.small, marginTop: space.sm, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doneLabel: { fontSize: 15, textTransform: 'none', letterSpacing: 0.1 },
});
