import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

type ProofFrameProps = {
  uri: string | null;
  facesBlurred: number;
  observedAt: number;
};

const FACE_REGIONS = [
  { left: '12%', top: '24%', width: 52, height: 66, rotate: '-4deg' },
  { right: '17%', top: '18%', width: 48, height: 61, rotate: '5deg' },
  { left: '48%', top: '38%', width: 43, height: 54, rotate: '2deg' },
] as const;

export function ProofFrame({ uri, facesBlurred, observedAt }: ProofFrameProps) {
  const theme = useActiveTheme();
  const mode = useYonderStore((state) => state.mode);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = Math.max(0, TIMING.rawDeleteSeconds - Math.floor((now - observedAt) / 1000));
  const visibleRegions = useMemo(() => FACE_REGIONS.slice(0, facesBlurred <= 2 ? 2 : 3), [facesBlurred]);

  return (
    <Animated.View entering={FadeInDown.delay(90).springify().damping(18).stiffness(140)}>
      <View style={[styles.frame, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        {uri ? (
          <Image source={{ uri }} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityLabel="Captured proof frame" />
        ) : (
          <LinearGradient colors={[theme.surfaceAlt, theme.border]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
            <View style={[styles.placeholderHorizon, { backgroundColor: theme.bg }]} />
            <View style={[styles.placeholderTarget, { borderColor: theme.inkFaint }]} />
            <Text style={[type.micro, styles.placeholderLabel, { color: theme.inkSoft }]}>VERIFIED PROOF FRAME</Text>
          </LinearGradient>
        )}
        {visibleRegions.map((region, index) => (
          <View
            key={index}
            style={[
              styles.faceCrop,
              {
                left: 'left' in region ? region.left : undefined,
                right: 'right' in region ? region.right : undefined,
                top: region.top,
                width: region.width,
                height: region.height,
                transform: [{ rotate: region.rotate }],
              },
            ]}
          >
            <BlurView intensity={72} tint={mode === 'ask' ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glass }]} />
          </View>
        ))}
        <View style={[styles.liveBadge, { backgroundColor: theme.scrim }]}> 
          <View style={[styles.liveDot, { backgroundColor: theme.fresh }]} />
          <Text style={[type.micro, { color: theme.onAccent }]}>LIVE CAPTURE</Text>
        </View>
      </View>
      <Text style={[type.mono, styles.caption, { color: theme.inkSoft }]}>
        {facesBlurred} {facesBlurred === 1 ? 'face' : 'faces'} blurred · {secondsLeft > 0 ? `raw footage deleted in ${secondsLeft}s` : 'raw footage deleted'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { aspectRatio: 4 / 3, overflow: 'hidden', borderRadius: radii.card, borderWidth: 1 },
  faceCrop: { position: 'absolute', overflow: 'hidden', borderRadius: radii.small },
  liveBadge: { position: 'absolute', top: space.sm, left: space.sm, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  caption: { marginTop: space.xs, fontSize: 11, lineHeight: 16 },
  placeholderHorizon: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '36%', opacity: 0.7 },
  placeholderTarget: { position: 'absolute', left: '18%', right: '18%', top: '27%', bottom: '20%', borderWidth: 2, borderRadius: radii.small, opacity: 0.58 },
  placeholderLabel: { position: 'absolute', alignSelf: 'center', bottom: space.md },
});
