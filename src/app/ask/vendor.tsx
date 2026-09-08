import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen, PrimaryButton, ScreenHeader } from '@/components/ui';
import { Scout } from '@/components/Brand';
import { ask, font, type } from '@/lib/theme';
export default function VendorScreen() {
  const router = useRouter();
  return <AppScreen><ScreenHeader eyebrow="FOR THE NEIGHBORHOOD"/><View style={styles.body}><Scout size={80}/><Text style={styles.title}>Your place.{`\n`}A little closer.</Text><Text style={styles.copy}>Help people know what to expect before they walk through your door.</Text><Text style={styles.copy}>Merchant accounts and ownership verification are planned. No store connection is available yet, and we won’t label a merchant as verified without one.</Text><PrimaryButton label="Explore Yonder" onPress={() => router.push('/')}/></View></AppScreen>;
}
const styles = StyleSheet.create({ body: { gap: 24, paddingVertical: 30 }, title: { fontFamily: font.black, fontSize: 48, lineHeight: 50, color: ask.ink, letterSpacing: -2 }, copy: { ...type.body, color: ask.inkSoft } });
