import { forwardRef, useState } from "react";
import { Pressable, PressableProps, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
/** Small tactile feedback. Respects the device's reduced-motion preference. */
export const MotionPressable = forwardRef<
  View,
  PressableProps & { haptic?: boolean }
>(function MotionPressable(
  { style, onPressIn, onPressOut, onPress, haptic = true, ...props },
  ref,
) {
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return (
    <AnimatedPressable
      {...props}
      ref={ref}
      onPressIn={(event) => {
        setPressed(true);
        if (!reduced)
          scale.set(withSpring(0.975, { damping: 22, stiffness: 450 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        scale.set(reduced ? 1 : withSpring(1, { damping: 17, stiffness: 300 }));
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic) void Haptics.selectionAsync().catch(() => {});
        onPress?.(event);
      }}
      style={[
        typeof style === "function" ? style({ pressed, hovered: false }) : style,
        animated,
      ]}
    />
  );
});
