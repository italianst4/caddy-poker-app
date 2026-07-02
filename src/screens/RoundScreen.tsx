import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { SelectTile } from '../components/SelectTile';
import { CardBack } from '../components/CardBack';
import { CardArt } from '../components/CardArt';
import { FlipCard } from '../components/FlipCard';
import { CardViewer } from '../components/CardViewer';
import { Celebration } from '../components/Celebration';
import { SlideUpFooter } from '../components/SlideUpFooter';
import { ScoreChips } from '../components/Scorecard';
import { AchievementOverlay, type Rect } from '../components/AchievementOverlay';
import { CardBurst } from '../components/CardBurst';
import { useGame, MATCHUP_REWARD } from '../store/gameStore';
import { cardById, isMatchup, type Card } from '../data/cards';
import { buildHoleMessage } from '../data/holeMessages';
import { CARD_RATIO, colors, radius, spacing } from '../theme';

/** Measure a node's position/size in window coordinates (for the fly-to-chip animation). */
function measureNode(node: View | null): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!node) return resolve(null);
    node.measureInWindow((x, y, w, h) => resolve({ x, y, width: w, height: h }));
  });
}

// One independent scoring animation. Each gets a unique id so several can play at once
// (e.g. when the user taps multiple ✓/✕ quickly) without overwriting each other.
type ScoreEffect =
  | { id: number; kind: 'achieve'; card: Card; from: Rect; to: Rect; message: string }
  | { id: number; kind: 'burst'; card: Card; rect: Rect };

export function RoundScreen() {
  const phase = useGame((s) => s.phase);

  if (phase === 'pick') return <PickPhase />;
  if (phase === 'transition') return <TransitionPhase />;
  if (phase === 'matchup') return <MatchupPhase />;
  return <ScorePhase />;
}

