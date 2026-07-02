import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CardArt } from './CardArt';
import { PrimaryButton } from './PrimaryButton';
import { CARD_RATIO, colors, spacing } from '../theme';
import type { Card } from '../data/cards';

type Props = {
  card: Card;
  playerName: string;
  onDismiss: () => void;
  dismissLabel?: string;
};

/**
 * Full-screen card view (no flip, no rays) — same layout/size as the reveal, used when a
 * card is tapped on the scoring grid. The player's name is shown below the card.
 */
export function CardViewer({ card, playerName, onDismiss, dismissLabel = 'Done' }: Props) {
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.78, height * 0.6 * CARD_RATIO);

  return (
    <View style={styles.overlay}>
      <Text style={styles.player}>{playerName}</Text>

      <View style={[styles.cardArea, { width: cardWidth, height: cardWidth / CARD_RATIO }]}>
        <CardArt card={card} style={styles.fill} />
      </View>

      <View style={styles.buttonWrap}>
        <PrimaryButton label={dismissLabel} onPress={onDismiss} variant="secondary" />
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
    zIndex: 10,
  },
  cardArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  buttonWrap: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
