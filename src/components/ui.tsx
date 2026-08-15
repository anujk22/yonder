import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glyph } from '@/components/Glyph';
import { useActiveTheme } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

export function AppScreen({ children, scroll = true, style, bottomInset = true }: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle>; bottomInset?: boolean }>) {
  const theme = useActiveTheme();
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, bottomInset && styles.bottomInset, style]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, bottomInset && styles.bottomInset, style]}>{children}</View>
  );
  return <SafeAreaView style={[styles.screen, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>{body}</SafeAreaView>;
}

export function MissingDataState({ title = 'This step is not available yet.' }: { title?: string }) {
  const theme = useActiveTheme();
  return (
    <AppScreen scroll={false}>
      <ScreenHeader eyebrow="DEMO STATE UNAVAILABLE" />
      <View style={styles.missingData}>
        <Text style={[type.heading, { color: theme.ink }]}>{title}</Text>
        <Text style={[type.body, { color: theme.inkSoft }]}>Return to the previous step and try again.</Text>
      </View>
    </AppScreen>
  );
}

export function Entrance({ children, index = 0, style }: PropsWithChildren<{ index?: number; style?: StyleProp<ViewStyle> }>) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 45).springify().damping(18).stiffness(140)} style={style}>
      {children}
    </Animated.View>
  );
}

export function ScreenHeader({ title, eyebrow, right }: { title?: string; eyebrow?: string; right?: ReactNode }) {
  const theme = useActiveTheme();
  const router = useRouter();
  return (
    <View style={styles.headerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => {
          Haptics.selectionAsync();
          router.back();
        }}
        style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Glyph name="back" color={theme.ink} size={19} />
      </Pressable>
      <View style={styles.headerTitle}>
        {eyebrow ? <Text style={[type.micro, { color: theme.inkSoft }]}>{eyebrow}</Text> : null}
        {title ? <Text style={[type.heading, { color: theme.ink }]} numberOfLines={1}>{title}</Text> : null}
      </View>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled = false, icon = 'arrow', variant = 'primary' }: { label: string; onPress: () => void; disabled?: boolean; icon?: 'arrow' | 'camera' | 'check' | 'lock'; variant?: 'primary' | 'secondary' | 'danger' }) {
  const theme = useActiveTheme();
  const palette = variant === 'primary'
    ? { background: theme.accent, foreground: theme.onAccent, border: theme.accent }
    : variant === 'danger'
      ? { background: theme.danger, foreground: theme.onAccent, border: theme.danger }
      : { background: theme.surface, foreground: theme.ink, border: theme.border };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: palette.background, borderColor: palette.border, opacity: disabled ? 0.42 : pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <Text style={[type.label, styles.buttonLabel, { color: palette.foreground }]}>{label}</Text>
      <Glyph name={icon} color={palette.foreground} size={20} />
    </Pressable>
  );
}

export function SectionLabel({ children, color }: PropsWithChildren<{ color?: string }>) {
  const theme = useActiveTheme();
  return <Text style={[type.micro, { color: color ?? theme.inkSoft }]}>{children}</Text>;
}

export function Hairline() {
  const theme = useActiveTheme();
  return <View style={[styles.hairline, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm },
  bottomInset: { paddingBottom: 126 },
  headerRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { flex: 1, paddingHorizontal: space.sm, gap: 1 },
  headerRight: { minWidth: 42, alignItems: 'flex-end' },
  primaryButton: { minHeight: 58, borderRadius: radii.small, borderWidth: 1, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buttonLabel: { fontSize: 15, textTransform: 'none', letterSpacing: 0.1 },
  hairline: { height: StyleSheet.hairlineWidth, width: '100%' },
  missingData: { flex: 1, justifyContent: 'center', gap: space.sm, paddingBottom: space.xl },
});
