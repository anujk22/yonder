import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { brand, font, type } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Info } from 'lucide-react-native';
import { MotionPressable } from './MotionPressable';

export function Scout({ size = 44, color = brand.espresso, background = brand.oat }: { size?: number; color?: string; background?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Yonder scout" accessibilityRole="image">
    <Path d="M32 1 38 9 48 5 50 16 61 19 56 29 63 37 53 43 53 55 41 54 34 63 26 55 15 59 12 48 2 44 7 33 1 24 12 18 13 7 25 10Z" fill={background}/>
    <Path d="M16 25c0-6 12-6 12 0v13c0 6-12 6-12 0ZM35 25c0-6 12-6 12 0v13c0 6-12 6-12 0Z" fill={color}/>
    <Circle cx={23} cy={27} r={2.7} fill={background}/><Circle cx={42} cy={27} r={2.7} fill={background}/>
  </Svg>;
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useActiveTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const insets = useSafeAreaInsets();
  const go = (route: '/' | '/observe' | '/activity' | '/about') => {
    useYonderStore.getState().swapMode(route === '/observe' ? 'observe' : 'ask');
    router.push(route);
  };
  if (!wide) return <View style={{ paddingTop: insets.top, backgroundColor: theme.bg }}><View style={styles.mobileBar}>
    <MotionPressable accessibilityRole="button" accessibilityLabel="Yonder home" onPress={() => router.navigate('/')} style={styles.wordmark}><Scout size={31}/><Text style={[styles.mobileLogo, { color: theme.ink }]}>yonder.</Text></MotionPressable>
    <MotionPressable accessibilityRole="button" accessibilityLabel="About this preview" onPress={() => router.push('/about')} style={[styles.previewPill, { borderColor: theme.border }]}><View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.fresh }}/><Text style={[styles.previewText, { color: theme.inkSoft }]}>Preview</Text><Info size={15} color={theme.inkSoft}/></MotionPressable>
  </View></View>;
  return <View style={[styles.header, { backgroundColor: theme.bg, borderColor: theme.border, paddingTop: insets.top }]}>
    <View style={[styles.headerInner, !wide && { paddingHorizontal: 20 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Yonder home" onPress={() => go('/')} style={styles.wordmark}>
        <Scout size={34}/><Text style={[styles.logo, { color: theme.ink }]}>yonder<Text style={{ color: theme.fresh }}>.</Text></Text>
      </Pressable>
      {wide && <View style={styles.nav}>
        {([['/', 'Explore'], ['/activity', 'Your activity'], ['/about', 'How it works']] as const).map(([route, label]) => <Pressable key={route} accessibilityRole="button" accessibilityState={{ selected: pathname === route }} onPress={() => go(route)} style={[styles.navItem, pathname === route && { borderBottomColor: theme.ink }]}><Text style={[type.label, { color: theme.ink, fontSize: 13 }]}>{label}</Text></Pressable>)}
      </View>}
      <Pressable accessibilityRole="button" onPress={() => go(pathname.startsWith('/observe') ? '/' : '/observe')} style={[styles.earn, { borderColor: theme.border }]}>
        <Text style={[type.label, { color: theme.ink }]}>{pathname.startsWith('/observe') ? 'Explore places ↗' : wide ? 'Be someone’s eyes ↗' : 'Help & earn ↗'}</Text>
      </Pressable>
    </View>
    <View style={[styles.demo, { backgroundColor: theme.surfaceAlt }]}><Text style={[styles.demoText, { color: theme.inkSoft }]}>NYC PREVIEW · Sample observations & demo credits · No real payments</Text></View>
    {!wide && <View style={styles.mobileNav}>{([['/', 'Explore'], ['/activity', 'Activity'], ['/about', 'How it works']] as const).map(([route, label]) => <Pressable key={route} accessibilityRole="button" onPress={() => go(route)} style={{ padding: 12 }}><Text style={[type.label, { color: theme.ink, textDecorationLine: pathname === route ? 'underline' : 'none' }]}>{label}</Text></Pressable>)}</View>}
  </View>;
}

const styles = StyleSheet.create({
  mobileBar: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 }, mobileLogo: { fontFamily: font.black, fontSize: 29, lineHeight: 36, letterSpacing: -1.2 }, previewPill: { minHeight: 38, flexDirection: 'row', gap: 7, alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: 22 }, previewText: { fontFamily: font.ui600, fontSize: 10, letterSpacing: .2 },
  header: { borderBottomWidth: 1 }, headerInner: { minHeight: 86, width: '100%', maxWidth: 1280, alignSelf: 'center', paddingHorizontal: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 }, logo: { fontFamily: font.black, fontSize: 32, letterSpacing: -1.7 },
  nav: { flexDirection: 'row', gap: 28 }, navItem: { paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  earn: { borderWidth: 1, borderRadius: 99, paddingVertical: 12, paddingHorizontal: 18 },
  demo: { alignItems: 'center', paddingVertical: 7, paddingHorizontal: 12 }, demoText: { fontFamily: font.mono400, fontSize: 9, lineHeight: 14, letterSpacing: 0.6, textAlign: 'center' }, mobileNav: { flexDirection: 'row', justifyContent: 'center', gap: 18 },
});
