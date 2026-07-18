import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CardArt } from './CardArt';
import { ConfettiBurst } from './ConfettiBurst';
import { colors, radius, spacing } from '../theme';
import type { Card } from '../data/cards';

export type Rect = { x: number; y: number; width: number; height: number };

/* ---------------- card that shrinks & flies to the chip ---------------- */
function FlyingCard({ card, from, to }: { card: Card; from: Rect; to: Rect }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 680, easing: Easing.in(Easing.cubic) });
  }, [p]);

  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);
  const targetScale = Math.max(0.06, to.height / from.height);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx * p.value },
      { translateY: dy * p.value },
      { scale: 1 + (targetScale - 1) * p.value },
    ],
    opacity: interpolate(p.value, [0, 0.75, 1], [1, 1, 0]),
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: from.x, top: from.y, width: from.width, height: from.height },
        style,
      ]}
    >
      <CardArt card={card} style={styles.fill} />
    </Animated.View>
  );
}

/* ---------------- bottom slide-up message ---------------- */
export function BottomToast({
  message,
  bottom,
  delay = 400,
}: {
  message: string;
  bottom: number;
  /** How long to wait before sliding in (default 400ms, to let a flying card land first). */
  delay?: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    // Slide in, hold a beat, slide out.
    p.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
        withDelay(1350, withTiming(0, { duration: 320, easing: Easing.in(Easing.cubic) }))
      )
    );
  }, [p, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 70 }],
  }));

  return (
    <Animated.View style={[styles.toast, { bottom }, style]}>
      <Text style={styles.toastText}>🎉 {message}</Text>
    </Animated.View>
  );
}

/* ---------------- orchestrator ---------------- */
type Props = {
  card: Card;
  from: Rect;
  to: Rect;
  message: string;
  onDone: () => void;
  /** Distance of the toast from the bottom — raise it so it clears the slide-up footer. */
  toastBottom?: number;
};

export function AchievementOverlay({ card, from, to, message, onDone, toastBottom = 48 }: Props) {
  useEffect(() => {
    // Long enough to cover: card flight + delayed toast (400 + 320 + 1350 + 320).
    const id = setTimeout(onDone, 2450);
    return () => clearTimeout(id);
  }, [onDone]);

  const originX = from.x + from.width / 2;
  const originY = from.y + from.height / 2;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <ConfettiBurst originX={originX} originY={originY} />
      <FlyingCard card={card} from={from} to={to} />
      <BottomToast message={message} bottom={toastBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
  fill: { width: '100%', height: '100%' },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  toastText: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
});
