import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PIER_TWO_PROOF, PIER_TWO_PROOF_ASPECT_RATIO } from '@/lib/proofMedia';
import { useActiveTheme } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

type ProofFrameProps = {
  uri: string | null;
  observedAt: number;
};

export function ProofFrame({ uri, observedAt }: ProofFrameProps) {
  const theme = useActiveTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = Math.max(0, TIMING.rawDeleteSeconds - Math.floor((now - observedAt) / 1000));

  return (
    <Animated.View entering={FadeIn.duration(260)} style={[styles.frame, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      <Image
        source={uri ? { uri } : PIER_TWO_PROOF}
        resizeMode="cover"
        style={styles.image}
        accessibilityLabel="Live wide-angle proof image"
      />

      <View style={[styles.caption, { backgroundColor: theme.scrim }]}>
        <View style={styles.captionStatus}>
          <View style={[styles.privacyDot, { backgroundColor: theme.fresh }]} />
          <Text style={[type.micro, styles.captionLabel, { color: theme.onAccent }]}>PRIVACY PROTECTED</Text>
        </View>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.86}
          numberOfLines={1}
          style={[type.label, styles.captionText, { color: theme.onAccent }]}
        >
          {secondsLeft > 0 ? `Wide shot · source deletes in ${secondsLeft}s` : 'Wide shot · source deleted'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: PIER_TWO_PROOF_ASPECT_RATIO, overflow: 'hidden', borderRadius: radii.card, borderWidth: 1 },
  image: { width: '100%', height: '100%' },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 46, paddingHorizontal: space.md, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  captionStatus: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 0 },
  privacyDot: { width: 6, height: 6, borderRadius: 3 },
  captionLabel: { fontSize: 9, lineHeight: 12, letterSpacing: 0.65 },
  captionText: { flex: 1, textAlign: 'right', fontSize: 10, lineHeight: 14 },
});
