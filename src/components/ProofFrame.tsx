import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

type ProofFrameProps = {
  uri: string | null;
  facesBlurred: number;
  observedAt: number;
};

const FACE_REGIONS = [
  { left: '41%', top: '35%', width: 20, height: 28, rotate: '-3deg' },
  { left: '61.8%', top: '38%', width: 20, height: 28, rotate: '4deg' },
  { left: '18.2%', top: '54.5%', width: 22, height: 30, rotate: '-5deg' },
] as const;

const pierTwoProof = require('../../assets/proof/pier-two-live.png');

export function ProofFrame({ uri, facesBlurred, observedAt }: ProofFrameProps) {
  const theme = useActiveTheme();
  const mode = useYonderStore((state) => state.mode);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = Math.max(0, TIMING.rawDeleteSeconds - Math.floor((now - observedAt) / 1000));
  const visibleRegions = useMemo(() => FACE_REGIONS.slice(0, Math.min(facesBlurred, 2)), [facesBlurred]);

  return (
    <Animated.View entering={FadeIn.duration(260)} style={[styles.frame, { backgroundColor: theme.surfaceAlt }]}>
      <Image source={uri ? { uri } : pierTwoProof} resizeMode="cover" style={styles.image} accessibilityLabel="Captured proof frame" />

      {visibleRegions.map((region, index) => (
        <View
          key={index}
          style={[
            styles.face,
            {
              left: region.left,
              top: region.top,
              width: region.width,
              height: region.height,
              transform: [{ rotate: region.rotate }],
            },
          ]}
        >
          <BlurView intensity={82} tint={mode === 'ask' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
        </View>
      ))}

      <View style={styles.caption}>
        <View style={[StyleSheet.absoluteFill, styles.captionScrim, { backgroundColor: theme.accent }]} />
        <Text style={[type.mono, styles.captionText, { color: theme.onAccent }]}>
          {visibleRegions.length} {visibleRegions.length === 1 ? 'face' : 'faces'} blurred · {secondsLeft > 0 ? `raw footage deleted in ${secondsLeft}s` : 'raw footage deleted'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 10, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  face: { position: 'absolute', overflow: 'hidden', borderRadius: radii.pill },
  caption: { position: 'absolute', left: space.sm, bottom: space.sm, overflow: 'hidden', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '92%' },
  captionScrim: { opacity: 0.55 },
  captionText: { fontSize: 9.5, lineHeight: 13 },
});
