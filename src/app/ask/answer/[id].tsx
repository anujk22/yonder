import { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ConfidenceRing } from '@/components/ConfidenceRing';
import { ProofFrame } from '@/components/ProofFrame';
import { TickingNumber } from '@/components/TickingNumber';
import { VerificationReceipt } from '@/components/VerificationReceipt';
import { AppScreen, Entrance, MissingDataState } from '@/components/ui';
import { formatAge, freshness, freshnessColor } from '@/lib/freshness';
import { QueryType } from '@/lib/places';
import { priceQuery } from '@/lib/pricing';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';

const TARGET_RECEIPTS: Record<QueryType, string> = {
  availability: 'requested area · full coverage',
  queue: 'queue and service point · full coverage',
  crowd: 'main public area · full coverage',
  condition: 'requested surface · full coverage',
  stock_check: 'product and shelf label · full coverage',
  accessibility: 'access point · full coverage',
  open_closed: 'public entrance · full coverage',
};

const BALANCED_HEADLINES: Record<string, string> = {
  'One court is available': 'Yes. One court is\navailable.',
  'About a 12 minute wait': 'About a 12\nminute wait',
  'About a 15 minute wait': 'About a 15\nminute wait',
  '12 open tables': '12 open tables',
  'The north elevator is working': 'The north elevator\nis working',
  'Yes, 2 pairs on the shelf': 'Yes, 2 pairs are\non the shelf',
  'About a 7 minute wait': 'About a 7\nminute wait',
};

export default function AnswerScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();
  const answerId = Array.isArray(id) ? id[0] : id;
  const theme = useActiveTheme();
  const answers = useYonderStore((state) => state.answers);
  const queries = useYonderStore((state) => state.queries);
  const places = useYonderStore((state) => state.places);
  const activeQueryId = useYonderStore((state) => state.activeQueryId);
  const activeAnswerId = useYonderStore((state) => state.activeAnswerId);
  const setDraftQuestion = useYonderStore((state) => state.setDraftQuestion);
  const setResolvedPlace = useYonderStore((state) => state.setResolvedPlace);
  const setDeadline = useYonderStore((state) => state.setDeadline);
  const setTargetHint = useYonderStore((state) => state.setTargetHint);
  const createDraftQuery = useYonderStore((state) => state.createDraftQuery);
  const postActiveQuery = useYonderStore((state) => state.postActiveQuery);
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

  if (!answer) return <MissingDataState title="That answer is not available." />;
  if (!place) return <MissingDataState title="The answer's place is not available." />;

  const currentFreshness = freshness(answer.observedAt, answer.ttlSeconds, now);
  const shortAge = formatAge(currentFreshness.ageSeconds);
  const honestAge = currentFreshness.ageSeconds < 90
    ? `${currentFreshness.ageSeconds} ${currentFreshness.ageSeconds === 1 ? 'second' : 'seconds'} ago`
    : shortAge;
  const headline = BALANCED_HEADLINES[answer.headline] ?? answer.headline;
  const confidenceBand = answer.confidence > 0.95 ? 'Very high' : answer.confidence > 0.85 ? 'High' : 'Moderate';
  const bountyCents = query?.bountyCents ?? 125;
  const observerRewardCents = query?.observerRewardCents ?? 100;
  const platformFeeCents = query?.platformFeeCents ?? bountyCents - observerRewardCents;
  const deadlineMinutes = query?.deadlineMinutes ?? 10;
  const freshPrice = priceQuery(answer.placeId, answer.queryType, deadlineMinutes).bountyCents;
  const targetReceipt = answer.placeId === 'pier2' && answer.queryType === 'availability'
    ? '4 court surfaces · full coverage'
    : TARGET_RECEIPTS[answer.queryType];

  const requestFreshAnswer = () => {
    setDraftQuestion(answer.question);
    setResolvedPlace(answer.placeId);
    setDeadline(deadlineMinutes);
    setTargetHint('');
    const queryId = createDraftQuery();
    if (!queryId) return;
    postActiveQuery();
    router.push('/ask/status');
  };

  const shareResult = async () => {
    await Haptics.selectionAsync();
    await Share.share({ message: `${answer.headline}\n${answer.detail}\nVerified ${shortAge} with Yonder.` });
  };

  return (
    <AppScreen style={styles.screen}>
      <Entrance style={styles.hero}>
        <Text style={[type.monoBig, styles.age, { color: freshnessColor(currentFreshness.band, theme) }]}>Verified {shortAge}</Text>
        <Text style={[type.serifDisplay, styles.headline, { color: theme.ink }]} numberOfLines={2}>{headline}</Text>
        {answer.capturedByVendor ? (
          <View style={[styles.vendorChip, { backgroundColor: theme.accentSoft, borderColor: theme.fresh }]}>
            <View style={[styles.vendorDot, { backgroundColor: theme.fresh }]} />
            <Text style={[type.micro, { color: theme.fresh }]}>CAPTURED BY THE MERCHANT</Text>
          </View>
        ) : null}
        <Text style={[type.body, styles.detail, { color: theme.inkSoft }]}>{answer.detail}</Text>
        <Text style={[type.body, styles.honesty, { color: theme.inkFaint }]}>Conditions change. This was true {honestAge}.</Text>
      </Entrance>

      <View style={styles.fullBleed}>
        <ProofFrame uri={answer.proofFrameUri} facesBlurred={answer.facesBlurred} observedAt={answer.observedAt} />
      </View>

      <Entrance index={2} style={styles.confidenceSection}>
        <ConfidenceRing value={answer.confidence} />
        <View style={styles.confidenceCopy}>
          <Text style={[type.micro, { color: theme.inkSoft }]}>CONFIDENCE</Text>
          <Text style={[type.serifHeading, { color: theme.ink }]}>{confidenceBand}</Text>
        </View>
      </Entrance>

      <Entrance index={3} style={styles.receipts}>
        <VerificationReceipt label="LOCATION VERIFIED" detail={`21m from target · ${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`} delay={0} />
        <View style={[styles.hairline, { backgroundColor: theme.border }]} />
        <VerificationReceipt label="LIVE CAPTURE" detail="3 frames · 1.4s · in-app only" delay={120} />
        <View style={[styles.hairline, { backgroundColor: theme.border }]} />
        <VerificationReceipt label="TARGET DETECTED" detail={targetReceipt} delay={240} />
      </Entrance>

      <Animated.View
        entering={FadeInDown.delay(180).springify().damping(18).stiffness(140)}
        style={[styles.paymentBand, { backgroundColor: theme.accent }]}
      >
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

      <Entrance index={5} style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            requestFreshAnswer();
          }}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.accent, opacity: pressed ? 0.86 : 1 }]}
        >
          <Text style={[type.mono, styles.primaryLabel, { color: theme.onAccent }]}>Get a fresh answer {formatMoney(freshPrice)}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={shareResult} style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.58 : 1 }]}>
          <Text style={[type.label, { color: theme.inkSoft }]}>Share result</Text>
        </Pressable>
      </Entrance>
    </AppScreen>
  );
}

