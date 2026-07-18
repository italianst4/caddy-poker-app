import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = { children: ReactNode; style?: StyleProp<ViewStyle> };

/**
 * Wraps its children in a periodic "jiggle" (a quick side-to-side wobble, like the New Round
 * button). Each instance randomizes its start delay and rest interval so multiple jiggling items
 * (e.g. a grid of unopened packs) wobble at different times rather than in unison.
 */
export function Jiggle({ children, style }: Props) {
  const w = useSharedValue(0);
  useEffect(() => {
    const startDelay = 400 + Math.random() * 2600; // when this one first wobbles
    const restDelay = 1800 + Math.random() * 2800; // pause between wobbles (unique per instance)
    w.value = withDelay(
      startDelay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 70 }),
          withTiming(8, { duration: 70 }),
          withTiming(-6, { duration: 70 }),
          withTiming(6, { duration: 70 }),
          withTiming(0, { duration: 70 }),
          withDelay(restDelay, withTiming(0, { duration: 0 }))
        ),
        -1
      )
    );
  }, [w]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${w.value}deg` }] }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}
