import { useEffect, useState, type ReactNode } from 'react';
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
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { CardBack } from '../components/CardBack';
import { CardArt } from '../components/CardArt';
import { FlipCard } from '../components/FlipCard';
import { Celebration } from '../components/Celebration';
import { PokerCardView } from '../components/PokerCardView';
import { RectSparkles } from '../components/Sparkles';
import { HandRankGuide } from '../components/HandRankGuide';
import { GOLFERS, MAX_GOLFER_RATIO } from '../data/golfers';
import { CADDY_BACK, caddyById, caddyEffect } from '../data/caddyCards';
import {
  evaluateHand,
  pickWinners,
  isWildCard,
  RANK_VAL,
  type PokerCard,
  type Suit,
  type HandResult,
} from '../data/pokerDeck';
import { useGame } from '../store/gameStore';
import { playGolfCrowd } from '../sounds';
import { CARD_RATIO, colors, radius, spacing } from '../theme';

type SortMode = 'dealt' | 'rank' | 'suit';
const SUIT_ORDER: Record<Suit, number> = { S: 0, H: 1, D: 2, C: 3 };

/** Order the dealt cards for display (selection is tracked by id, so this is cosmetic). */
function sortHand(cards: PokerCard[], mode: SortMode): PokerCard[] {
  if (mode === 'dealt') return cards;
  const arr = cards.slice();
  if (mode === 'rank') {
    arr.sort((a, b) => RANK_VAL[b.rank] - RANK_VAL[a.rank] || SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit]);
  } else {
    arr.sort((a, b) => SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit] || RANK_VAL[b.rank] - RANK_VAL[a.rank]);
  }
  return arr;
}

export function PokerRoundScreen() {
  const pokerPhase = useGame((s) => s.pokerPhase);

  switch (pokerPhase) {
    case 'intro':
      return <IntroPhase />;
    case 'ready':
      return <ReadyPhase />;
    case 'caddy':
      return <CaddyPhase />;
    case 'deal':
    case 'select':
      return <SelectPhase />;
    case 'allIn':
      return <AllInPhase />;
    case 'reveal':
      return <RevealPhase />;
    default:
      return <IntroPhase />;
  }
}

/* ------------------------------------------------------------------ */
/* Intro — how it works                                               */
/* ------------------------------------------------------------------ */
function IntroPhase() {
  const beginPokerReady = useGame((s) => s.beginPokerReady);
  const includeCaddies = useGame((s) => s.includeCaddies);
  const steps = [
    'You’ll pass the phone to the player as instructed.',
    ...(includeCaddies
      ? ['The player will pick a Caddy Card. Caddy Cards help you improve your poker hand.']
      : []),
    'The player will be dealt the number of poker cards they earned.',
    'The player will lock in their poker hand.',
  ];
  return (
    <ScreenLayout
      title="How this works"
      scroll
      footer={<PrimaryButton label="Start" onPress={beginPokerReady} />}
    >
      {steps.map((text, i) => (
        <View key={i} style={styles.step}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{text}</Text>
        </View>
      ))}
      <Text style={styles.finale}>
        Once everyone has locked in their hand, we'll reveal the winner! 🃏
      </Text>
    </ScreenLayout>
  );
}

