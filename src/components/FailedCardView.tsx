import { Alert, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CardArt } from './CardArt';
import { PrimaryButton } from './PrimaryButton';
import { CARD_RATIO, colors, spacing } from '../theme';
import type { Card } from '../data/cards';

type Props = {
  name: string;
  card: Card;
  hole: number;
  onConfirmAchieved: () => void;
  onClose: () => void;
};

/**
 * Full-screen view of a challenge a golfer FAILED (shown faded), with a correction flow:
 * "Incorrect?" → confirm → marks the hole achieved.
 */
export function FailedCardView({ name, card, hole, onConfirmAchieved, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.72, height * 0.5 * CARD_RATIO);

  const onIncorrect = () => {
    Alert.alert(`Did ${name} achieve this challenge?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: `Yes, ${name} achieved this challenge`, onPress: onConfirmAchieved },
    ]);
  };

  return (
    <View style={styles.overlay}>
      <Text style={styles.name}>{name}</Text>

      <View style={[styles.cardArea, { width: cardWidth, height: cardWidth / CARD_RATIO }]}>
        <CardArt card={card} style={styles.fadedCard} />
      </View>

      <Text style={styles.failed}>Challenge failed on Hole #{hole}</Text>

      <PrimaryButton label="Incorrect?" variant="ghost" small onPress={onIncorrect} style={styles.incorrectBtn} />

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
    zIndex: 70,
    paddingHorizontal: spacing.lg,
  },
  name: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  cardArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fadedCard: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  failed: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  incorrectBtn: {
    marginTop: spacing.lg,
    minWidth: 140,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  closeBtn: {
    minWidth: 120,
  },
});
