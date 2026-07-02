import { useState, type MutableRefObject } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { ScreenHeader } from './ScreenHeader';
import { Odometer } from './Odometer';
import { FanView, type EarnedCard } from './FanView';
import { FailedCardView } from './FailedCardView';
import { useGame, MATCHUP_REWARD } from '../store/gameStore';
import { cardById, type Card } from '../data/cards';
import { GOLFERS } from '../data/golfers';
import { colors, radius, spacing } from '../theme';

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

/* ------------------------------------------------------------------ */
/* Header chips: each golfer's initial + current poker-card count.     */
/* ------------------------------------------------------------------ */
type ChipsProps = {
  onPress: () => void;
  /** Optional registry so an animation can fly a card to a golfer's chip. */
  chipRefs?: MutableRefObject<Record<number, View | null>>;
};

export function ScoreChips({ onPress, chipRefs }: ChipsProps) {
  const players = useGame((s) => s.players);
  const pokerCardCount = useGame((s) => s.pokerCardCount);
  // Subscribe to the data the count derives from so chips update live.
  useGame((s) => s.results);
  useGame((s) => s.matchup);

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.chipsRow}>
      {players.map((name, i) => (
        <View
          key={i}
          ref={(node) => {
            if (chipRefs) chipRefs.current[i] = node;
          }}
          style={styles.chip}
        >
          <Text style={styles.chipInitial}>{initialOf(name)}</Text>
          {/* Delay the roll so the count ticks up as the flying card lands on the chip. */}
          <Odometer value={pokerCardCount(i)} color={colors.text} fontSize={13} animateDelay={650} />
        </View>
      ))}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Full-screen golf-style scorecard.                                   */
