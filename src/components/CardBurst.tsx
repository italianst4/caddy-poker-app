import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CardArt } from './CardArt';
import { SmokePuff } from './SmokePuff';
import type { Card } from '../data/cards';
import type { Rect } from './AchievementOverlay';

/* The card scales up and fades while debris bursts outward — an "explode & vanish". */
function ExplodingCard({ card, rect }: { card: Card; rect: Rect }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) });
  }, [p]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.35 * p.value }, { rotate: `${6 * p.value}deg` }],
    opacity: interpolate(p.value, [0, 0.45, 1], [1, 0.9, 0]),
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height },
        style,
      ]}
    >
      <CardArt card={card} style={styles.fill} />
    </Animated.View>
  );
}

type Props = {
  card: Card;
  rect: Rect;
  onDone: () => void;
};

/** Full-screen overlay: explodes a card in place (used when a challenge is marked failed). */
export function CardBurst({ card, rect, onDone }: Props) {
  useEffect(() => {
    const id = setTimeout(onDone, 1000);
    return () => clearTimeout(id);
  }, [onDone]);

  const originX = rect.x + rect.width / 2;
  const originY = rect.y + rect.height / 2;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {/* Smoke sits behind the card; as the card fades, the puff is revealed. */}
      <SmokePuff originX={originX} originY={originY} />
      <ExplodingCard card={card} rect={rect} />
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
});
