import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { CARD_RATIO, colors, radius, spacing } from '../theme';

type Props = {
  label: string;
  source: ImageSourcePropType;
  enabled: boolean;
  onToggle: (next: boolean) => void;
};

/** A tappable "deck" tile for the Decks in Play picker. Rendered as a small stack of cards that
 *  is see-through when the deck is off and snaps to a solid, gold-bordered card when tapped on. */
export function DeckToggle({ label, source, enabled, onToggle }: Props) {
  return (
    <Pressable
      onPress={() => onToggle(!enabled)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View style={styles.stack}>
        {/* Wrapper carries the hard offset shadow — the card itself clips its image with
            overflow:hidden, which would otherwise clip the shadow too. */}
        <View style={[styles.cardShadow, enabled && styles.cardShadowOn]}>
          <View style={[styles.card, enabled ? styles.cardOn : styles.cardOff]}>
            <Image source={source} style={styles.image} resizeMode="cover" />
            {!enabled ? <View style={styles.veil} /> : null}
          </View>
        </View>
      </View>
      <Text style={[styles.label, enabled ? styles.labelOn : styles.labelOff]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  // Sized by the card's aspect ratio.
  stack: { width: '82%' },
  cardShadow: { borderRadius: radius.sm },
  // Hard offset shadow: up + right, no blur, fully solid.
  cardShadowOn: {
    backgroundColor: colors.card,
    shadowColor: colors.black,
    shadowOffset: { width: 4, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  card: {
    aspectRatio: CARD_RATIO,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
  },
  cardOn: { borderColor: colors.border, opacity: 1 },
  cardOff: { borderColor: 'rgba(255,255,255,0.25)', opacity: 0.35 },
  image: { width: '100%', height: '100%' },
  // Extra wash so an "off" deck reads as clearly muted, not just dimmed.
  veil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,31,23,0.45)' },
  label: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  labelOn: { color: colors.text },
  labelOff: { color: colors.textMuted },
});