/* ------------------------------------------------------------------ */
/* Pick phase: face-down backs, each player takes a turn to pick one.  */
/* ------------------------------------------------------------------ */
function PickPhase() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const currentHole = useGame((s) => s.currentHole);
  const pickTurn = useGame((s) => s.pickTurn);
  const pickOrder = useGame((s) => s.pickOrder);
  const holeCards = useGame((s) => s.holeCards);
  const assignment = useGame((s) => s.assignment);
  const pickCard = useGame((s) => s.pickCard);
  const redrawCard = useGame((s) => s.redrawCard);
  const advanceTurn = useGame((s) => s.advanceTurn);
  const triggerMatchup = useGame((s) => s.triggerMatchup);
  const viewScorecard = useGame((s) => s.viewScorecard);

  const [revealed, setRevealed] = useState<number | null>(null);

  const cards = holeCards[currentHole] ?? [];
  const currentPlayer = players[pickOrder[pickTurn] ?? pickTurn];
  // Compute locally (NOT via a store selector) — returning a fresh array from a selector
  // would change identity every render and trigger an infinite update loop in zustand v5.
  const holeAssign = assignment[currentHole] ?? {};
  const pickedPositions = Object.values(holeAssign);
  // Reverse map: which player picked each position (to label the revealed card).
  const positionToPlayer: Record<number, number> = {};
  for (const [playerIdx, position] of Object.entries(holeAssign)) {
    positionToPlayer[position] = Number(playerIdx);
  }

  // 2-column grid; sized to fill the available real-estate.
  const cols = 2;
  const gap = spacing.md;
  const horizontalPad = spacing.lg * 2;
  const cardWidth = (width - horizontalPad - gap * (cols - 1)) / cols;

  const onPick = (position: number) => {
    pickCard(position);
    setRevealed(position);
  };

  const onDismissReveal = () => {
    const card = revealed != null ? cardById(cards[revealed]) : undefined;
    setRevealed(null);
    // Accepting a matchup card turns the whole hole into a single head-to-head.
    if (card && isMatchup(card)) {
      triggerMatchup(card.id);
    } else {
      advanceTurn();
    }
  };

  const onRedraw = () => {
    if (revealed != null) redrawCard(revealed);
  };

  const revealedCard = revealed != null ? cardById(cards[revealed]) : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.pickHeader}>
        <View style={styles.pickChips}>
          <ScoreChips onPress={() => viewScorecard('round')} />
        </View>

        <Text style={styles.holeLabel}>HOLE</Text>
        <Text style={styles.holeNumber}>#{currentHole}</Text>
        <View style={styles.turnBanner}>
          <Text style={styles.turnText}>
            <Text style={styles.turnName}>{currentPlayer}</Text>, pick a card
          </Text>
          <Text style={styles.turnProgress}>
            Player {pickTurn + 1} of {players.length}
          </Text>
        </View>
      </View>

      <View style={[styles.grid, { gap }]}>
        {cards.map((cardId, position) => {
          const isPicked = pickedPositions.includes(position);
          if (isPicked) {
            const card = cardById(cardId);
            const ownerName = players[positionToPlayer[position]];
            return (
              <View key={position} style={[styles.pickedCell, { width: cardWidth }]}>
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
              onPress={() => onPick(position)}
              style={{ width: cardWidth }}
            />
          );
        })}
      </View>

      {revealedCard ? (
        <FlipCard
          key={revealedCard.id} // remount on re-draw so the flip animation replays
          card={revealedCard}
          playerName={currentPlayer}
          onDismiss={onDismissReveal}
          onRedraw={onRedraw}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Transition: all cards picked, head to the tee box.                 */
/* ------------------------------------------------------------------ */
function TransitionPhase() {
  const currentHole = useGame((s) => s.currentHole);
  const beginScoring = useGame((s) => s.beginScoring);

  return (
    <ScreenLayout
      footer={<PrimaryButton label="Continue" onPress={beginScoring} />}
    >
      <View style={styles.transitionCenter}>
        <Text style={styles.transitionFlag}>⛳</Text>
        <Text style={styles.transitionTitle}>Challenges are set!</Text>
        <Text style={styles.transitionSub}>Head to the Hole #{currentHole} tee box!</Text>
      </View>
    </ScreenLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Matchup phase: the whole group competes for one card; pick a winner. */
/* ------------------------------------------------------------------ */
function MatchupPhase() {
  const { width } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const currentHole = useGame((s) => s.currentHole);
  const holes = useGame((s) => s.holes);
  const matchup = useGame((s) => s.matchup);
  const setMatchupWinner = useGame((s) => s.setMatchupWinner);
  const nextHole = useGame((s) => s.nextHole);
  const viewScorecard = useGame((s) => s.viewScorecard);

  const [celebration, setCelebration] = useState<string | null>(null);

  const info = matchup[currentHole];
  const card = info ? cardById(info.cardId) : undefined;
  const winner = info?.winner ?? null;
  const isLastHole = currentHole >= holes;

  const cardWidth = Math.min(width * 0.42, 180);

  const onSelectWinner = (i: number) => {
    setMatchupWinner(i);
    if (winner !== i) {
      setCelebration(`${players[i]} earned ${MATCHUP_REWARD} poker cards!`);
    }
  };

  return (
    <View style={styles.safe}>
      <ScreenLayout
        title="Matchup!"
        subtitle={`Winner earns ${MATCHUP_REWARD} poker cards.`}
        scroll
        headerRight={<ScoreChips onPress={() => viewScorecard('round')} />}
      >
        <View style={styles.matchupTop}>
          {card ? <CardArt card={card} style={{ width: cardWidth }} /> : null}
          <Text style={styles.matchupPrompt}>Who won the matchup?</Text>
        </View>

        <View style={styles.matchupList}>
          {players.map((name, i) => (
            <SelectTile
              key={i}
              label={name}
              compact
              selected={winner === i}
              onPress={() => onSelectWinner(i)}
            />
          ))}
        </View>
        {/* Clearance so the list isn't hidden behind the slide-up footer. */}
        <View style={{ height: 76 }} />
      </ScreenLayout>

      {/* Next Hole slides up once a winner has been picked. */}
      <SlideUpFooter visible={winner != null}>
        <PrimaryButton
          label={isLastHole ? 'See Results' : 'Next Hole'}
          onPress={nextHole}
        />
      </SlideUpFooter>

      {celebration ? (
        <Celebration message={celebration} onDone={() => setCelebration(null)} />
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Score phase: mark each player's challenge Achieved / Failed.        */
/* ------------------------------------------------------------------ */
function ScorePhase() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const currentHole = useGame((s) => s.currentHole);
  const holes = useGame((s) => s.holes);
  const holeCards = useGame((s) => s.holeCards);
  const assignment = useGame((s) => s.assignment);
  const results = useGame((s) => s.results);
  const markResult = useGame((s) => s.markResult);
  const nextHole = useGame((s) => s.nextHole);
  const viewScorecard = useGame((s) => s.viewScorecard);

  const [viewing, setViewing] = useState<number | null>(null);
  const [effects, setEffects] = useState<ScoreEffect[]>([]);

  const chipRefs = useRef<Record<number, View | null>>({});
  const cardRefs = useRef<Record<number, View | null>>({});
  const effectId = useRef(0);

  const removeEffect = (id: number) => setEffects((prev) => prev.filter((e) => e.id !== id));

  const cards = holeCards[currentHole] ?? [];
  const holeAssign = assignment[currentHole] ?? {};
  const holeResults = results[currentHole] ?? {};
  const allScored = players.every((_, i) => holeResults[i] != null);
  const isLastHole = currentHole >= holes;

  // Show the end-of-hole message (and Next button) a beat after the last card is marked.
  const [showEnd, setShowEnd] = useState(false);
  useEffect(() => {
    if (!allScored) {
      setShowEnd(false);
      return;
    }
    const id = setTimeout(() => setShowEnd(true), 1000);
    return () => clearTimeout(id);
  }, [allScored, currentHole]);

  // 2-column grid. Size cards to fit the available height so 3–4 players (two rows)
  // don't require scrolling; 1 row (2 players) keeps the full width-based size.
  const gap = spacing.md;
  const rows = Math.ceil(players.length / 2);
  const widthCap = (width - spacing.lg * 2 - gap) / 2;
  const FIXED_RESERVED = 240; // header + safe area + slide-up footer clearance
  const PER_ROW_CHROME = 88; // name + buttons + gaps for each row
  const cardHeightEach = (height - FIXED_RESERVED - PER_ROW_CHROME * rows) / rows;
  const heightCap = cardHeightEach * CARD_RATIO;
  const cardWidth = Math.max(110, Math.min(widthCap, heightCap));
  // Fixed cell footprint so a cleared cell leaves its slot empty (others don't move).
  const cellHeight = Math.round(cardWidth / CARD_RATIO) + 19 + 34 + spacing.sm * 2 + 4;

  // Cheeky end-of-hole message, chosen once per hole when every card is cleared.
  const summary = useMemo(() => {
    if (!allScored) return null;
    const winners = players.filter((_, i) => holeResults[i] === 'achieved');
    const losers = players.filter((_, i) => holeResults[i] === 'failed');
    return buildHoleMessage(winners, losers, players);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allScored, currentHole]);

  const viewingCard =
    viewing != null && holeAssign[viewing] != null
      ? cardById(cards[holeAssign[viewing]])
      : undefined;

  const onAchieved = (i: number) => {
    if (holeResults[i] != null) return;

    const card = holeAssign[i] != null ? cardById(cards[holeAssign[i]]) : undefined;
    // Measure the card/chip while the cell is still on screen, THEN mark achieved
    // (which removes the cell) and launch the fly-to-chip animation in the same commit.
    Promise.all([measureNode(cardRefs.current[i]), measureNode(chipRefs.current[i])]).then(
      ([from, to]) => {
        markResult(i, 'achieved');
        if (card && from && to && from.width > 0 && to.width > 0) {
          const id = effectId.current++;
          setEffects((prev) => [
            ...prev,
            { id, kind: 'achieve', card, from, to, message: `${players[i]} earned 1 poker card!` },
          ]);
        }
      }
    );
  };

  const onFailed = (i: number) => {
    if (holeResults[i] != null) return;

    const card = holeAssign[i] != null ? cardById(cards[holeAssign[i]]) : undefined;
    // Measure first, then mark failed (removes the cell) and explode the card in place.
    measureNode(cardRefs.current[i]).then((rect) => {
      markResult(i, 'failed');
      if (card && rect && rect.width > 0) {
        const id = effectId.current++;
        setEffects((prev) => [...prev, { id, kind: 'burst', card, rect }]);
      }
    });
  };

  return (
    <View style={styles.safe}>
      <ScreenLayout
        title={`Hole #${currentHole}`}
        subtitle="Who completed their challenge?"
        scroll
        headerRight={<ScoreChips onPress={() => viewScorecard('round')} chipRefs={chipRefs} />}
      >
        {!allScored ? (
          <View style={[styles.scoreGrid, { gap }]}>
            {players.map((name, i) => {
              const position = holeAssign[i];
              const card = position != null ? cardById(cards[position]) : undefined;
              if (!card) return null;
              // A cleared card leaves an empty slot of the same size so the others stay put.
              if (holeResults[i] != null) {
                return (
                  <View key={i} style={[styles.scoreCell, { width: cardWidth, minHeight: cellHeight }]} />
                );
              }
              return (
                <View key={i} style={[styles.scoreCell, { width: cardWidth, minHeight: cellHeight }]}>
                  <Text style={styles.scoreName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Pressable
                    ref={(node) => {
                      cardRefs.current[i] = node;
                    }}
                    onPress={() => setViewing(i)}
                    style={styles.fill}
                  >
                    <CardArt card={card} style={styles.fill} />
                  </Pressable>
                  <View style={styles.scoreButtonsRow}>
                    <Pressable
                      onPress={() => onAchieved(i)}
                      style={({ pressed }) => [styles.markBtn, styles.markAchieved, pressed && styles.markPressed]}
                    >
                      <Text style={styles.markGlyph}>✓</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onFailed(i)}
                      style={({ pressed }) => [styles.markBtn, styles.markFailed, pressed && styles.markPressed]}
                    >
                      <Text style={styles.markGlyph}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : showEnd && summary ? (
          <Animated.View
            entering={FadeInDown.duration(450)}
            style={[styles.summary, { marginTop: height * 0.34 }]}
          >
            <Text style={styles.summaryEmoji}>{summary.emoji}</Text>
            <Text style={styles.summaryText}>{summary.text}</Text>
          </Animated.View>
        ) : null}
        {/* Clearance so the last row isn't hidden behind the slide-up footer. */}
        <View style={{ height: 76 }} />
      </ScreenLayout>

      {/* Next Hole slides up shortly after every card is marked. */}
      <SlideUpFooter visible={showEnd}>
        <PrimaryButton
          label={isLastHole ? 'See Results' : 'Next Hole'}
          onPress={nextHole}
        />
      </SlideUpFooter>

      {/* Overlays live OUTSIDE ScreenLayout so they cover the header/footer too. */}
      {viewing != null && viewingCard ? (
        <CardViewer
          card={viewingCard}
          playerName={players[viewing]}
          onDismiss={() => setViewing(null)}
        />
      ) : null}

      {/* Each effect is independent, so several can animate at once. */}
      {effects.map((e) =>
        e.kind === 'achieve' ? (
          <AchievementOverlay
            key={e.id}
            card={e.card}
            from={e.from}
            to={e.to}
            message={e.message}
            onDone={() => removeEffect(e.id)}
          />
        ) : (
          <CardBurst key={e.id} card={e.card} rect={e.rect} onDone={() => removeEffect(e.id)} />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  // pick phase
  pickChips: {
    position: 'absolute',
    top: spacing.lg + spacing.xs, // align with ScreenLayout's headerRight on the scoring view
    right: spacing.lg,
    zIndex: 2,
  },
  pickHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  holeLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
  },
  holeNumber: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  turnBanner: {
    marginTop: spacing.sm,
    alignItems: 'flex-start',
  },
  turnText: { color: colors.text, fontSize: 34, fontWeight: '600' },
  turnName: { color: colors.gold, fontWeight: '900' },
  turnProgress: { color: colors.textMuted, fontSize: 18, marginTop: 2 },
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
  pickedCell: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  fill: {
    width: '100%',
  },
  hidden: {
    opacity: 0,
  },
  pickedName: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '100%',
  },

  // transition
  transitionCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitionFlag: { fontSize: 84, marginBottom: spacing.md },
  transitionTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  transitionSub: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // matchup phase
  matchupTop: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  matchupPrompt: { color: colors.text, fontSize: 18, fontWeight: '800' },
  matchupList: { gap: spacing.sm, marginTop: spacing.md },

  // score phase
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  scoreCell: { alignItems: 'center', gap: spacing.sm },
  scoreName: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '800',
    maxWidth: '100%',
  },
  scoreButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'stretch',
  },
  summary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  summaryEmoji: { fontSize: 64 },
  summaryText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
  },
  markBtn: {
    flex: 1,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  markAchieved: { backgroundColor: colors.success },
  markFailed: { backgroundColor: colors.danger },
  markDim: { opacity: 0.35 },
  markSelected: { borderColor: colors.white },
  markPressed: { opacity: 0.8 },
  markGlyph: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
});