const formatMoney = (value: number) => `$${(Math.round(value) / 100).toFixed(2)}`;

const styles = StyleSheet.create({
  screen: { paddingTop: space.xl },
  hero: { gap: space.sm, paddingBottom: space.xl },
  age: { fontSize: 30, lineHeight: 36 },
  headline: { fontSize: 38, lineHeight: 40 },
  vendorChip: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 },
  vendorDot: { width: 7, height: 7, borderRadius: 4 },
  detail: { marginTop: space.xs },
  honesty: { fontSize: 14, lineHeight: 21 },
  fullBleed: { marginHorizontal: -space.lg },
  confidenceSection: { minHeight: 178, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xl },
  confidenceCopy: { minWidth: 104, gap: space.xxs },
  receipts: { paddingBottom: space.sm },
  hairline: { height: StyleSheet.hairlineWidth, width: '100%' },
  paymentBand: { marginHorizontal: -space.lg, marginTop: space.lg, paddingHorizontal: space.lg, paddingVertical: 22 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  moneyTotal: { width: 58, fontSize: 13, lineHeight: 20 },
  money: { width: 54, fontSize: 13, lineHeight: 20, textAlign: 'right' },
  paymentLabel: { fontSize: 10, lineHeight: 16 },
  actions: { gap: space.sm, paddingTop: space.xl },
  primaryButton: { minHeight: 60, borderRadius: radii.small, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
  primaryLabel: { fontSize: 14, lineHeight: 20 },
  shareButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
