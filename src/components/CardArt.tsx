import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { CARD_RATIO, colors, radius, spacing } from '../theme';
import type { Card } from '../data/cards';

type Props = {
  card: Card;
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders the FRONT of a challenge card using its artwork. Falls back to a simple text
 * placeholder if a card ever lacks an image.
 */
export function CardArt({ card, style }: Props) {
  if (card.image) {
    return (
      <View style={[styles.frame, style]}>
        <Image source={card.image} style={styles.image} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={[styles.frame, styles.placeholder, style]}>
      <Text style={styles.flag}>⛳</Text>
      <Text style={styles.name}>{card.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: CARD_RATIO,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  flag: {
    fontSize: 46,
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
});
