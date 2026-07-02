import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type CloudProps = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  top: number;
  duration: number;
  phase: number;
  direction: 'ltr' | 'rtl';
  opacity?: number;
};

function Cloud({ source, width, height, top, duration, phase, direction, opacity = 0.9 }: CloudProps) {
  const { width: screenW } = useWindowDimensions();
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [x, duration]);

  const style = useAnimatedStyle(() => {
    const p = (x.value + phase) % 1; // staggered, continuous 0→1
    const span = screenW + width;
    // ltr: drifts left→right; rtl: drifts right→left.
    const translateX = direction === 'rtl' ? screenW - p * span : -width + p * span;
    return { transform: [{ translateX }] };
  });

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[{ position: 'absolute', top, width, height, opacity }, style]}
    />
  );
}

type CloudLayerProps = {
  /** Extra vertical offset (px) applied to both clouds, e.g. to drop them below content. */
  offset?: number;
};

/** Two clouds drifting slowly in opposite directions across the background. */
export function CloudLayer({ offset = 0 }: CloudLayerProps) {
  const { height } = useWindowDimensions();
  const shift = height * 0.15 + offset; // shifted down 15% of the screen height (+ offset)

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Cloud
        source={require('../../assets/cloud-1.png')}
        width={150}
        height={150 / 2.093}
        top={90 + shift}
        duration={34000}
        phase={0}
        direction="ltr"
        opacity={0.92}
      />
      <Cloud
        source={require('../../assets/cloud-2.png')}
        width={110}
        height={110 / 1.693}
        top={190 + shift}
        duration={46000}
        phase={0.5}
        direction="rtl"
        opacity={0.85}
      />
    </View>
  );
}
