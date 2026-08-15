import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DeclineSheet } from '@/components/DeclineSheet';
import { Glyph } from '@/components/Glyph';
import { PrimaryButton } from '@/components/ui';
import { YMark } from '@/components/YMark';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const captureInstruction = (placeId?: string, wideShot = false) => {
  if (wideShot) return "Capture the whole area from where you're standing";
  if (placeId === 'pier2') return 'Show the full playing surface of the courts';
  if (placeId === 'nikesoho') return 'Show the exact product and the shelf around it';
  if (placeId === 'unionsq') return 'Show the elevator entrance and service indicators';
  return 'Show the full area needed to answer the query';
};

function Reticle({ color }: { color: string }) {
  const pathProps = { fill: 'none', stroke: color, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 300">
      <Path d="M72 28H28v44" {...pathProps} />
      <Path d="M228 28h44v44" {...pathProps} />
      <Path d="M28 228v44h44" {...pathProps} />
      <Path d="M272 228v44h-44" {...pathProps} />
    </Svg>
  );
}

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const theme = useActiveTheme();
  const query = useYonderStore((state) => state.queries.find((item) => item.id === state.activeTaskId));
  const place = useYonderStore((state) => state.places.find((item) => item.id === query?.placeId));
  const setCapturedFrames = useYonderStore((state) => state.setCapturedFrames);
  const updateQueryState = useYonderStore((state) => state.updateQueryState);
  const wideShot = useYonderStore((state) => state.wideShot);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [targetFound, setTargetFound] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [captureError, setCaptureError] = useState(false);
  const [declineVisible, setDeclineVisible] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const reticleScale = useSharedValue(1.18);
  const captureScale = useSharedValue(1);

  useEffect(() => {
    if (!permission?.granted || !cameraReady) return;
    setTargetFound(false);
    reticleScale.value = 1.18;
    reticleScale.value = withTiming(1, { duration: TIMING.reticleLockMs });
    const timer = setTimeout(() => {
      setTargetFound(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, TIMING.reticleLockMs);
    return () => clearTimeout(timer);
  }, [cameraReady, permission?.granted, reticleScale]);

  const reticleStyle = useAnimatedStyle(() => ({ transform: [{ scale: reticleScale.value }] }));
  const captureStyle = useAnimatedStyle(() => ({ transform: [{ scale: captureScale.value }] }));

  const captureFrames = async () => {
    if (!cameraReady || capturing || !cameraRef.current) return;
    setCapturing(true);
    setCaptureError(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (query) updateQueryState(query.id, 'CAPTURING', 'Capturing live evidence', '3 frames, in-app only');

    try {
      const captured: string[] = [];
      for (let index = 0; index < 3; index += 1) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.78 });
        captured.push(photo.uri);
        setFrames([...captured]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (index < 2) await new Promise((resolve) => setTimeout(resolve, TIMING.frameIntervalMs));
      }
      setCapturedFrames(captured);
      router.replace('/observe/verifying');
    } catch {
      setCaptureError(true);
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.permissionScreen, { backgroundColor: theme.bg }]}>
        <YMark size={72} bodyColor={theme.accent} headPulse />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionScreen, { backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <YMark size={76} bodyColor={theme.accent} />
        <Text style={[type.title, styles.permissionTitle, { color: theme.ink }]}>Live capture needs the camera.</Text>
        <Text style={[type.body, styles.permissionCopy, { color: theme.inkSoft }]}>Yonder only accepts evidence captured here and now. There is no photo upload.</Text>
        <View style={styles.permissionButton}>
          <PrimaryButton label="Allow camera" icon="camera" onPress={requestPermission} />
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.flex, { backgroundColor: theme.bg }]}>
      <CameraView
        ref={cameraRef}
        active={isFocused && !declineVisible}
        animateShutter
        facing="back"
        mode="picture"
        onCameraReady={() => setCameraReady(true)}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.overlay, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.md }]}> 
        <View style={styles.topArea}>
          <View style={[styles.instructionBar, { backgroundColor: theme.scrim, borderColor: theme.border }]}>
            <View style={styles.instructionText}>
              <Text style={[type.micro, { color: theme.accent }]}>LIVE OBSERVATION</Text>
              <Text style={[type.body, styles.instruction, { color: theme.ink }]}>{captureInstruction(place?.id, wideShot)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decline observation"
              disabled={capturing}
              onPress={() => setDeclineVisible(true)}
              style={({ pressed }) => [styles.closeButton, { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Glyph name="close" color={theme.ink} size={19} />
            </Pressable>
          </View>

          {query?.targetHint ? (
            <View style={[styles.hintChip, { backgroundColor: theme.accent }]}>
              <Text style={[type.label, { color: theme.onAccent }]} numberOfLines={2}>{query.targetHint}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.targetArea}>
          <Animated.View style={[styles.reticle, reticleStyle]}>
            <Reticle color={targetFound ? theme.accent : theme.inkSoft} />
          </Animated.View>
          <View style={[styles.targetLabel, { backgroundColor: theme.scrim, borderColor: targetFound ? theme.accent : theme.border }]}>
            <Text style={[type.micro, { color: targetFound ? theme.accent : theme.ink }]}>
              {targetFound ? 'TARGET FOUND' : 'Finding target...'}
            </Text>
          </View>
        </View>

        <View style={styles.captureArea}>
          {capturing ? (
            <Animated.View entering={FadeInDown.springify().damping(18).stiffness(140)} style={[styles.capturingBanner, { backgroundColor: theme.scrim }]}>
              <YMark size={24} bodyColor={theme.accent} headPulse />
              <Text style={[type.mono, styles.capturingText, { color: theme.ink }]}>Capturing 3 frames for liveness</Text>
            </Animated.View>
          ) : null}

          {captureError ? <Text style={[type.label, styles.captureError, { color: theme.danger }]}>Capture interrupted. Try again.</Text> : null}

          {frames.length ? (
            <View style={[styles.filmstrip, { backgroundColor: theme.scrim, borderColor: theme.border }]}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={styles.frameSlot}>
                  {frames[index] ? (
                    <Animated.View entering={FadeInDown.springify().damping(18).stiffness(140)} style={styles.frameImageWrap}>
                      <Image source={{ uri: frames[index] }} style={styles.frameImage} />
                      <Text style={[type.mono, styles.frameLabel, { color: theme.ink }]}>frame {index + 1} / 3</Text>
                    </Animated.View>
                  ) : (
                    <View style={[styles.framePlaceholder, { borderColor: theme.inkFaint }]} />
                  )}
                </View>
              ))}
            </View>
          ) : null}

          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel="Capture three live frames"
            disabled={!cameraReady || capturing}
            onPress={captureFrames}
            onPressIn={() => {
              captureScale.value = withTiming(0.92, { duration: 60 });
            }}
            onPressOut={() => {
              captureScale.value = withSpring(1, { damping: 14, stiffness: 500 });
            }}
            style={[
              styles.captureButton,
              { borderColor: theme.ink, backgroundColor: theme.accent, opacity: cameraReady && !capturing ? 1 : 0.5 },
              captureStyle,
            ]}
          >
            <View style={[styles.captureButtonInner, { borderColor: theme.onAccent }]} />
          </AnimatedPressable>
        </View>
      </View>

      <DeclineSheet visible={declineVisible} onClose={() => setDeclineVisible(false)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  permissionScreen: { flex: 1, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { marginTop: space.lg, textAlign: 'center', maxWidth: 320 },
  permissionCopy: { marginTop: space.sm, textAlign: 'center', maxWidth: 330 },
  permissionButton: { width: '100%', marginTop: space.xl },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'space-between', paddingHorizontal: space.md, pointerEvents: 'box-none' },
  topArea: { gap: space.xs },
  instructionBar: { borderWidth: 1, borderRadius: radii.card, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  instructionText: { flex: 1, gap: 3 },
  instruction: { fontSize: 15, lineHeight: 21 },
  closeButton: { width: 40, height: 40, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hintChip: { alignSelf: 'flex-start', maxWidth: '90%', borderRadius: radii.small, paddingHorizontal: 13, paddingVertical: 9 },
  targetArea: { alignItems: 'center', justifyContent: 'center' },
  reticle: { width: 294, height: 294 },
  targetLabel: { marginTop: -12, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 13, paddingVertical: 7 },
  captureArea: { alignItems: 'center', gap: space.sm },
  capturingBanner: { minHeight: 42, borderRadius: radii.pill, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  capturingText: { fontSize: 12, lineHeight: 17 },
  captureError: { textAlign: 'center' },
  filmstrip: { width: '100%', borderWidth: 1, borderRadius: radii.small, padding: space.xs, flexDirection: 'row', gap: space.xs },
  frameSlot: { flex: 1, aspectRatio: 1.35 },
  frameImageWrap: { flex: 1 },
  frameImage: { flex: 1, borderRadius: 8 },
  frameLabel: { position: 'absolute', bottom: 3, left: 5, fontSize: 9, lineHeight: 12 },
  framePlaceholder: { flex: 1, borderWidth: 1, borderRadius: 8 },
  captureButton: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  captureButtonInner: { width: 64, height: 64, borderRadius: 32, borderWidth: 2 },
});
