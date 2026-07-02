import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../theme';

const CONFETTI_COLORS = ['#FFD66B', '#34C759', '#FF6B6B', '#4DA3FF', '#FF9F40', '#B47CFF'];
const PIECES = 44;
const DURATION_MS = 1900;

type PieceProps = { width: number; height: number };

function ConfettiPiece({ width, height }: PieceProps) {
  // Randomized per-piece parameters, fixed for the piece's lifetime.
  const cfg = useMemo(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    return {
      startX: Math.random() * width,
      drift: rand(-70, 70),
      size: rand(7, 13),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      spin: rand(360, 1080) * (Math.random() < 0.5 ? -1 : 1),
      delay: Math.random() * 250,
      duration: rand(1400, 2200),
      square: Math.random() < 0.5,
    };
  }, [width]);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      cfg.delay,
      withTiming(1, { duration: cfg.duration, easing: Easing.out(Easing.quad) })
    );
  }, [progress, cfg]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: cfg.startX + cfg.drift * progress.value },
      { translateY: -30 + (height + 80) * progress.value },
      { rotate: `${cfg.spin * progress.value}deg` },
    ],
    opacity: interpolate(progress.value, [0, 0.85, 1], [1, 1, 0]),
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

type Props = {
  message: string;
  onDone: () => void;
};

/**
 * A transient full-screen celebration: confetti rains down behind a popped-in message
 * banner. Auto-dismisses after a moment; tap anywhere to dismiss early.
 */
export function Celebration({ message, onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withSpring(1, { damping: 11, stiffness: 140 });
    const id = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(id);
  }, [pop, onDone]);

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.7 + pop.value * 0.3 }],
  }));

  return (
    <Pressable style={styles.overlay} onPress={onDone}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: PIECES }).map((_, i) => (
          <ConfettiPiece key={i} width={width} height={height} />
        ))}
      </View>

      <Animated.View style={[styles.banner, bannerStyle]}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  banner: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emoji: { fontSize: 44, marginBottom: spacing.sm },
  message: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
});
