import { StyleSheet, Text, View } from 'react-native';
import { CardArt } from './CardArt';
import { CARD_RATIO, colors, spacing } from '../theme';
import type { Card } from '../data/cards';

type Props = {
  /** Pack name shown in the pill (uppercased). */
  name: string;
  /** Total cards in the pack, shown in the corner badge. */
  count: number;
  /** Cards to fan (first few are shown). */
  cards: Card[];
  /** Overall width the fan should fit within. */
  width: number;
  /** Explicit card height; when set, cards are sized to this instead of derived from `width`. */
  cardHeight?: number;
  /** Show the name pill at the bottom of the fan (default true). */
  showLabel?: boolean;
};

/**
 * A small, static, tight fan of a pack's cards for the Card Packs grid — like the earned-cards
 * fan but compressed. A name pill sits at the bottom of the fan and a card-count badge pins to the
 * top-right corner.
 */
export function PackFan({ name, count, cards, width, cardHeight, showLabel = true }: Props) {
  const cardW = cardHeight != null ? Math.round(cardHeight * CARD_RATIO) : Math.round(width * 0.58);
  const cardH = cardHeight != null ? Math.round(cardHeight) : Math.round(cardW / CARD_RATIO);
  const shown = cards.slice(0, 5);
  const mid = (shown.length - 1) / 2;

  // Rotational fan. Cap the per-card horizontal offset so even large cards stay within `width`
  // (the rotation still gives the fan its spread); small default cards keep the original 9px.
  const rotStep = 6;
  const outerRotRad = (rotStep * mid * Math.PI) / 180;
  const halfBound = (cardW * Math.cos(outerRotRad) + cardH * Math.sin(outerRotRad)) / 2;
  const txStep = mid > 0 ? Math.max(0, Math.min(9, (width / 2 - halfBound) / mid)) : 0;

  return (
    <View style={[styles.wrap, { width, height: cardH + 16 }]}>
      {shown.map((card, i) => {
        const o = i - mid; // -mid..+mid around the center card
        return (
          <View
            key={card.id}
            style={[
              styles.card,
              {
                width: cardW,
                height: cardH,
                transform: [
                  { translateX: o * txStep }, // horizontal spread (auto-capped to fit width)
                  { translateY: Math.abs(o) * 3 }, // slight downward arc for outer cards
                  { rotateZ: `${o * rotStep}deg` }, // tight fan angle
                ],
                zIndex: 10 - Math.abs(o),
              },
            ]}
          >
            <CardArt card={card} style={styles.cardArt} />
          </View>
        );
      })}

      {/* Name pill sitting on top of the fan, at its bottom edge. */}
      {showLabel ? (
        <View style={[styles.pill, { maxWidth: width }]}>
          <Text
            style={[styles.pillText, { fontSize: Math.round(width * 0.11) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {name.toUpperCase()}
          </Text>
        </View>
      ) : null}

      {/* Card-count badge, top-right. */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute' },
  cardArt: { width: '100%', height: '100%', borderRadius: 6 },
  pill: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(11,31,23,0.94)',
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    zIndex: 30,
  },
  pillText: { color: colors.gold, fontWeight: '900', letterSpacing: 0.3 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 4,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    zIndex: 40,
  },
  badgeText: { color: colors.primaryText, fontSize: 13, fontWeight: '900' },
});