/* ------------------------------------------------------------------ */
/* Ready — "Are you ready NAME?"                                      */
/* ------------------------------------------------------------------ */
function ReadyPhase() {
  const players = useGame((s) => s.players);
  const pokerTurn = useGame((s) => s.pokerTurn);
  const pokerReady = useGame((s) => s.pokerReady);
  const name = players[pokerTurn] ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <Text style={styles.passNote}>Pass the phone to</Text>
        <Text style={styles.readyName}>{name}</Text>
        <Text style={styles.readyPrompt}>Are you ready, {name}?</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Yes, I'm ready" onPress={pokerReady} />
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Caddy pick — the shared 3×3 grid                                   */
/* ------------------------------------------------------------------ */
function CaddyPhase() {
  const { width } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const pokerTurn = useGame((s) => s.pokerTurn);
  const caddyCards = useGame((s) => s.caddyCards);
  const pokerCaddyAssignment = useGame((s) => s.pokerCaddyAssignment);
  const pickPokerCaddy = useGame((s) => s.pickPokerCaddy);

  const [revealed, setRevealed] = useState<number | null>(null);
  const name = players[pokerTurn] ?? '';

  // Positions already taken by earlier players keep their spot as a blank placeholder
  // (labelled with the owner's name) — the picked caddy card itself is never revealed.
  const takenBy: Record<number, number> = {};
  for (const [playerIdx, pos] of Object.entries(pokerCaddyAssignment)) takenBy[pos] = Number(playerIdx);

  const cols = 3;
  const gap = spacing.sm;
  const cardWidth = (width - spacing.lg * 2 - gap * (cols - 1)) / cols;

  const revealedCard = revealed != null ? caddyById(caddyCards[revealed]) : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.caddyHeader}>
        <Text style={styles.label}>PICK YOUR CADDY</Text>
        <Text style={styles.turnText}>
          <Text style={styles.turnName}>{name}</Text>, pick a caddy
        </Text>
      </View>

      <View style={[styles.grid, { gap }]}>
        {caddyCards.map((cardId, position) => {
          const owner = takenBy[position];
          if (owner != null) {
            return (
              <View
                key={position}
                style={[styles.caddyPlaceholder, { width: cardWidth, height: cardWidth / CARD_RATIO }]}
              >
                <Text style={styles.caddyPlaceholderName} numberOfLines={2}>
                  {players[owner]}
                </Text>
              </View>
            );
          }
          return (
            <CardBack
              key={position}
              source={CADDY_BACK}
              onPress={() => setRevealed(position)}
              style={{ width: cardWidth }}
            />
          );
        })}
      </View>

      {revealedCard ? (
        <FlipCard
          key={revealedCard.id}
          card={revealedCard}
          playerName={name}
          back={CADDY_BACK}
          acceptLabel="Deal my cards"
          onDismiss={() => {
            const pos = revealed!;
            setRevealed(null);
            pickPokerCaddy(pos);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Deal + select — tap up to 5, then lock in                          */
/* ------------------------------------------------------------------ */
function SelectPhase() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const pokerTurn = useGame((s) => s.pokerTurn);
  const caddyCards = useGame((s) => s.caddyCards);
  const pokerCaddyAssignment = useGame((s) => s.pokerCaddyAssignment);
  const pokerHands = useGame((s) => s.pokerHands);
  const pokerSelection = useGame((s) => s.pokerSelection);
  const pokerMulliganOffer = useGame((s) => s.pokerMulliganOffer);
  const dealPokerCards = useGame((s) => s.dealPokerCards);
  const togglePokerCard = useGame((s) => s.togglePokerCard);
  const keepMulliganCard = useGame((s) => s.keepMulliganCard);
  const lockPokerHand = useGame((s) => s.lockPokerHand);

  const [caddyZoom, setCaddyZoom] = useState(false);
  const [showRanks, setShowRanks] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('dealt');

  const name = players[pokerTurn] ?? '';
  const hand = pokerHands[pokerTurn];
  const selected = pokerSelection[pokerTurn] ?? [];
  const effect = caddyEffect(caddyCards[pokerCaddyAssignment[pokerTurn]]);
  const caddyCard = caddyById(caddyCards[pokerCaddyAssignment[pokerTurn]]);

  // Deal on first mount of this player's select screen (store guards against re-dealing).
  useEffect(() => {
    if (!hand) dealPokerCards();
  }, [hand, dealPokerCards]);

  if (!hand) {
    return <SafeAreaView style={styles.safe} />;
  }

  // Card sizing: fit up to 6 per row with overlap.
  const availW = width - spacing.lg * 2;
  const cardW = Math.min(availW / 3.4, 96);
  const cardH = cardW / CARD_RATIO;

  const displayHand = sortHand(hand, sortMode);
  const rows: PokerCard[][] = [];
  for (let i = 0; i < displayHand.length; i += 6) rows.push(displayHand.slice(i, i + 6));

  const selectionCount = selected.length;
  const caddyW = Math.min(width * 0.16, 70);
  const offer = pokerMulliganOffer[pokerTurn];
  const offerW = Math.min(width * 0.32, 130);

  // Live best hand for the current selection, and whether the caddy effect is helping it.
  const selectedCards = selected
    .map((id) => hand.find((c) => c.id === id))
    .filter((c): c is PokerCard => !!c);
  const bestHand = selectedCards.length ? evaluateHand(selectedCards, effect) : null;
  const caddyUsed =
    !!bestHand &&
    (selectedCards.some((c) => isWildCard(c, effect)) ||
      evaluateHand(selectedCards, { kind: 'none' }).cat < bestHand.cat);

  const zoomW = Math.min(width * 0.78, height * 0.6 * CARD_RATIO);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.selectHeader}>
        <View style={styles.selectHeaderText}>
          <Text style={styles.turnText}>
            <Text style={styles.turnName}>{name}</Text>, make your hand
          </Text>
          <Text style={styles.selectHint}>Tap up to 5 cards ({selectionCount}/5)</Text>
        </View>
        {caddyCard ? (
          <Pressable onPress={() => setCaddyZoom(true)} style={{ width: caddyW }}>
            <CaddyGlow active={caddyUsed} width={caddyW}>
              <CardArt card={caddyCard} style={{ width: caddyW, borderRadius: 5 }} />
            </CaddyGlow>
            <Text style={[styles.caddyTag, caddyUsed && styles.caddyTagActive]} numberOfLines={1}>
              {caddyUsed ? 'In use ✦' : 'Caddy'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>
        {(['rank', 'suit'] as const).map((mode) => {
          const active = sortMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setSortMode(active ? 'dealt' : mode)}
              style={({ pressed }) => [styles.sortChip, active && styles.sortChipActive, pressed && styles.pressed]}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                {mode === 'rank' ? 'Rank' : 'Suit'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.handScroll} showsVerticalScrollIndicator={false}>
        {rows.map((row, r) => {
          const overlap = row.length > 1 ? Math.min(cardW * 0.62, (availW - cardW) / (row.length - 1)) : 0;
          const rowW = cardW + (row.length - 1) * overlap;
          return (
            <View key={r} style={{ height: cardH + 24, width: rowW, marginBottom: spacing.md }}>
              {row.map((card, i) => {
                const globalIdx = r * 6 + i;
                const isSelected = selected.includes(card.id);
                const cardWild = isWildCard(card, effect);
                // Natural stacking order (each card overlaps the previous). Selecting a card
                // only raises it vertically — it stays tucked under the cards that overlap it.
                return (
                  <Animated.View
                    key={card.id}
                    entering={FadeInDown.duration(320).delay(globalIdx * 60)}
                    style={{
                      position: 'absolute',
                      left: i * overlap,
                      top: isSelected ? 0 : 20,
                      zIndex: i,
                    }}
                  >
                    <PokerCardView
                      card={card}
                      width={cardW}
                      selected={isSelected}
                      wild={cardWild}
                      onPress={() => togglePokerCard(card.id)}
                    />
                  </Animated.View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTopRow}>
          <Pressable
            onPress={() => setShowRanks(true)}
            style={({ pressed }) => [styles.ranksBtn, pressed && styles.ranksBtnPressed]}
          >
            <Text style={styles.ranksBtnText}>See hand ranks</Text>
          </Pressable>
          <View style={styles.bestHandWrap}>
            <Text style={styles.bestHandLabel}>Your hand</Text>
            <Text style={styles.bestHandName} numberOfLines={1}>
              {bestHand ? bestHand.name : '—'}
            </Text>
          </View>
        </View>
        <PrimaryButton
          label="Lock in your hand"
          onPress={lockPokerHand}
          disabled={selectionCount === 0}
        />
      </View>

      {offer ? (
        <View style={styles.offerOverlay}>
          <Text style={styles.offerTitle}>Mulligan Draw</Text>
          <Text style={styles.offerSub}>Keep one of these cards</Text>
          <View style={styles.offerRow}>
            {offer.map((card) => (
              <PokerCardView
                key={card.id}
                card={card}
                width={offerW}
                onPress={() => keepMulliganCard(card.id)}
                style={{ marginHorizontal: spacing.sm }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {caddyZoom && caddyCard ? (
        <Pressable style={styles.zoomOverlay} onPress={() => setCaddyZoom(false)}>
          <Animated.View entering={ZoomIn.duration(240)} style={{ width: zoomW }}>
            <CardArt card={caddyCard} style={{ width: zoomW }} />
          </Animated.View>
          <View style={styles.zoomClose}>
            <PrimaryButton label="Close" variant="secondary" onPress={() => setCaddyZoom(false)} />
          </View>
        </Pressable>
      ) : null}

      {showRanks ? <HandRankGuide onClose={() => setShowRanks(false)} /> : null}
    </SafeAreaView>
  );
}

/** Wraps the caddy card with a pulsing gold glow while its effect is helping the hand. */
/** Wraps the caddy card with tiny sparkles orbiting its perimeter while it's helping the hand. */
function CaddyGlow({ active, width, children }: { active: boolean; width: number; children: ReactNode }) {
  return (
    <View style={{ width }}>
      {children}
      {active ? <RectSparkles width={width} height={width / CARD_RATIO} /> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* All hands in                                                       */
/* ------------------------------------------------------------------ */
function AllInPhase() {
  const revealPoker = useGame((s) => s.revealPoker);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <Text style={styles.allInEmoji}>🃏</Text>
        <Text style={styles.readyName}>Everyone's hands are in</Text>
        <Text style={styles.bodyMuted}>Ready to reveal the winner?</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton label="Reveal Winner" onPress={revealPoker} />
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal — winner + hand, others below                               */
/* ------------------------------------------------------------------ */
function RevealPhase() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const avatars = useGame((s) => s.avatars);
  const caddyCards = useGame((s) => s.caddyCards);
  const pokerCaddyAssignment = useGame((s) => s.pokerCaddyAssignment);
  const pokerHands = useGame((s) => s.pokerHands);
  const pokerSelection = useGame((s) => s.pokerSelection);
  const pokerCardCount = useGame((s) => s.pokerCardCount);
  const reset = useGame((s) => s.reset);

  const [showConfetti, setShowConfetti] = useState(true);
  const [zoomCaddyId, setZoomCaddyId] = useState<string | null>(null);

  // Crowd cheer on the winner reveal.
  useEffect(() => {
    playGolfCrowd();
  }, []);

  // Participants = players who earned ≥1 card. Evaluate each locked hand.
  const participants = players
    .map((_, i) => i)
    .filter((i) => pokerCardCount(i) > 0);

  const selectedCardsFor = (idx: number): PokerCard[] => {
    const hand = pokerHands[idx] ?? [];
    const ids = pokerSelection[idx] ?? [];
    return ids.map((id) => hand.find((c) => c.id === id)).filter((c): c is PokerCard => !!c);
  };

  const results: Record<number, HandResult> = {};
  for (const idx of participants) {
    const effect = caddyEffect(caddyCards[pokerCaddyAssignment[idx]]);
    results[idx] = evaluateHand(selectedCardsFor(idx), effect);
  }

  const orderedResults = participants.map((idx) => results[idx]);
  const winnerLocal = pickWinners(orderedResults);
  const winners = new Set(winnerLocal.map((li) => participants[li]));
  const losers = participants.filter((i) => !winners.has(i));

  const onGameOver = () => {
    Alert.alert('Game over?', 'Return to the main menu?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Game Over', onPress: () => reset() },
    ]);
  };

  const winnerCardW = Math.min(width / 6.5, 70);
  const winCellH = Math.min(width * 0.26, 130);
  const loseCellH = Math.min(width * 0.14, 74);
  const zoomW = Math.min(width * 0.78, height * 0.6 * CARD_RATIO);
  const zoomCaddy = zoomCaddyId ? caddyById(zoomCaddyId) : undefined;

  return (
    <View style={styles.flex}>
      <ScreenLayout
        scroll
        footer={<PrimaryButton label="Game Over" onPress={onGameOver} />}
      >
        <Text style={styles.revealTitle}>{winners.size > 1 ? "It's a tie!" : 'Winner!'}</Text>
        {[...winners].map((idx) => {
          const g = GOLFERS[avatars[idx] ?? idx] ?? GOLFERS[0];
          const cards = selectedCardsFor(idx);
          const effect = caddyEffect(caddyCards[pokerCaddyAssignment[idx]]);
          // The caddy card is "in use" if it made a card wild or improved the hand's rank.
          const caddyUsed =
            cards.some((c) => isWildCard(c, effect)) ||
            evaluateHand(cards, { kind: 'none' }).cat < results[idx].cat;
          const caddyCard = caddyById(caddyCards[pokerCaddyAssignment[idx]]);
          return (
            <View key={idx} style={styles.winnerBlock}>
              <Text style={styles.crown}>👑</Text>
              <Image
                source={g.source}
                resizeMode="contain"
                style={{ width: winCellH * g.ratio, height: winCellH }}
              />
              <Text style={styles.winnerName}>{players[idx]}</Text>
              <Text style={styles.handName}>{results[idx].name}</Text>
              <View style={styles.handRow}>
                {cards.map((card) => (
                  <PokerCardView
                    key={card.id}
                    card={card}
                    width={winnerCardW}
                    wild={isWildCard(card, effect)}
                    style={{ marginHorizontal: 2 }}
                  />
                ))}
                {/* The winner's caddy card sits inline with the played cards; tap to zoom. */}
                {caddyUsed && caddyCard ? (
                  <Pressable
                    onPress={() => setZoomCaddyId(caddyCard.id)}
                    style={({ pressed }) => [styles.winnerCaddy, pressed && styles.pressed]}
                  >
                    <CardArt card={caddyCard} style={{ width: winnerCardW, borderRadius: 4 }} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}

        {losers.length > 0 ? (
          <>
            <Text style={styles.othersLabel}>Other hands</Text>
            <View style={styles.losers}>
              {losers.map((idx) => {
                const g = GOLFERS[avatars[idx] ?? idx] ?? GOLFERS[0];
                return (
                  <View key={idx} style={styles.loserCell}>
                    <Image
                      source={g.source}
                      resizeMode="contain"
                      style={{ width: loseCellH * g.ratio, height: loseCellH }}
                    />
                    <Text style={styles.loserName} numberOfLines={1}>
                      {players[idx]}
                    </Text>
                    <Text style={styles.loserHand} numberOfLines={1}>
                      {results[idx].name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}
      </ScreenLayout>

      {showConfetti ? (
        <Celebration
          message={winners.size > 1 ? "It's a tie!" : `${players[[...winners][0]]} wins!`}
          durationMs={10000}
          onDone={() => setShowConfetti(false)}
        />
      ) : null}

      {zoomCaddy ? (
        <Pressable style={styles.zoomOverlay} onPress={() => setZoomCaddyId(null)}>
          <Animated.View entering={ZoomIn.duration(240)} style={{ width: zoomW }}>
            <CardArt card={zoomCaddy} style={{ width: zoomW }} />
          </Animated.View>
          <View style={styles.zoomClose}>
            <PrimaryButton label="Close" variant="secondary" onPress={() => setZoomCaddyId(null)} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },

  body: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  bodyMuted: {
    color: colors.textMuted,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: colors.primaryText, fontSize: 16, fontWeight: '900' },
  stepText: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '600', lineHeight: 24, paddingTop: 3 },
  finale: {
    color: colors.gold,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    textAlign: 'center',
    marginTop: spacing.xl * 2,
  },

  passNote: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  readyName: { color: colors.gold, fontSize: 34, fontWeight: '900', textAlign: 'center', marginTop: spacing.xs },
  readyPrompt: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: spacing.lg, textAlign: 'center' },

  caddyHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  label: { color: colors.textMuted, fontSize: 14, fontWeight: '800', letterSpacing: 4 },
  turnText: { color: colors.text, fontSize: 22, fontWeight: '600', marginTop: spacing.xs },
  turnName: { color: colors.gold, fontWeight: '900' },
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
  caddyPlaceholder: {
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  caddyPlaceholderName: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },

  selectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  selectHeaderText: { flexShrink: 1 },
  selectHint: { color: colors.textMuted, fontSize: 15, marginTop: 2 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sortLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sortChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortChipText: { color: colors.textMuted, fontSize: 14, fontWeight: '800' },
  sortChipTextActive: { color: colors.primaryText },
  caddyTag: { color: colors.gold, fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 2 },
  caddyTagActive: { color: colors.primary },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  ranksBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ranksBtnPressed: { opacity: 0.6 },
  ranksBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  bestHandWrap: { flexShrink: 1, alignItems: 'flex-end' },
  bestHandLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  bestHandName: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  zoomOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,18,12,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  zoomClose: { marginTop: spacing.xl, minWidth: 160 },
  handScroll: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },

  allInEmoji: { fontSize: 64, marginBottom: spacing.md },

  offerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,18,12,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    paddingHorizontal: spacing.lg,
  },
  offerTitle: { color: colors.gold, fontSize: 26, fontWeight: '900' },
  offerSub: { color: colors.text, fontSize: 17, marginTop: spacing.xs, marginBottom: spacing.xl },
  offerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },

  revealTitle: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  winnerBlock: { alignItems: 'center', marginTop: spacing.md },
  crown: { fontSize: 30 },
  winnerName: { color: colors.gold, fontSize: 26, fontWeight: '900', marginTop: spacing.xs },
  winnerCaddy: { marginHorizontal: 2 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  handName: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.md },
  handRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 2 },
  othersLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  losers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.lg },
  loserCell: { alignItems: 'center', maxWidth: 100 },
  loserName: { color: colors.text, fontSize: 14, fontWeight: '800', maxWidth: '100%' },
  loserHand: { color: colors.textMuted, fontSize: 12, fontWeight: '600', maxWidth: '100%' },
});