/* ------------------------------------------------------------------ */
export function Scorecard() {
  const { width } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const avatars = useGame((s) => s.avatars);
  const holes = useGame((s) => s.holes);
  const results = useGame((s) => s.results);
  const matchup = useGame((s) => s.matchup);
  const assignment = useGame((s) => s.assignment);
  const holeCards = useGame((s) => s.holeCards);
  const pokerCardCount = useGame((s) => s.pokerCardCount);
  const setHoleResult = useGame((s) => s.setHoleResult);
  const setHoleMatchupWinner = useGame((s) => s.setHoleMatchupWinner);
  const goTo = useGame((s) => s.goTo);
  const reset = useGame((s) => s.reset);
  const noPokerDeck = useGame((s) => s.noPokerDeck);
  const scorecardReturn = useGame((s) => s.scorecardReturn);

  // End Round only makes sense mid-game (not when arriving from the results screen).
  const showEndRound = scorecardReturn !== 'results';

  const [fan, setFan] = useState<{
    name: string;
    items: EarnedCard[];
    initialIndex: number;
    playerIdx: number;
  } | null>(null);
  const [failed, setFailed] = useState<{ playerIdx: number; hole: number; card: Card } | null>(null);

  // Poker cards a golfer earned on a given hole.
  const countFor = (hole: number, i: number) => {
    const m = matchup[hole];
    if (m) return m.winner === i ? MATCHUP_REWARD : 0;
    return results[hole]?.[i] === 'achieved' ? 1 : 0;
  };
  const isPlayed = (hole: number, i: number) =>
    matchup[hole] != null || results[hole]?.[i] != null;

  // The actual challenge cards a golfer earned, hole by hole.
  const earnedCardsFor = (i: number): EarnedCard[] => {
    const list: EarnedCard[] = [];
    for (let hole = 1; hole <= holes; hole++) {
      const m = matchup[hole];
      if (m) {
        if (m.winner === i) {
          const c = cardById(m.cardId);
          if (c) list.push({ card: c, hole });
        }
        continue;
      }
      if (results[hole]?.[i] === 'achieved') {
        const pos = assignment[hole]?.[i];
        const c = pos != null ? cardById(holeCards[hole]?.[pos]) : undefined;
        if (c) list.push({ card: c, hole });
      }
    }
    return list;
  };

  const openFan = (i: number, hole?: number) => {
    const items = earnedCardsFor(i);
    let initialIndex = 0;
    if (hole != null) {
      const idx = items.findIndex((it) => it.hole === hole);
      if (idx >= 0) initialIndex = idx;
    }
    setFan({ name: players[i], items, initialIndex, playerIdx: i });
  };

  // Tapping a per-hole number: a failed (0) challenge opens the correction view; otherwise the fan.
  const onCellPress = (i: number, hole: number) => {
    if (!isPlayed(hole, i)) return;
    if (!matchup[hole] && results[hole]?.[i] === 'failed') {
      const pos = assignment[hole]?.[i];
      const card = pos != null ? cardById(holeCards[hole]?.[pos]) : undefined;
      if (card) {
        setFailed({ playerIdx: i, hole, card });
        return;
      }
    }
    openFan(i, hole);
  };

  const endRound = () => {
    Alert.alert('End round?', 'What would you like to do?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard & exit', style: 'destructive', onPress: () => reset() },
      {
        text: noPokerDeck ? 'End & See Results' : 'End & Play Poker',
        onPress: () => goTo('results', 'push'),
      },
    ]);
  };

  const renderBlock = (startHole: number, totalLabel: string) => {
    const blockHoles = Array.from({ length: 9 }, (_, k) => startHole + k).filter(
      (h) => h <= holes
    );
    return (
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          <View style={[styles.cell, styles.labelCell]}>
            <Text style={styles.headerText}>HOLE</Text>
          </View>
          {blockHoles.map((h) => (
            <View key={h} style={styles.cell}>
              <Text style={styles.headerText}>{h}</Text>
            </View>
          ))}
          <View style={[styles.cell, styles.totalCell]}>
            <Text style={styles.headerText}>{totalLabel}</Text>
          </View>
        </View>

        {players.map((name, i) => {
          const blockTotal = blockHoles.reduce((sum, h) => sum + countFor(h, i), 0);
          return (
            <View key={i} style={styles.row}>
              <Pressable style={[styles.cell, styles.labelCell]} onPress={() => openFan(i)}>
                <Text style={styles.initialText}>{initialOf(name)}</Text>
              </Pressable>
              {blockHoles.map((h) => (
                <Pressable key={h} style={styles.cell} onPress={() => onCellPress(i, h)}>
                  <Text style={styles.cellText}>{isPlayed(h, i) ? countFor(h, i) : '·'}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.cell, styles.totalCell]} onPress={() => openFan(i)}>
                <Text style={styles.totalText}>{blockTotal}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Scorecard" onBack={() => goTo(scorecardReturn, 'pop')} />
        <Text style={styles.subtitle}>Poker cards earned per hole</Text>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {renderBlock(1, holes === 18 ? 'OUT' : 'TOT')}
          {holes === 18 ? renderBlock(10, 'IN') : null}

          <View style={styles.golferGrid}>
            {players.map((name, i) => {
              const g = GOLFERS[avatars[i] ?? i] ?? GOLFERS[0];
              const count = pokerCardCount(i);
              const cellW = (width - spacing.lg * 2 - spacing.md) / 2;
              const gh = Math.min(cellW * 0.7, 96);
              return (
                <Pressable key={i} onPress={() => openFan(i)} style={[styles.golferCell, { width: cellW }]}>
                  <Image
                    source={g.source}
                    resizeMode="contain"
                    style={{ width: gh * g.ratio, height: gh }}
                  />
                  <Text style={styles.golferName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.golferCount}>
                    {count} {count === 1 ? 'card' : 'cards'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {showEndRound ? (
          <View style={styles.footer}>
            <PrimaryButton label="End Round" variant="danger" onPress={endRound} style={styles.footerBtn} />
          </View>
        ) : null}
      </SafeAreaView>

      {fan ? (
        <FanView
          name={fan.name}
          items={fan.items}
          initialIndex={fan.initialIndex}
          onClose={() => setFan(null)}
          onIncorrect={(hole) => {
            // Undo the earn: clear a matchup win, or flip a normal hole to failed.
            if (matchup[hole]) setHoleMatchupWinner(hole, null);
            else setHoleResult(hole, fan.playerIdx, 'failed');
          }}
        />
      ) : null}

      {failed ? (
        <FailedCardView
          name={players[failed.playerIdx]}
          card={failed.card}
          hole={failed.hole}
          onConfirmAchieved={() => {
            setHoleResult(failed.hole, failed.playerIdx, 'achieved');
            setFailed(null);
          }}
          onClose={() => setFailed(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // chips
  chipsRow: { flexDirection: 'row', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipInitial: { color: colors.gold, fontSize: 13, fontWeight: '900' },
  chipCount: { color: colors.text, fontSize: 13, fontWeight: '700' },

  // overlay
  screen: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    paddingHorizontal: spacing.lg,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },

  // table
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  headerRow: { backgroundColor: colors.bgElevated },
  cell: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  labelCell: { flex: 0, width: 46 },
  totalCell: { flex: 0, width: 46, borderRightWidth: 0, backgroundColor: colors.bgElevated },
  headerText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  initialText: { color: colors.gold, fontSize: 14, fontWeight: '900' },
  cellText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  totalText: { color: colors.gold, fontSize: 14, fontWeight: '900' },

  // golfer totals (2×2)
  golferGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: spacing.md,
  },
  golferCell: { alignItems: 'center', gap: 2 },
  golferName: { color: colors.text, fontSize: 15, fontWeight: '800', maxWidth: '100%' },
  golferCount: { color: colors.gold, fontSize: 15, fontWeight: '900' },

  // footer
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  footerBtn: { flex: 1 },
});
