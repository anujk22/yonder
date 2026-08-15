import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppScreen, Entrance, PrimaryButton, ScreenHeader } from '@/components/ui';
import { useActiveTheme } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

const BENEFITS = [
  'allow indoor observations again',
  'post standing bounties on their own stores',
  'see what people are asking about them',
] as const;

export default function VendorVerificationScreen() {
  const router = useRouter();
  const theme = useActiveTheme();

  return (
    <AppScreen>
      <ScreenHeader eyebrow="MERCHANT VERIFICATION" />
      <Entrance>
        <Text style={[type.serifDisplay, styles.title, { color: theme.ink }]}>Verify your store</Text>
        <Text style={[type.body, styles.body, { color: theme.inkSoft }]}>Merchants connect their Shopify account to prove they own a location.</Text>
      </Entrance>

      <Entrance index={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[type.heading, { color: theme.ink }]}>Verified stores can:</Text>
        <View style={styles.list}>
          {BENEFITS.map((benefit) => (
            <Text key={benefit} style={[type.body, { color: theme.ink }]}>· {benefit}</Text>
          ))}
        </View>
      </Entrance>

      <Entrance index={2} style={styles.actions}>
        <PrimaryButton label="Connect Shopify store" onPress={() => undefined} />
        <PrimaryButton testID="vendor-home" label="Back to Ask home" onPress={() => router.replace('/ask')} variant="secondary" />
      </Entrance>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 48, lineHeight: 49 },
  body: { marginTop: space.md, maxWidth: 340 },
  card: { marginTop: space.xl, borderWidth: 1, borderRadius: radii.card, padding: space.lg },
  list: { marginTop: space.md, gap: space.sm },
  actions: { marginTop: space.xl, gap: space.sm },
});
