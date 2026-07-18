import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { CardArt } from './CardArt';
import { CARD_RATIO, colors, spacing } from '../theme';
import type { Card } from '../data/cards';

/* ---------------- a single twinkling sparkle ---------------- */
function Sparkle({ left, top, size, delay }: { left: number; top: number; size: number; delay: number }) {
  const p = useSharedValue(0);
  // Twinkle forever: fade+scale up, then down, with a stagger via `delay`.
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 520, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 620, easing: Easing.in(Easing.quad) })
        ),
        -1
      )
    );
  }, [p, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.4 + p.value * 0.8 }, { rotate: `${p.value * 90}deg` }],
  }));
  return (
    <Animated.Text
      style={[{ position: 'absolute', left, top, fontSize: size }, style]}
      pointerEvents="none"
    >
      ✦
    </Animated.Text>
  );
}

/** A scatter of twinkling sparkles filling a box of the given size — the "this is new!" flourish. */
function Sparkles({ width, height }: { width: number; height: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        // Deterministic scatter (no Math.random needed) across the card.
        left: (((i * 47) % 100) / 100) * width,
        top: (((i * 71) % 100) / 100) * height,
        size: 14 + (i % 4) * 6,
        delay: (i % 5) * 180,
      })),
    [width, height]
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map((d, i) => (
        <Sparkle key={i} {...d} />
      ))}
    </View>
  );
}

type Props = {
  cards: Card[];
  initialIndex?: number;
  onClose: () => void;
  /** Show the "new card" sparkle flourish over each card (default true). */
  sparkle?: boolean;
};

/** Full-screen, swipeable carousel of card faces. Tap ✕ (or the backdrop) to close. */
export function PackCardViewer({ cards, initialIndex = 0, onClose, sparkle = true }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const cardW = Math.min(width * 0.74, 320);
  const cardH = cardW / CARD_RATIO;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.root}>
      {/* Tap-anywhere backdrop to dismiss; the cards sit above it. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.header} pointerEvents="box-none">
        <Text style={styles.counter}>
          {index + 1} / {cards.length}
        </Text>
        <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: initialIndex * width, y: 0 }}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.scroll}
      >
        {cards.map((card) => (
          <View key={card.id} style={[styles.page, { width }]}>
            <View style={{ width: cardW, height: cardH }}>
              <CardArt card={card} style={styles.card} />
              {sparkle ? <Sparkles width={cardW} height={cardH} /> : null}
            </View>
            <Text style={styles.name}>{card.name}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.hint}>Swipe to see more • tap to close</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,16,11,0.94)',
    justifyContent: 'center',
    zIndex: 50,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.xl + spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: { color: colors.textMuted, fontSize: 16, fontWeight: '800' },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.white, fontSize: 24, fontWeight: '900' },
  pressed: { opacity: 0.6 },
  scroll: { flexGrow: 0 },
  page: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  card: { width: '100%', height: '100%' },
  name: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  hint: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
