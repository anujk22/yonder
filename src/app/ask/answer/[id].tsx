import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Glyph } from '@/components/Glyph';
import { ProofFrame } from '@/components/ProofFrame';
import { AppScreen, Entrance, MissingDataState } from '@/components/ui';
import { useAutopilotPressTarget } from '@/lib/autopilot';
import { CONFIDENCE_THRESHOLD } from '@/lib/constants';
import { formatAge, freshness, freshnessColor } from '@/lib/freshness';
import { priceQuery } from '@/lib/pricing';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { font, radii, space, type } from '@/lib/theme';

const BALANCED_HEADLINES: Record<string, string> = {
  'One court is available': 'One court is open.',
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
  const homeRef = useRef<View>(null);
  const answer = answers.find((candidate) => candidate.id === (answerId ?? activeAnswerId));
  const backHome = () => {
    Haptics.selectionAsync();
    router.replace('/ask');
  };
  useAutopilotPressTarget('answer-home', homeRef, backHome);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const query = useMemo(() => {
    if (!answer) return undefined;
    return queries.find((candidate) => candidate.answerId === answer.id && candidate.observerRewardCents > 0)
      ?? queries.find((candidate) => candidate.answerId === answer.id)
      ?? queries.find((candidate) => candidate.id === activeQueryId && candidate.placeId === answer.placeId && candidate.queryType === answer.queryType)
      ?? queries.find((candidate) => candidate.placeId === answer.placeId && candidate.queryType === answer.queryType);
  }, [activeQueryId, answer, queries]);
  const place = places.find((candidate) => candidate.id === answer?.placeId);

  if (!answer) return <MissingDataState title="That answer is not available." />;
  if (!place) return <MissingDataState title="The answer's place is not available." />;

  const currentFreshness = freshness(answer.observedAt, answer.ttlSeconds, now);
  const shortAge = formatAge(currentFreshness.ageSeconds);
  const headline = BALANCED_HEADLINES[answer.headline] ?? answer.headline;
  const charged = answer.charged ?? answer.confidence >= CONFIDENCE_THRESHOLD;
  const bountyCents = query?.bountyCents ?? 150;
  const observerRewardCents = query?.observerRewardCents ?? 120;
  const platformFeeCents = query?.platformFeeCents ?? bountyCents - observerRewardCents;
  const deadlineMinutes = query?.deadlineMinutes ?? 10;
  const freshPrice = priceQuery(answer.placeId, answer.queryType, deadlineMinutes).bountyCents;
  const hasProofFrame = Boolean(answer.proofFrameUri) || answer.placeId === 'pier2';

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

  return (
    <AppScreen style={styles.screen} bottomInset={false}>
      <Entrance style={styles.hero}>
        <View style={styles.statusRow}>
          <View style={styles.verifiedStatus}>
            <View style={[styles.liveDot, { backgroundColor: freshnessColor(currentFreshness.band, theme) }]} />
            <Text style={[type.micro, styles.age, { color: freshnessColor(currentFreshness.band, theme) }]}>VERIFIED {shortAge}</Text>
          </View>
          <View style={[styles.confidenceBadge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[type.mono, styles.confidenceNumber, { color: theme.ink }]}>{Math.round(answer.confidence * 100)}%</Text>
            <Text style={[type.micro, styles.confidenceLabel, { color: theme.inkSoft }]}>CONFIDENCE</Text>
          </View>
        </View>
        <Text style={[type.serifTitle, styles.headline, { color: theme.ink }]} numberOfLines={2}>{headline}</Text>
        {answer.capturedByVendor ? (
          <View style={[styles.vendorChip, { backgroundColor: theme.accentSoft, borderColor: theme.fresh }]}>
            <View style={[styles.vendorDot, { backgroundColor: theme.fresh }]} />
            <Text style={[type.micro, { color: theme.fresh }]}>CAPTURED BY THE MERCHANT</Text>
          </View>
        ) : null}
        <Text style={[type.body, styles.detail, { color: theme.ink }]}>{answer.detail}</Text>
      </Entrance>

      {hasProofFrame ? (
        <Entrance index={1}>
          <ProofFrame uri={answer.proofFrameUri} observedAt={answer.observedAt} />
        </Entrance>
      ) : null}

      <Entrance index={2} style={[styles.verificationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[type.micro, { color: theme.inkSoft }]}>VERIFICATION</Text>
        <View style={styles.verificationRow}>
          <View style={styles.verificationItem}>
            <View style={[styles.checkIcon, { backgroundColor: theme.accentSoft }]}>
              <Glyph name="map" color={theme.fresh} size={17} />
            </View>
            <View style={styles.verificationCopy}>
              <Text style={[type.label, styles.verificationTitle, { color: theme.ink }]}>Location matched</Text>
              <Text style={[type.label, styles.verificationDetail, { color: theme.inkSoft }]} numberOfLines={1}>{place.name}</Text>
            </View>
          </View>
          <View style={[styles.verificationDivider, { backgroundColor: theme.border }]} />
          <View style={styles.verificationItem}>
            <View style={[styles.checkIcon, { backgroundColor: theme.accentSoft }]}>
              <Glyph name="camera" color={theme.fresh} size={17} />
            </View>
            <View style={styles.verificationCopy}>
              <Text style={[type.label, styles.verificationTitle, { color: theme.ink }]}>Live capture</Text>
              <Text style={[type.label, styles.verificationDetail, { color: theme.inkSoft }]}>3 frames verified</Text>
            </View>
          </View>
        </View>
        {!charged ? <Text style={[type.body, styles.notChargedCopy, { color: theme.ink }]}>We couldn't answer this confidently. You haven't been charged.</Text> : null}
      </Entrance>

      {charged ? (
        <Entrance index={3} style={[styles.paymentCard, { borderColor: theme.border }]}>
          <View style={styles.paymentHeading}>
            <Text style={[type.micro, { color: theme.inkSoft }]}>PAYMENT RECEIPT</Text>
            <Text style={[type.mono, styles.paymentTotal, { color: theme.ink }]}>{formatMoney(bountyCents)} paid</Text>
          </View>
          <Text style={[type.label, styles.paymentBreakdown, { color: theme.inkSoft }]}>
            {formatMoney(observerRewardCents)} to observer  ·  {formatMoney(platformFeeCents)} fees
          </Text>
        </Entrance>
      ) : null}

      <Entrance index={4} style={styles.actions}>
        <Pressable
          ref={homeRef}
          testID="answer-home"
          accessibilityRole="button"
          onPress={backHome}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.accent, opacity: pressed ? 0.86 : 1 }]}
        >
          <Text style={[type.label, styles.primaryLabel, { color: theme.onAccent }]}>Ask another question</Text>
          <Glyph name="arrow" color={theme.onAccent} size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            requestFreshAnswer();
          }}
          style={({ pressed }) => [styles.refreshButton, { opacity: pressed ? 0.58 : 1 }]}
        >
          <Text style={[type.label, styles.refreshLabel, { color: theme.inkSoft }]}>Refresh this result for {formatMoney(freshPrice)}</Text>
        </Pressable>
      </Entrance>
    </AppScreen>
  );
}

