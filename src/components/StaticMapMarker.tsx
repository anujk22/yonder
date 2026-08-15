import { useRef } from 'react';
import { Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { YMark } from '@/components/YMark';
import { useAutopilotPressTarget } from '@/lib/autopilot';
import { Mode } from '@/lib/places';
import { brand } from '@/lib/theme';

export function StaticMapMarker({ mode, onPress, style, testID }: { mode: Mode; onPress?: () => void; style: StyleProp<ViewStyle>; testID?: string }) {
  const ref = useRef<View>(null);
  const handlePress = () => onPress?.();
  useAutopilotPressTarget(onPress ? testID : undefined, ref, handlePress);

  if (!onPress) {
    return (
      <View pointerEvents="none" style={style}>
        <YMark size={28} bodyColor={mode === 'ask' ? brand.espresso : brand.oat} />
      </View>
    );
  }

  return (
    <Pressable ref={ref} testID={testID} onPress={handlePress} style={style}>
      <YMark size={28} bodyColor={mode === 'ask' ? brand.espresso : brand.oat} />
    </Pressable>
  );
}
