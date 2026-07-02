import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CardBack } from '../components/CardBack';
import { CardArt } from '../components/CardArt';
import { FlipCard } from '../components/FlipCard';
import { useGame } from '../store/gameStore';
import { CADDY_BACK, caddyById } from '../data/caddyCards';
import { colors, spacing } from '../theme';

export function CaddyDrawScreen() {
  const { width } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const caddyCards = useGame((s) => s.caddyCards);
  const caddyAssignment = useGame((s) => s.caddyAssignment);
  const caddyTurn = useGame((s) => s.caddyTurn);
  const pickCaddy = useGame((s) => s.pickCaddy);
  const advanceCaddyTurn = useGame((s) => s.advanceCaddyTurn);

  const [revealed, setRevealed] = useState<number | null>(null);

  const currentPlayer = players[caddyTurn];
  const pickedPositions = Object.values(caddyAssignment);
  const positionToPlayer: Record<number, number> = {};
  for (const [playerIdx, position] of Object.entries(caddyAssignment)) {
    positionToPlayer[position] = Number(playerIdx);
  }

  // 3-column grid.
  const cols = 3;
  const gap = spacing.sm;
  const cardWidth = (width - spacing.lg * 2 - gap * (cols - 1)) / cols;

  const onPick = (position: number) => {
    pickCaddy(position);
    setRevealed(position);
  };

  const onOkay = () => {
    setRevealed(null);
    advanceCaddyTurn();
  };

  const revealedCard = revealed != null ? caddyById(caddyCards[revealed]) : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.label}>CADDY DRAW</Text>
        <Text style={styles.turnText}>
          <Text style={styles.turnName}>{currentPlayer}</Text>, pick a caddy
        </Text>
        <Text style={styles.turnProgress}>
          Player {caddyTurn + 1} of {players.length}
        </Text>
      </View>

      <View style={[styles.grid, { gap }]}>
        {caddyCards.map((cardId, position) => {
          const isPicked = pickedPositions.includes(position);
          if (isPicked) {
            const card = caddyById(cardId);
            const ownerName = players[positionToPlayer[position]];
            return (
              <View key={position} style={[styles.cell, { width: cardWidth }]}>
                {card ? <CardArt card={card} style={styles.fill} /> : null}
                <Text style={styles.pickedName} numberOfLines={1}>
                  {ownerName}
                </Text>
              </View>
            );
          }
          return (
            <CardBack
              key={position}
              source={CADDY_BACK}
              onPress={() => onPick(position)}
              style={{ width: cardWidth }}
            />
          );
        })}
      </View>

      {revealedCard ? (
        <FlipCard
          key={revealedCard.id}
          card={revealedCard}
          playerName={currentPlayer}
          back={CADDY_BACK}
          acceptLabel="Okay"
          onDismiss={onOkay}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '800', letterSpacing: 4 },
  turnText: { color: colors.text, fontSize: 22, fontWeight: '600', marginTop: spacing.xs },
  turnName: { color: colors.gold, fontWeight: '900' },
  turnProgress: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  cell: { alignItems: 'center', gap: spacing.xs },
  fill: { width: '100%' },
  pickedName: { color: colors.gold, fontSize: 14, fontWeight: '800', maxWidth: '100%' },
});
