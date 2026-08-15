import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import Animated, { Easing, FadeIn, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { DeclineSheet } from '@/components/DeclineSheet';
import { Glyph } from '@/components/Glyph';
import { AppScreen, Entrance, MissingDataState, PrimaryButton, ScreenHeader, SectionLabel } from '@/components/ui';
import { TickingNumber } from '@/components/TickingNumber';
import { registerAutopilotAbortHandler } from '@/lib/autopilot';
import { useActiveTheme, useYonderStore } from '@/lib/store';
import { radii, space, type } from '@/lib/theme';
import { TIMING } from '@/lib/timing';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RADIUS = 75;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ApproachScreen() {
  const router = useRouter();
  const theme = useActiveTheme();
  const query = useYonderStore((state) => state.queries.find((item) => item.id === state.activeTaskId));
  const place = useYonderStore((state) => state.places.find((item) => item.id === query?.placeId));
  const updateQueryState = useYonderStore((state) => state.updateQueryState);
  const progress = useSharedValue(0);
  const [verified, setVerified] = useState(false);
  const [declineVisible, setDeclineVisible] = useState(false);

  useEffect(() => {
    if (!query) return;
    updateQueryState(query.id, 'APPROACHING', 'Observer approaching', '64m from target');
    progress.value = withTiming(1, { duration: TIMING.approachMs, easing: Easing.inOut(Easing.cubic) });
    const timer = setTimeout(() => {
      setVerified(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateQueryState(query.id, 'APPROACHING', 'Location verified', `21m from target, geofence ${place?.geofenceM ?? 75}m`);
    }, TIMING.approachMs);
    const unregisterAbort = registerAutopilotAbortHandler(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      unregisterAbort();
    };
  }, [place?.geofenceM, progress, query?.id, updateQueryState]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - (0.16 + progress.value * 0.84)),
  }));

  if (!query) return <MissingDataState title="No observation is ready to approach." />;
  if (!place) return <MissingDataState title="The observation's place is not available." />;

  return (
    <Animated.View
      entering={FadeIn.duration(240).withInitialValues({ opacity: 0, transform: [{ scale: 0.98 }] } as never)}
      style={styles.flex}
    >
      <AppScreen scroll={false}>
        <ScreenHeader eyebrow="APPROACH" title={place.name} />

        <View style={styles.center}>
          <Entrance style={styles.ringWrap}>
            <Svg width={188} height={188} viewBox="0 0 188 188">
              <Circle cx={94} cy={94} r={RADIUS} fill="none" stroke={theme.border} strokeWidth={8} />
              <AnimatedCircle
                cx={94}
                cy={94}
                r={RADIUS}
                fill="none"
                stroke={verified ? theme.fresh : theme.accent}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                transform="rotate(-90 94 94)"
                animatedProps={ringProps}
              />
            </Svg>
            <View style={styles.distanceWrap}>
              <TickingNumber
                initialValue={64}
                value={21}
                duration={TIMING.approachMs}
                color={verified ? theme.fresh : theme.ink}
                formatter={(value) => `${Math.round(value)}m`}
                style={styles.distance}
              />
              <Text style={[type.mono, styles.geofence, { color: theme.inkSoft }]}>Geofence {place.geofenceM}m</Text>
            </View>
          </Entrance>

          <Entrance index={1} style={styles.statusBlock}>
            <View style={[styles.statusIcon, { backgroundColor: verified ? theme.fresh : theme.surfaceAlt }]}>
              <Glyph name={verified ? 'check' : 'lock'} color={verified ? theme.onAccent : theme.inkSoft} size={22} />
            </View>
            <SectionLabel color={verified ? theme.fresh : theme.inkSoft}>{verified ? 'LOCATION VERIFIED' : 'CAMERA LOCKED'}</SectionLabel>
            <Text style={[type.body, styles.statusCopy, { color: theme.inkSoft }]}>
              {verified ? 'You are 21m from the target. Live capture is unlocked.' : 'Move inside the geofence to prove where this observation was made.'}
            </Text>
          </Entrance>
        </View>

        <Entrance index={2} style={styles.actions}>
          <PrimaryButton
            testID="approach-capture"
            label={verified ? 'Open camera' : 'Move within geofence'}
            icon={verified ? 'camera' : 'lock'}
            disabled={!verified}
            onPress={() => router.push('/observe/capture')}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeclineVisible(true)}
            style={({ pressed }) => [styles.declineButton, { borderColor: theme.border, opacity: pressed ? 0.72 : 1 }]}
          >
            <Text style={[type.label, { color: theme.inkSoft }]}>Decline</Text>
          </Pressable>
        </Entrance>
      </AppScreen>
      <DeclineSheet visible={declineVisible} onClose={() => setDeclineVisible(false)} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space.md },
  ringWrap: { width: 188, height: 188, alignItems: 'center', justifyContent: 'center' },
  distanceWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  distance: { width: 128, textAlign: 'center', fontSize: 42, lineHeight: 48 },
  geofence: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  statusBlock: { marginTop: space.xl, alignItems: 'center', maxWidth: 320 },
  statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  statusCopy: { marginTop: space.xs, textAlign: 'center' },
  actions: { gap: space.sm, paddingBottom: space.sm },
  declineButton: { minHeight: 48, borderWidth: 1, borderRadius: radii.small, alignItems: 'center', justifyContent: 'center' },
});
