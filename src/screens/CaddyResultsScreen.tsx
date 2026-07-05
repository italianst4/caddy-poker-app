import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { CardArt } from '../components/CardArt';
import { CardViewer } from '../components/CardViewer';
import { useGame } from '../store/gameStore';
import { caddyById } from '../data/caddyCards';
import { CARD_RATIO, colors, spacing } from '../theme';

export function CaddyResultsScreen() {
  const { width } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const caddyCards = useGame((s) => s.caddyCards);
  const caddyAssignment = useGame((s) => s.caddyAssignment);
  const pokerCardCount = useGame((s) => s.pokerCardCount);
  const includeCaddies = useGame((s) => s.includeCaddies);
  const reset = useGame((s) => s.reset);

  const [viewing, setViewing] = useState<number | null>(null);
  const viewingCard =
    viewing != null && caddyAssignment[viewing] != null
      ? caddyById(caddyCards[caddyAssignment[viewing]])
      : undefined;

  const gap = spacing.lg;
  const cardWidth = Math.min((width - spacing.lg * 2 - gap) / 2, 150);

  const onGameOver = () => {
    Alert.alert('Game over?', 'Return to the main menu?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Game Over', onPress: () => reset() },
    ]);
  };

  return (
    <View style={styles.flex}>
      <ScreenLayout
        title={includeCaddies ? 'Caddies drawn' : 'Poker cards earned'}
        subtitle={includeCaddies ? 'Use these to improve your poker hand.' : 'Deal these out and play poker!'}
        scroll
        footer={<PrimaryButton label="Game Over" onPress={onGameOver} />}
      >
        <View style={[styles.grid, { gap }]}>
          {players.map((name, i) => {
            const pos = caddyAssignment[i];
            const card = pos != null ? caddyById(caddyCards[pos]) : undefined;
            const count = pokerCardCount(i);
            // No caddies: just show each golfer's earned poker-card count.
            if (!includeCaddies) {
              return (
                <View key={i} style={[styles.cell, styles.countCell, { width: cardWidth }]}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.bigCount}>{count}</Text>
                  <Text style={styles.countLabel}>{count === 1 ? 'card' : 'cards'}</Text>
                </View>
              );
            }
            return (
              <View key={i} style={[styles.cell, { width: cardWidth }]}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Pressable
                  onPress={() => setViewing(i)}
                  style={{ width: cardWidth, height: cardWidth / CARD_RATIO }}
                >
                  {card ? <CardArt card={card} style={styles.fill} /> : null}
                  {/* count of poker cards earned */}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{count}</Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScreenLayout>

      {viewing != null && viewingCard ? (
        <CardViewer
          card={viewingCard}
          playerName={players[viewing]}
          dismissLabel="Close"
          onDismiss={() => setViewing(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  cell: { alignItems: 'center', gap: spacing.xs },
  countCell: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: 'rgba(212,175,55,0.10)',
  },
  bigCount: { color: colors.gold, fontSize: 48, fontWeight: '900' },
  countLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  name: { color: colors.text, fontSize: 18, fontWeight: '800', maxWidth: '100%' },
  fill: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    right: -12,
    bottom: -12,
    minWidth: 68,
    height: 68,
    borderRadius: 34,
    paddingHorizontal: 12,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.primaryText, fontSize: 32, fontWeight: '900' },
});
