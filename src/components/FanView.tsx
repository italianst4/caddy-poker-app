import { useEffect, useRef, useState } from 'react';
import { Alert, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { CardArt } from './CardArt';
import { PrimaryButton } from './PrimaryButton';
import { SmokePuff } from './SmokePuff';
import { CARD_RATIO, colors, spacing } from '../theme';
import type { Card } from '../data/cards';

export type EarnedCard = { card: Card; hole: number };

type Props = {
  name: string;
  items: EarnedCard[];
  initialIndex?: number;
  onClose: () => void;
  /** Called when a card is marked "not achieved" (hole to flip to failed). */
  onIncorrect?: (hole: number) => void;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const STEP_PX = 90; // drag distance (px) to advance one card

function FanCard({
  item,
  index,
  pos,
  width,
  height,
}: {
  item: EarnedCard;
  index: number;
  pos: SharedValue<number>;
  width: number;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const o = index - pos.value;
    const abs = Math.abs(o);
    const capped = Math.min(abs, 3);
    return {
      transform: [
        { perspective: 1000 },
        { translateX: o * 44 },
        { translateY: capped * 22 },
        { rotateZ: `${o * 8}deg` },
        { scale: 1 - capped * 0.1 },
      ],
      opacity: abs > 2.6 ? 0 : 1,
      zIndex: Math.round(100 - abs * 10),
    };
  });

  return (
    <Animated.View style={[styles.fanCard, { width, height }, style]}>
      <CardArt card={item.card} style={styles.fill} />
    </Animated.View>
  );
}

/** The current card explodes (scale up + fade) while smoke puffs from the fan center. */
function ExplodingFanCard({
  card,
  cardW,
  cardH,
  fanW,
  fanH,
}: {
  card: Card;
  cardW: number;
  cardH: number;
  fanW: number;
  fanH: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) });
  }, [p]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.35 * p.value }, { rotate: `${6 * p.value}deg` }],
    opacity: interpolate(p.value, [0, 0.45, 1], [1, 0.9, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: (fanW - cardW) / 2,
          top: (fanH - cardH) / 2,
          width: cardW,
          height: cardH,
          zIndex: 200,
        },
        style,
      ]}
    >
      <CardArt card={card} style={styles.fill} />
    </Animated.View>
  );
}

/** A fanned spread of earned cards; drag to flip through, with an "Incorrect?" correction. */
export function FanView({ name, items, initialIndex = 0, onClose, onIncorrect }: Props) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width * 0.5, 200);
  const cardH = cardW / CARD_RATIO;
  const fanH = cardH + 70;

  const [cards, setCards] = useState<EarnedCard[]>(items);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const start = clamp(initialIndex, 0, Math.max(0, cards.length - 1));
  const [index, setIndex] = useState(start);
  const idxRef = useRef(start);
  idxRef.current = index;
  const pos = useSharedValue(start);

  const [fanW, setFanW] = useState(width);
  const [exploding, setExploding] = useState<{ card: Card } | null>(null);
  const startPos = useRef(start);

  const safeIndex = Math.min(index, Math.max(0, cards.length - 1));
  const currentItem = cards[safeIndex];

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        startPos.current = pos.value;
      },
      onPanResponderMove: (_, g) => {
        const last = Math.max(0, cardsRef.current.length - 1);
        pos.value = clamp(startPos.current - g.dx / STEP_PX, 0, last);
      },
      onPanResponderRelease: (_, g) => {
        const last = Math.max(0, cardsRef.current.length - 1);
        const target = clamp(Math.round(pos.value - g.vx * 0.25), 0, last);
        pos.value = withSpring(target, { damping: 16, stiffness: 150, mass: 0.6 });
        setIndex(target);
      },
    })
  ).current;

  const removeCurrent = () => {
    const k = idxRef.current;
    const item = cardsRef.current[k];
    if (!item) return;
    onIncorrect?.(item.hole);
    setExploding({ card: item.card });

    const next = cardsRef.current.filter((_, j) => j !== k);
    setCards(next);
    const newIndex = Math.min(k, Math.max(0, next.length - 1));
    setIndex(newIndex);
    idxRef.current = newIndex;
    pos.value = withSpring(newIndex, { damping: 16, stiffness: 150, mass: 0.6 });

    setTimeout(() => {
      setExploding(null);
      if (next.length === 0) onClose();
    }, 850);
  };

  const onIncorrectPress = () => {
    if (!currentItem) return;
    Alert.alert('Correct the score?', `Mark Hole #${currentItem.hole} as not achieved for ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: `Yes, ${name} did not achieve this`, style: 'destructive', onPress: removeCurrent },
    ]);
  };

  return (
    <View style={styles.overlay}>
      <Text style={styles.name}>{name}</Text>

      {cards.length === 0 && !exploding ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No cards earned yet.</Text>
        </View>
      ) : (
        <>
          <View
            style={[styles.fanArea, { height: fanH }]}
            onLayout={(e) => setFanW(e.nativeEvent.layout.width)}
            {...pan.panHandlers}
          >
            {cards.map((item, i) => (
              <FanCard key={i} item={item} index={i} pos={pos} width={cardW} height={cardH} />
            ))}
            {exploding ? (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <SmokePuff originX={fanW / 2} originY={fanH / 2} />
                <ExplodingFanCard card={exploding.card} cardW={cardW} cardH={cardH} fanW={fanW} fanH={fanH} />
              </View>
            ) : null}
          </View>

          {currentItem ? (
            <Text style={styles.holeLabel}>Earned on Hole #{currentItem.hole}</Text>
          ) : null}

          {currentItem && onIncorrect ? (
            <PrimaryButton
              label="Incorrect?"
              variant="ghost"
              small
              onPress={onIncorrectPress}
              style={styles.incorrectBtn}
            />
          ) : null}
        </>
      )}

      <View style={styles.footer}>
        <PrimaryButton label="Close" variant="secondary" small onPress={onClose} style={styles.closeBtn} />
      </View>
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
    backgroundColor: 'rgba(6,18,12,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    paddingHorizontal: spacing.lg,
  },
  name: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  fanArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanCard: {
    position: 'absolute',
  },
  fill: { width: '100%', height: '100%' },
  holeLabel: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  incorrectBtn: {
    marginTop: spacing.md,
    minWidth: 140,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
  emptyText: { color: colors.textMuted, fontSize: 16 },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  closeBtn: {
    minWidth: 120,
  },
});
