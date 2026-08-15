import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ConfidenceRing } from '@/components/ConfidenceRing';
import { ProofFrame } from '@/components/ProofFrame';
import { TickingNumber } from '@/components/TickingNumber';
import { VerificationReceipt } from '@/components/VerificationReceipt';
import { AppScreen, Entrance, ScreenHeader } from '@/components/ui';
import { formatAge, freshness, freshnessColor } from '@/lib/freshness';
import { QueryType } from '@/lib/places';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

const TARGET_RECEIPTS: Record<QueryType, string> = {
  availability: '4 court surfaces, full coverage',
  queue: 'queue and service point, full coverage',
  crowd: 'main public area, full coverage',
  condition: 'requested surface, full coverage',
  stock_check: 'product and shelf label, full coverage',
  accessibility: 'access point, full coverage',
  open_closed: 'public entrance, full coverage',
};

export default function AnswerScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const answerId = Array.isArray(id) ? id[0] : id;
  const theme = useActiveTheme();
  const answers = useYonderStore((state) => state.answers);
  const queries = useYonderStore((state) => state.queries);
  const places = useYonderStore((state) => state.places);
  const activeQueryId = useYonderStore((state) => state.activeQueryId);
  const activeAnswerId = useYonderStore((state) => state.activeAnswerId);
  const [now, setNow] = useState(Date.now());
  const answer = answers.find((candidate) => candidate.id === (answerId ?? activeAnswerId));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const query = useMemo(() => {
    if (!answer) return undefined;
    return queries.find((candidate) => candidate.answerId === answer.id)
      ?? queries.find((candidate) => candidate.id === activeQueryId && candidate.placeId === answer.placeId && candidate.queryType === answer.queryType)
      ?? queries.find((candidate) => candidate.placeId === answer.placeId && candidate.queryType === answer.queryType);
  }, [activeQueryId, answer, queries]);
  const place = places.find((candidate) => candidate.id === answer?.placeId);

  if (!answer || !place) return null;

  const currentFreshness = freshness(answer.observedAt, answer.ttlSeconds, now);
  const age = currentFreshness.ageSeconds < 90
    ? `${currentFreshness.ageSeconds} ${currentFreshness.ageSeconds === 1 ? 'second' : 'seconds'} ago`
    : formatAge(currentFreshness.ageSeconds);
  const bountyCents = query?.bountyCents ?? 125;
  const observerRewardCents = query?.observerRewardCents ?? 100;
  const platformFeeCents = query?.platformFeeCents ?? bountyCents - observerRewardCents;

  return (
    <AppScreen>
      <ScreenHeader eyebrow="VERIFIED OBSERVATION" />

      <Entrance style={styles.hero}>
        {answer.capturedByVendor ? (
          <View style={[styles.vendorChip, { backgroundColor: theme.accentSoft, borderColor: theme.fresh }]}> 
            <View style={[styles.vendorDot, { backgroundColor: theme.fresh }]} />
            <Text style={[type.micro, { color: theme.fresh }]}>CAPTURED BY THE MERCHANT</Text>
          </View>
        ) : null}
        <Text style={[type.monoBig, styles.age, { color: freshnessColor(currentFreshness.band, theme) }]}>Verified {age}</Text>
        <Text style={[type.display, styles.headline, { color: theme.ink }]}>{answer.headline}</Text>
        <Text style={[type.body, styles.detail, { color: theme.inkSoft }]}>{answer.detail}</Text>
      </Entrance>

      <Entrance index={1} style={styles.confidenceSection}>
        <ConfidenceRing value={answer.confidence} />
        <View style={styles.confidenceCopy}>
          <Text style={[type.micro, { color: theme.fresh }]}>SCENE READ COMPLETE</Text>
          <Text style={[type.body, { color: theme.inkSoft }]}>Location and target matched across the live capture.</Text>
        </View>
      </Entrance>

      <ProofFrame uri={answer.proofFrameUri} facesBlurred={answer.facesBlurred} observedAt={answer.observedAt} />

      <Entrance index={3} style={[styles.receipts, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
        <Text style={[type.micro, styles.receiptTitle, { color: theme.inkSoft }]}>VERIFICATION RECEIPTS</Text>
        <VerificationReceipt label="LOCATION VERIFIED" detail={`21m from target, geofence ${place.geofenceM}m`} delay={0} />
        <VerificationReceipt label="LIVE CAPTURE" detail="3 frames, 1.4s, in-app only" delay={120} />
        <VerificationReceipt label="TARGET DETECTED" detail={TARGET_RECEIPTS[answer.queryType]} delay={240} />
      </Entrance>

      <Entrance index={4} style={[styles.honesty, { borderLeftColor: freshnessColor(currentFreshness.band, theme) }]}> 
        <Text style={[type.body, { color: theme.inkSoft }]}>Conditions change. This was true {age}.</Text>
      </Entrance>

      <Animated.View
        entering={FadeInDown.delay(225).springify().damping(18).stiffness(140)}
        style={[styles.payment, { backgroundColor: theme.accent, borderColor: theme.accent }]}
      >
        <Text style={[type.micro, { color: theme.onAccent }]}>PAYMENT SPLIT</Text>
        <View style={styles.paymentRow}>
          <TickingNumber value={bountyCents} color={theme.onAccent} formatter={formatMoney} style={styles.moneyTotal} />
          <Text style={[type.mono, { color: theme.onAccent }]}>→</Text>
          <TickingNumber value={observerRewardCents} color={theme.onAccent} formatter={formatMoney} style={styles.money} />
          <Text style={[type.mono, styles.paymentLabel, { color: theme.onAccent }]}>observer</Text>
          <Text style={[type.mono, { color: theme.onAccent }]}>+</Text>
          <TickingNumber value={platformFeeCents} color={theme.onAccent} formatter={formatMoney} style={styles.money} />
          <Text style={[type.mono, styles.paymentLabel, { color: theme.onAccent }]}>Yonder</Text>
        </View>
      </Animated.View>
    </AppScreen>
  );
}

const formatMoney = (value: number) => `$${(Math.round(value) / 100).toFixed(2)}`;

const styles = StyleSheet.create({
  hero: { gap: space.sm, marginBottom: space.xl },
  vendorChip: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 },
  vendorDot: { width: 7, height: 7, borderRadius: 4 },
  age: { fontSize: 34, lineHeight: 41 },
  headline: { marginTop: space.xs, fontSize: 30, lineHeight: 35 },
  detail: { maxWidth: 336 },
  confidenceSection: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.lg },
  confidenceCopy: { flex: 1, gap: space.xs },
  receipts: { marginTop: space.xl, borderRadius: radii.card, borderWidth: 1, paddingHorizontal: space.md, paddingVertical: space.sm, shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  receiptTitle: { marginTop: space.xs, marginBottom: space.xxs },
  honesty: { marginTop: space.lg, borderLeftWidth: 2, paddingLeft: space.md },
  payment: { marginTop: space.lg, borderRadius: radii.card, borderWidth: 1, padding: space.md, gap: space.sm },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  moneyTotal: { width: 58, fontSize: 13, lineHeight: 20 },
  money: { width: 54, fontSize: 13, lineHeight: 20, textAlign: 'right' },
  paymentLabel: { fontSize: 11, lineHeight: 17 },
});
