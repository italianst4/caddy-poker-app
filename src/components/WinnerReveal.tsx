import type { ReactNode } from 'react';
import { Alert, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ScreenLayout } from './ScreenLayout';
import { PrimaryButton } from './PrimaryButton';
import { ConfettiRain } from './ConfettiRain';
import { GolferWinAnimation } from './GolferWinAnimation';
import { GOLFERS } from '../data/golfers';
import { useGame } from '../store/gameStore';
import { colors, spacing } from '../theme';

export type RevealPlayer = {
  /** Index into the players/store arrays (used as a React key). */
  playerIdx: number;
  /** Index into GOLFERS — the golfer avatar (and its winning video). */
  avatar: number;
  name: string;
};

type Props = {
  /** One entry = a single winner (plays their video); more than one = a tie (no video). */
  winners: RevealPlayer[];
  losers: RevealPlayer[];
  /** Heading for the losers section, e.g. "Other golfers" / "Other hands". */
  losersLabel: string;
  /** Detail rendered under the winner (below the video for a single winner, under the name on a
   *  tie) — e.g. the winning poker hand, or a win count. */
  renderWinnerDetail?: (p: RevealPlayer) => ReactNode;
  /** Detail rendered under each losing golfer. */
  renderLoserDetail?: (p: RevealPlayer) => ReactNode;
};

/**
 * The single, shared end-of-game winner reveal used by every game mode. A lone winner plays
 * their golfer's transparent winning video (inline, right under the title) with a name pill; a
 * tie skips the video and shows the tied golfers side-by-side. Full-screen confetti rains on
 * both. The whole thing is a fixed, non-scrolling layout. Mode-specific detail (poker hand, win
 * count, …) is supplied by the caller so the layout stays identical everywhere.
 */
export function WinnerReveal({
  winners,
  losers,
  losersLabel,
  renderWinnerDetail,
  renderLoserDetail,
}: Props) {
  const { width, height } = useWindowDimensions();
  const reset = useGame((s) => s.reset);

  const isTie = winners.length > 1;
  const single = winners.length === 1 ? winners[0] : null;

  const winCellH = Math.min(width * 0.32, height * 0.22);
  const loseCellH = Math.min(width * 0.14, 74);

  const golferOf = (p: RevealPlayer) => GOLFERS[p.avatar] ?? GOLFERS[0];

  const onGameOver = () => {
    Alert.alert('Game over?', 'Return to the main menu?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Game Over', onPress: () => reset() },
    ]);
  };

  return (
    <ScreenLayout
      footer={<PrimaryButton label="Game Over" onPress={onGameOver} />}
      overlay={<ConfettiRain />}
    >
      {single ? (
        // The inline video + full-width gold name bar is the reveal; detail sits snug beneath.
        <>
          <Text style={styles.title}>Winner!</Text>
          <GolferWinAnimation source={golferOf(single).winVideo} winnerName={single.name} />
          {renderWinnerDetail ? <View style={styles.soloDetail}>{renderWinnerDetail(single)}</View> : null}
        </>
      ) : (
        <>
          <Text style={styles.title}>It's a tie!</Text>
          <View style={styles.winnersRow}>
          {winners.map((p) => {
            const g = golferOf(p);
            return (
              <View key={p.playerIdx} style={styles.winnerBlock}>
                <Text style={styles.crown}>👑</Text>
                <Image
                  source={g.source}
                  resizeMode="contain"
                  style={{ width: winCellH * g.ratio, height: winCellH }}
                />
                <Text style={styles.winnerName} numberOfLines={1}>
                  {p.name}
                </Text>
                {renderWinnerDetail ? renderWinnerDetail(p) : null}
              </View>
            );
          })}
          </View>
        </>
      )}

      {losers.length > 0 ? (
        <>
          <Text style={styles.othersLabel}>{losersLabel}</Text>
          <View style={styles.losers}>
            {losers.map((p) => {
              const g = golferOf(p);
              return (
                <View key={p.playerIdx} style={styles.loserCell}>
                  <Image
                    source={g.source}
                    resizeMode="contain"
                    style={{ width: loseCellH * g.ratio, height: loseCellH }}
                  />
                  <Text style={styles.loserName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  {renderLoserDetail ? renderLoserDetail(p) : null}
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: spacing.sm,
    // No bottom margin — the winner video butts right up against the title.
    marginBottom: 0,
  },
  soloDetail: { alignItems: 'center', marginTop: spacing.lg },
  winnersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  winnerBlock: { alignItems: 'center', gap: spacing.xs },
  crown: { fontSize: 30 },
  winnerName: { color: colors.gold, fontSize: 24, fontWeight: '900', maxWidth: 160 },
  othersLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: spacing.lg * 2,
    marginBottom: spacing.sm,
  },
  losers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.lg },
  loserCell: { alignItems: 'center', gap: spacing.xs, maxWidth: 100 },
  loserName: { color: colors.text, fontSize: 14, fontWeight: '800', maxWidth: '100%' },
});
