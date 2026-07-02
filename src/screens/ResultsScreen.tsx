import { Alert, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { GOLFERS, MAX_GOLFER_RATIO } from '../data/golfers';
import { useGame } from '../store/gameStore';
import { colors, radius, spacing } from '../theme';

export function ResultsScreen() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const avatars = useGame((s) => s.avatars);
  const pokerCardCount = useGame((s) => s.pokerCardCount);
  const challengesWon = useGame((s) => s.challengesWon);
  const noPokerDeck = useGame((s) => s.noPokerDeck);
  const viewScorecard = useGame((s) => s.viewScorecard);
  const startCaddyDraw = useGame((s) => s.startCaddyDraw);
  const reset = useGame((s) => s.reset);

  const gap = spacing.lg;
  const columnWidth = (width - spacing.lg * 2 - gap) / 2;
  const cellH = Math.min(columnWidth / MAX_GOLFER_RATIO, height * 0.2);

  const onGameOver = () => {
    Alert.alert('Game over?', 'Return to the main menu?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Game Over', onPress: () => reset() },
    ]);
  };

  // ---- Challenges-only mode: crown whoever won the most challenges. ----
  if (noPokerDeck) {
    const wins = players.map((_, i) => challengesWon(i));
    const topWins = Math.max(0, ...wins);

    return (
      <ScreenLayout
        title="Round complete!"
        scroll
        footer={<PrimaryButton label="Game Over" onPress={onGameOver} />}
      >
        <Text style={styles.deal}>Most challenges won</Text>

        <View style={[styles.golfers, { width: columnWidth * 2 + gap, gap }]}>
          {players.map((name, i) => {
            const g = GOLFERS[avatars[i] ?? i] ?? GOLFERS[0];
            const count = wins[i];
            const isWinner = topWins > 0 && count === topWins;
            return (
              <View
                key={i}
                style={[
                  styles.golfer,
                  styles.championCell,
                  { width: columnWidth },
                  isWinner && styles.championWinner,
                ]}
              >
                <Text style={styles.crown}>{isWinner ? '👑' : ' '}</Text>
                <Image
                  source={g.source}
                  resizeMode="contain"
                  style={{ width: cellH * g.ratio, height: cellH }}
                />
                <Text style={[styles.name, isWinner && styles.winnerText]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.count, isWinner && styles.winnerText]}>
                  {count} {count === 1 ? 'win' : 'wins'}
                </Text>
              </View>
            );
          })}
        </View>
      </ScreenLayout>
    );
  }

  // ---- Default mode: poker hand finale + caddy draw. ----
  return (
    <ScreenLayout
      title="Let's play poker!"
      scroll
      footer={
        <>
          <PrimaryButton label="Ready to Pick Caddies" onPress={startCaddyDraw} />
          <Pressable
            onPress={() => viewScorecard('results')}
            style={({ pressed }) => [styles.textBtn, pressed && styles.textBtnPressed]}
          >
            <Text style={styles.textBtnLabel}>View Scorecard</Text>
          </Pressable>
        </>
      }
    >
      <Text style={styles.deal}>
        Deal out the following number of cards to each golfer below.
      </Text>

      <View style={[styles.golfers, { width: columnWidth * 2 + gap, gap }]}>
        {players.map((name, i) => {
          const g = GOLFERS[avatars[i] ?? i] ?? GOLFERS[0];
          const count = pokerCardCount(i);
          return (
            <View key={i} style={[styles.golfer, { width: columnWidth }]}>
              <Image
                source={g.source}
                resizeMode="contain"
                style={{ width: cellH * g.ratio, height: cellH }}
              />
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.count}>
                {count} {count === 1 ? 'card' : 'cards'}
              </Text>
            </View>
          );
        })}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  deal: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    lineHeight: 30,
  },
  golfers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  golfer: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  championCell: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: spacing.sm,
  },
  championWinner: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  crown: { fontSize: 26 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800', maxWidth: '100%' },
  count: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  winnerText: { color: colors.gold },
  textBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  textBtnPressed: { opacity: 0.6 },
  textBtnLabel: { color: colors.gold, fontSize: 16, fontWeight: '800' },
});
