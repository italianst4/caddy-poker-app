import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { FESTIVE_COLORS } from './ConfettiBurst';

const DEFAULT_PIECES = 50;

function RainPiece({ width, height }: { width: number; height: number }) {
  // Randomized per-piece parameters, fixed for the piece's lifetime.
  const cfg = useMemo(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    return {
      startX: Math.random() * width,
      drift: rand(-70, 70),
      size: rand(7, 13),
      color: FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)],
      spin: rand(360, 1080) * (Math.random() < 0.5 ? -1 : 1),
      delay: Math.random() * 2000, // stagger so the rain is evenly spread, not a single wave
      duration: rand(2600, 4200),
      square: Math.random() < 0.5,
    };
  }, [width]);

  const progress = useSharedValue(0);

  useEffect(() => {
    // Loop the fall forever so the confetti keeps raining for the whole celebration. Each
    // cycle resets to the top (off-screen) and falls again.
    progress.value = withDelay(
      cfg.delay,
      withRepeat(withTiming(1, { duration: cfg.duration, easing: Easing.linear }), -1, false)
    );
  }, [progress, cfg]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: cfg.startX + cfg.drift * progress.value },
      { translateY: -30 + (height + 80) * progress.value },
      { rotate: `${cfg.spin * progress.value}deg` },
    ],
    opacity: interpolate(progress.value, [0, 0.05, 0.92, 1], [0, 1, 1, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: cfg.size,
          height: cfg.square ? cfg.size : cfg.size * 0.5,
          backgroundColor: cfg.color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

/** A persistent, full-screen confetti rain that falls continuously. Non-interactive. */
export function ConfettiRain({ pieces = DEFAULT_PIECES }: { pieces?: number }) {
  const { width, height } = useWindowDimensions();
  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: pieces }).map((_, i) => (
        <RainPiece key={i} width={width} height={height} />
      ))}
    </Animated.View>
  );
}
