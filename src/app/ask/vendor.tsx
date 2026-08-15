import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AppScreen, Entrance, PrimaryButton, ScreenHeader } from '@/components/ui';
import { MerchantStoreLocation, shopify } from '@/lib/shopify';
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
  const [connecting, setConnecting] = useState(false);
  const [verifiedLocations, setVerifiedLocations] = useState<MerchantStoreLocation[] | null>(null);

  const handleConnectShopify = async () => {
    setConnecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const locations = await shopify.verifyMerchantLocations();
      setVerifiedLocations(locations);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Handled gracefully
    } finally {
      setConnecting(false);
    }
  };

  return (
    <AppScreen>
      <ScreenHeader eyebrow="MERCHANT VERIFICATION" />
      <Entrance>
        <Text style={[type.serifDisplay, styles.title, { color: theme.ink }]}>Verify your store</Text>
        <Text style={[type.body, styles.body, { color: theme.inkSoft }]}>Merchants connect their Shopify account to prove they own a location.</Text>
      </Entrance>

      <Entrance index={1} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {verifiedLocations ? (
          <View style={styles.verifiedWrap}>
            <Text style={[type.heading, { color: theme.fresh }]}>✓ Connected via Shopify Admin API</Text>
            <Text style={[type.label, { color: theme.inkSoft, marginTop: 4 }]}>Verified Physical Retail Locations:</Text>
            <View style={styles.locationList}>
              {verifiedLocations.map((loc) => (
                <View key={loc.id} style={[styles.locationCard, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
                  <Text style={[type.label, { color: theme.ink, fontWeight: '600' }]}>{loc.name}</Text>
                  <Text style={[type.micro, { color: theme.inkSoft }]}>{loc.address1}, {loc.city} {loc.zip}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            <Text style={[type.heading, { color: theme.ink }]}>Verified stores can:</Text>
            <View style={styles.list}>
              {BENEFITS.map((benefit) => (
                <Text key={benefit} style={[type.body, { color: theme.ink }]}>· {benefit}</Text>
              ))}
            </View>
          </>
        )}
      </Entrance>

      <Entrance index={2} style={styles.actions}>
        {!verifiedLocations ? (
          <PrimaryButton
            label={connecting ? 'Connecting to Shopify API...' : 'Connect Shopify store'}
            onPress={handleConnectShopify}
            disabled={connecting}
          />
        ) : null}
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
  verifiedWrap: { gap: space.xs },
  locationList: { marginTop: space.sm, gap: space.xs },
  locationCard: { borderWidth: 1, borderRadius: radii.small, padding: space.sm, gap: 2 },
  actions: { marginTop: space.xl, gap: space.sm },
});
