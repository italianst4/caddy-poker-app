import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

const GLYPH = '✦';

/** Position on a rectangle's perimeter for phase t ∈ [0,1). */
function rectPos(t: number, w: number, h: number) {
  'worklet';
  const perimeter = 2 * (w + h);
  let d = (((t % 1) + 1) % 1) * perimeter;
  if (d < w) return { x: d, y: 0 };
  d -= w;
  if (d < h) return { x: w, y: d };
  d -= h;
  if (d < w) return { x: w - d, y: h };
  d -= w;
  return { x: 0, y: h - d };
}

/** Position on a circle (centered in a diameter×diameter box) for phase t, starting at top. */
function ringPos(t: number, r: number) {
  'worklet';
  const a = (((t % 1) + 1) % 1) * Math.PI * 2 - Math.PI / 2;
  return { x: r + r * Math.cos(a), y: r + r * Math.sin(a) };
}

/** A quick twinkle factor (0..1) that pulses a few times per orbit. */
function twinkle(phase: number) {
  'worklet';
  return 0.5 + 0.5 * Math.sin(phase * Math.PI * 2 * 3);
}

type SharedProgress = { value: number };

function Sparkle({
  progress,
  offset,
  size,
  shape,
  a,
  b,
  reverse = false,
}: {
  progress: SharedProgress;
  offset: number;
  size: number;
  shape: 'rect' | 'ring';
  a: number; // rect: width; ring: radius
  b: number; // rect: height (unused for ring)
  reverse?: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const phase = (reverse ? -progress.value : progress.value) + offset;
    const p = shape === 'ring' ? ringPos(phase, a) : rectPos(phase, a, b);
    const tw = twinkle(phase);
    return {
      transform: [
        { translateX: p.x - size / 2 },
        { translateY: p.y - size / 2 },
        { scale: 0.5 + 0.7 * tw },
      ],
      opacity: 0.3 + 0.7 * tw,
    };
  });
  return <Animated.Text style={[styles.glyph, { fontSize: size }, style]}>{GLYPH}</Animated.Text>;
}

function useOrbit(duration: number): SharedProgress {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [progress, duration]);
  return progress;
}

/** Tiny sparkles that travel around a rectangle's perimeter (e.g. a card). */
export function RectSparkles({
  width,
  height,
  count = 7,
  size,
  duration = 1600,
}: {
  width: number;
  height: number;
  count?: number;
  size?: number;
  duration?: number;
}) {
  // Two orbit speeds — half the sparkles move 40% slower — so the motion looks livelier.
  const fast = useOrbit(duration);
  const slow = useOrbit(duration / 0.6);
  const s = size ?? Math.max(10, width * 0.22);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width, height }]}>
      {Array.from({ length: count }).map((_, i) => (
        <Sparkle
          key={i}
          progress={i % 2 === 0 ? fast : slow}
          offset={i / count}
          size={s}
          shape="rect"
          a={width}
          b={height}
          reverse={i % 2 === 1}
        />
      ))}
    </View>
  );
}

/** Tiny sparkles that orbit around a circle (e.g. the wild chip). */
export function RingSparkles({
  diameter,
  count = 6,
  size,
  duration = 1300,
}: {
  diameter: number;
  count?: number;
  size?: number;
  duration?: number;
}) {
  // Two orbit speeds — half the sparkles move 40% slower.
  const fast = useOrbit(duration);
  const slow = useOrbit(duration / 0.6);
  const r = diameter / 2;
  const s = size ?? Math.max(9, diameter * 0.28);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: diameter, height: diameter }]}>
      {Array.from({ length: count }).map((_, i) => (
        <Sparkle
          key={i}
          progress={i % 2 === 0 ? fast : slow}
          offset={i / count}
          size={s}
          shape="ring"
          a={r}
          b={0}
          reverse={i % 2 === 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    position: 'absolute',
    left: 0,
    top: 0,
    color: colors.gold,
    fontWeight: '900',
    textShadowColor: 'rgba(255,214,107,0.95)',
    textShadowRadius: 5,
    textShadowOffset: { width: 0, height: 0 },
  },
});
