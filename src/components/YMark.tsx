import { useEffect } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  SharedValue,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type YMarkProps = {
  size?: number;
  bodyColor: string;
  headColor?: string;
  headPulse?: boolean;
  transitionProgress?: SharedValue<number>;
  transitionBodyColors?: readonly [string, string];
  transitionHeadColors?: readonly [string, string];
  headPulseHalfDuration?: number;
};

export function YMark({
  size = 100,
  bodyColor,
  headColor = bodyColor,
  headPulse = false,
  transitionProgress,
  transitionBodyColors,
  transitionHeadColors,
  headPulseHalfDuration = 800,
}: YMarkProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (headPulse) {
      pulse.value = withRepeat(
        withTiming(1, { duration: headPulseHalfDuration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 180 });
    }
  }, [headPulse, headPulseHalfDuration, pulse]);

  const headProps = useAnimatedProps(() => ({
    r: 11.5 * (1 + pulse.value * 0.12),
    fill:
      transitionProgress && transitionHeadColors
        ? (interpolateColor(transitionProgress.value, [0, 1], transitionHeadColors) as string)
        : headColor,
  }));

  const armsProps = useAnimatedProps(() => ({
    stroke:
      transitionProgress && transitionBodyColors
        ? (interpolateColor(transitionProgress.value, [0, 1], transitionBodyColors) as string)
        : bodyColor,
  }));

  const stemProps = useAnimatedProps(() => ({
    fill:
      transitionProgress && transitionBodyColors
        ? (interpolateColor(transitionProgress.value, [0, 1], transitionBodyColors) as string)
        : bodyColor,
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityRole="image" accessibilityLabel="Yonder mark">
      <AnimatedPath
        d="M24,22 L50,52 L76,22"
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        animatedProps={armsProps}
      />
      <AnimatedPath d="M43,44 L43,76 L50,90 L57,76 L57,44 Z" animatedProps={stemProps} />
      <AnimatedCircle cx={50} cy={16} animatedProps={headProps} />
    </Svg>
  );
}
