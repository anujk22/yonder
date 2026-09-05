import { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Binoculars, Clock3, Compass, Heart, Map, type LucideIcon } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { MotionPressable } from './MotionPressable';
import { useActiveTheme } from '@/lib/store';
import { font } from '@/lib/theme';

const tabs = [
  { route: '/', label: 'Explore', icon: Compass },
  { route: '/map', label: 'Map', icon: Map },
  { route: '/saved', label: 'Saved', icon: Heart },
  { route: '/observe', label: 'Help out', icon: Binoculars },
  { route: '/activity', label: 'Activity', icon: Clock3 },
] as const;

function TabItem({ label, icon: Icon, active, onPress }: { label: string; icon: LucideIcon; active: boolean; onPress: () => void }) {
  const theme = useActiveTheme();
  const progress = useSharedValue(active ? 1 : 0);
  const reduced = useReducedMotion();
  useEffect(() => { progress.set(reduced ? Number(active) : withSpring(Number(active), { damping: 18, stiffness: 240 })); }, [active, progress, reduced]);
  const highlight = useAnimatedStyle(() => ({ opacity: progress.get(), transform: [{ scale: .8 + .2 * progress.get() }] }));
  return <MotionPressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={onPress} style={styles.tab}>
    <View style={styles.icon}><Animated.View style={[styles.highlight, { backgroundColor: theme.accentSoft }, highlight]}/><View style={{ zIndex: 1 }}><Icon size={22} strokeWidth={active ? 2.1 : 1.7} color={active ? theme.ink : theme.inkSoft}/></View></View>
    <Text style={[styles.label, { color: active ? theme.ink : theme.inkSoft, fontFamily: active ? font.ui700 : font.ui500 }]}>{label}</Text>
  </MotionPressable>;
}

export function BottomNavigation() {
  const pathname = usePathname(); const router = useRouter(); const insets = useSafeAreaInsets(); const theme = useActiveTheme();
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboard) return null;
  const current = pathname.startsWith('/observe') ? '/observe' : pathname.startsWith('/ask') ? '/' : pathname;
  return <View accessibilityRole="tablist" style={[styles.bar, { backgroundColor: theme.bg, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 10) }]}>{tabs.map(tab => <TabItem key={tab.route} {...tab} active={current === tab.route} onPress={() => { if (current !== tab.route) router.navigate(tab.route); }}/>)}</View>;
}
const styles = StyleSheet.create({ bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 7, paddingHorizontal: 6 }, tab: { flex: 1, minHeight: 55, alignItems: 'center', justifyContent: 'center', gap: 4 }, icon: { width: 48, height: 30, alignItems: 'center', justifyContent: 'center' }, highlight: { position: 'absolute', inset: 0, borderRadius: 14 }, label: { fontSize: 10, lineHeight: 15, letterSpacing: .1 } });