const formatMoney = (value: number) => `$${(Math.round(value) / 100).toFixed(2)}`;

const styles = StyleSheet.create({
  screen: { paddingTop: space.sm },
  hero: { gap: space.xs, paddingBottom: space.md },
  statusRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  verifiedStatus: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  age: { fontSize: 10, lineHeight: 14, letterSpacing: 0.75 },
  confidenceBadge: { minHeight: 36, borderRadius: radii.pill, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 },
  confidenceNumber: { fontSize: 14, lineHeight: 18 },
  confidenceLabel: { fontSize: 8, lineHeight: 11, letterSpacing: 0.55 },
  headline: { fontSize: 36, lineHeight: 37, letterSpacing: -0.5 },
  vendorChip: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 7 },
  vendorDot: { width: 7, height: 7, borderRadius: 4 },
  detail: { fontFamily: font.ui500, fontSize: 14, lineHeight: 20 },
  verificationCard: { marginTop: space.md, borderRadius: radii.card, borderWidth: 1, padding: space.md, gap: space.sm },
  verificationRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  verificationItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  checkIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  verificationCopy: { flex: 1, minWidth: 0 },
  verificationTitle: { fontFamily: font.ui600, fontSize: 11, lineHeight: 15 },
  verificationDetail: { fontSize: 10, lineHeight: 14 },
  verificationDivider: { width: StyleSheet.hairlineWidth, height: 38 },
  notChargedCopy: { fontSize: 13, lineHeight: 19 },
  paymentCard: { paddingVertical: space.md, marginTop: space.xs, borderBottomWidth: StyleSheet.hairlineWidth, gap: 3 },
  paymentHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
  paymentTotal: { fontSize: 15, lineHeight: 20 },
  paymentBreakdown: { fontSize: 11, lineHeight: 16 },
  actions: { gap: space.xxs, paddingTop: space.md },
  primaryButton: { minHeight: 54, borderRadius: radii.small, paddingHorizontal: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryLabel: { fontFamily: font.ui600, fontSize: 14, lineHeight: 20 },
  refreshButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  refreshLabel: { fontSize: 12, lineHeight: 17 },
});
