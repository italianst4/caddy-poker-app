import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { CARD_RATIO, colors, radius } from '../theme';
import { SUIT_EMOJI, SUIT_IS_RED, type PokerCard } from '../data/pokerDeck';
import { RingSparkles } from './Sparkles';

type Props = {
  card: PokerCard;
  width: number;
  selected?: boolean;
  /** Highlight a card that is acting as wild under the player's caddy effect. */
  wild?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** A single virtual playing card: corner rank + suit emoji, big center suit. */
export function PokerCardView({ card, width, selected, wild, onPress, style }: Props) {
  const red = SUIT_IS_RED[card.suit];
  const emoji = SUIT_EMOJI[card.suit];
  const rankColor = red ? styles.red : styles.black;
  const rankSize = width * 0.28;
  const height = width / CARD_RATIO;

  const face = (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.frame,
        { width, height },
        selected && styles.selected,
        wild && styles.wild,
        pressed && onPress && styles.pressed,
        !wild && style,
      ]}
    >
      <Text
        style={[styles.corner, styles.cornerTop, rankColor, { fontSize: rankSize }]}
        numberOfLines={1}
      >
        {card.rank}
      </Text>
      <Text style={[styles.center, { fontSize: width * 0.52 }]}>{emoji}</Text>
      <Text
        style={[styles.corner, styles.cornerBottom, rankColor, { fontSize: rankSize }]}
        numberOfLines={1}
      >
        {card.rank}
      </Text>
    </Pressable>
  );

  if (!wild) return face;

  // Wild: a small "WILD" chip near the top-right corner, sitting mostly on the card.
  const chip = width * 0.5;
  return (
    <View style={[{ width, height }, style]}>
      {face}
      <View style={[styles.chipCorner, { top: -chip * 0.55, right: -chip * 0.1 }]} pointerEvents="none">
        <WildChip size={chip} />
      </View>
    </View>
  );
}

/** A small solid-gold poker chip stamped "WILD", with tiny sparkles orbiting around it. */
export function WildChip({ size, label = 'WILD' }: { size: number; label?: string }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.chip, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.chipText, { fontSize: size * 0.26 }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <RingSparkles diameter={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  selected: {
    borderColor: colors.gold,
    borderWidth: 3,
  },
  wild: {
    borderColor: colors.gold,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  corner: {
    position: 'absolute',
    fontWeight: '900',
    lineHeight: undefined,
  },
  cornerTop: { top: 3, left: 5 },
  cornerBottom: { bottom: 3, right: 5, transform: [{ rotate: '180deg' }] },
  center: { alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' },
  red: { color: '#C62828' },
  black: { color: '#111' },
  chipCorner: {
    position: 'absolute',
    zIndex: 5,
  },
  chip: {
    transform: [{ rotate: '-12deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  chipText: { color: colors.primaryText, fontWeight: '900', letterSpacing: 0.3 },
});
