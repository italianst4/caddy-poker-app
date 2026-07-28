import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { CardArt } from './CardArt';
import { CARD_RATIO, colors, spacing } from '../theme';
import type { Card } from '../data/cards';

// Aspect (w/h) of the torn-pack overlay art (995 × 596).
const RIPPED_RATIO = 995 / 596;

type Props = {
  /** Pack name shown in the pill (uppercased) / on the torn pack. */
  name: string;
  /** Total cards in the pack, shown in the corner badge / on the torn pack. */
  count: number;
  /** Cards to fan (first few are shown). */
  cards: Card[];
  /** Overall width the fan should fit within. */
  width: number;
  /** Explicit card height; when set, cards are sized to this instead of derived from `width`. */
  cardHeight?: number;
  /** Show the name pill at the bottom of the fan (default true; ignored in ripped mode). */
  showLabel?: boolean;
  /** Opened-pack look: a gentle bottom-pivoted fan with this torn-pack art laid over the bottom. */
  ripped?: ImageSourcePropType;
  /** Text color for the name/count printed on the torn pack (defaults to white). */
  ink?: string;
};

/**
 * A small, static fan of a pack's cards for the Card Packs grid.
 *
 * Default: a tight rotational fan with a gold name pill at the bottom and a count badge top-right.
 * Ripped mode (`ripped` set): a gentle fan that pivots from the bottom of the cards, with the
 * torn-open pack art overlaid at the bottom and the pack name + card count printed on it — so the
 * cards look like they're spilling out of a ripped-open pack.
 */
export function PackFan({ name, count, cards, width, cardHeight, showLabel = true, ripped, ink = '#FFFFFF' }: Props) {
  const cardW = cardHeight != null ? Math.round(cardHeight * CARD_RATIO) : Math.round(width * 0.58);
  const cardH = cardHeight != null ? Math.round(cardHeight) : Math.round(cardW / CARD_RATIO);
  const shown = cards.slice(0, 5);
  const mid = (shown.length - 1) / 2;

  if (ripped) {
    const rotStep = 4; // gentle fan
    const rippedW = width; // torn pack matches the passed (unopened-pack) width
    const rippedH = Math.round(rippedW / RIPPED_RATIO);
    const cardWr = Math.round(rippedW * 0.85); // cards sized in proportion to the pack
    const cardHr = Math.round(cardWr / CARD_RATIO);
    const cardBottom = Math.round(rippedH * 0.25); // card bottoms tuck deep into the torn pack
    const containerH = cardBottom + cardHr + 6;
    return (
      <View style={[styles.wrap, { width, height: containerH }]}>
        {shown.map((card, i) => {
          const o = i - mid; // -mid..+mid around the center card
          return (
            <View
              key={card.id}
              style={{
                position: 'absolute',
                bottom: cardBottom,
                left: (width - cardWr) / 2,
                width: cardWr,
                height: cardHr,
                // Pivot the fan from the bottom of the cards (their shared emerging point).
                transformOrigin: 'center bottom',
                transform: [{ rotateZ: `${o * rotStep}deg` }],
                zIndex: 10 - Math.abs(o),
              }}
            >
              <CardArt card={card} style={styles.cardArt} />
            </View>
          );
        })}

        {/* Torn-open pack front over the bottom of the fan. */}
        <Image
          source={ripped}
          resizeMode="stretch"
          style={{ position: 'absolute', bottom: 0, left: 0, width: rippedW, height: rippedH, zIndex: 20 }}
        />

        {/* Pack name + card count printed on the torn pack. */}
        <View style={[styles.rippedLabel, { bottom: Math.round(rippedH * 0.32) }]}>
          <Text
            style={[styles.rippedName, { color: ink, fontSize: Math.round(width * 0.12) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {name}
          </Text>
          <Text style={[styles.rippedCount, { color: ink, fontSize: Math.round(width * 0.072) }]} numberOfLines={1}>
            {count} {count === 1 ? 'card' : 'cards'}
          </Text>
        </View>
      </View>
    );
  }

  // Default (unripped) rotational fan.
  // Cap the per-card horizontal offset so even large cards stay within `width` (the rotation still
  // gives the fan its spread); small default cards keep the original 9px.
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
  // Ripped-mode name/count block, centered over the torn pack (bottom set inline).
  rippedLabel: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 30 },
  rippedName: {
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rippedCount: { fontWeight: '800', textAlign: 'center', opacity: 0.9, marginTop: 1 },
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
