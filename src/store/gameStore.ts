import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDrawPool, drawDistinct, type GameMode } from '../data/cards';
import { drawCaddies, caddyEffect } from '../data/caddyCards';
import { buildDeck, shuffle, type PokerCard } from '../data/pokerDeck';

export type Step =
  | 'home'
  | 'menu'
  | 'howToPlay'
  | 'count'
  | 'names'
  | 'holes'
  | 'mode'
  | 'overview'
  | 'round'
  | 'scorecard'
  | 'results'
  | 'caddy'
  | 'caddyResults'
  | 'poker';

export type Phase = 'pick' | 'transition' | 'score' | 'matchup';
export type Result = 'achieved' | 'failed';

/** Sub-phases of the in-app virtual-poker finale (see PokerRoundScreen). */
export type PokerPhase = 'intro' | 'ready' | 'caddy' | 'deal' | 'select' | 'allIn' | 'reveal';

/** Poker cards awarded for winning a matchup hole. */
export const MATCHUP_REWARD = 2;

/** Most virtual cards dealt to one player (fits a 6×3 grid). */
export const MAX_POKER_CARDS = 18;

type MatchupState = { cardId: string; winner: number | null };

type GameState = {
  // ---- navigation ----
  step: Step;
  /** Transition to play for the most recent step change ('push' | 'pop' | null = instant). */
  transition: 'push' | 'pop' | null;
  /** Step the scorecard was opened from, so its back arrow pops to the right place. */
  scorecardReturn: Step;

  // ---- config ----
  players: string[]; // length 2–4
  avatars: number[]; // golfer character index per player
  holes: 9 | 18;
  mode: GameMode;
  noPokerDeck: boolean; // play challenges only — no poker hand / caddy finale
  useVirtualPokerDeck: boolean; // play the poker finale in-app with a virtual deck
  includeMatchups: boolean; // include head-to-head matchup cards in the draw pool
  includeCaddies: boolean; // include the caddy-card draw (bonus cards) in the poker finale
  showLiveActivity: boolean; // show each golfer's challenge in an iOS Live Activity during a round
  musicVolume: number; // background-music volume, 0..1
  musicMuted: boolean; // background-music mute toggle

  // ---- round state ----
  currentHole: number; // 1-based
  phase: Phase;
  pickTurn: number; // position within pickOrder of whose turn it is to pick
  pickOrder: number[]; // randomized player indices for the current hole's pick order
  holeCards: Record<number, string[]>; // hole -> card ids (index = position)
  assignment: Record<number, Record<number, number>>; // hole -> playerIdx -> position
  results: Record<number, Record<number, Result>>; // hole -> playerIdx -> result
  matchup: Record<number, MatchupState>; // hole -> matchup info (present iff a matchup hole)

  // ---- caddy draw (after the round) ----
  caddyCards: string[]; // 9 caddy card ids shown in the 3×3 grid
  caddyAssignment: Record<number, number>; // playerIdx -> chosen position
  caddyTurn: number; // index of the golfer currently drawing a caddy

  // ---- virtual poker finale (when useVirtualPokerDeck) ----
  pokerPhase: PokerPhase;
  pokerTurn: number; // playerIdx currently building a hand (-1 = none/no participants)
  pokerDeck: PokerCard[]; // shared shuffled 52-card deck
  pokerDealt: number; // cursor into pokerDeck
  pokerCaddyAssignment: Record<number, number>; // playerIdx -> position in the 9-caddy grid
  pokerHands: Record<number, PokerCard[]>; // playerIdx -> dealt cards
  pokerSelection: Record<number, string[]>; // playerIdx -> chosen card ids (≤5)
  pokerMulliganOffer: Record<number, PokerCard[]>; // playerIdx -> extra cards to keep 1 of (Mulligan Draw)

  // ---- navigation actions ----
  goTo: (step: Step, transition?: 'push' | 'pop') => void;
  viewScorecard: (from: Step) => void;

  // ---- config actions ----
  setPlayerCount: (n: number) => void;
  setPlayerName: (index: number, name: string) => void;
  setPlayers: (names: string[], avatars: number[]) => void;
  setHoles: (h: 9 | 18) => void;
  setMode: (m: GameMode) => void;
  setNoPokerDeck: (v: boolean) => void;
  setUseVirtualPokerDeck: (v: boolean) => void;
  setIncludeMatchups: (v: boolean) => void;
  setIncludeCaddies: (v: boolean) => void;
  setShowLiveActivity: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
  setMusicMuted: (m: boolean) => void;
  toggleMusicMuted: () => void;

  // ---- round actions ----
  startRound: () => void;
  pickCard: (position: number) => void;
  redrawCard: (position: number) => void;
  startCaddyDraw: () => void;
  pickCaddy: (position: number) => void;
  advanceCaddyTurn: () => void;
  advanceTurn: () => void;

  // ---- virtual poker actions ----
  startPokerRound: () => void;
  beginPokerReady: () => void; // intro "Start" -> first player's ready screen
  pokerReady: () => void; // "Yes, ready" -> caddy pick
  pickPokerCaddy: (position: number) => void; // -> deal
  dealPokerCards: () => void; // deal current player's cards -> select
  togglePokerCard: (id: string) => void;
  keepMulliganCard: (id: string) => void; // Mulligan Draw: keep one offered card, discard the rest
  lockPokerHand: () => void; // -> next player's ready, or all-in
  revealPoker: () => void; // all-in -> reveal

  triggerMatchup: (cardId: string) => void;
  setMatchupWinner: (playerIdx: number) => void;
  beginScoring: () => void;
  markResult: (playerIdx: number, result: Result) => void;
  setHoleResult: (hole: number, playerIdx: number, result: Result) => void;
  setHoleMatchupWinner: (hole: number, winner: number | null) => void;
  nextHole: () => void;
  reset: () => void;

  // ---- derived ----
  pokerCardCount: (playerIdx: number) => number;
  challengesWon: (playerIdx: number) => number;
  pickedPositions: () => number[];
};

const DEFAULT_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

/** Always show 4 cards per hole, regardless of player count. */
const CARDS_PER_HOLE = 4;

function drawCardsFor(state: Pick<GameState, 'mode' | 'includeMatchups'>): string[] {
  const pool = buildDrawPool(state.mode, state.includeMatchups);
  return drawDistinct(pool, CARDS_PER_HOLE).map((c) => c.id);
}

/**
 * Draw `k` cards from the shared deck at `cursor`. If the deck runs out (possible when the
 * combined earned counts exceed 52), it's refilled with a fresh shuffle — later players may
 * then share cards with earlier ones, but no single deal ever fails.
 */
function takeCards(
  deck: PokerCard[],
  cursor: number,
  k: number
): { cards: PokerCard[]; deck: PokerCard[]; cursor: number } {
  let d = deck;
  let c = cursor;
  const cards: PokerCard[] = [];
  for (let i = 0; i < k; i++) {
    if (c >= d.length) {
      d = shuffle(buildDeck());
      c = 0;
    }
    cards.push(d[c]);
    c++;
  }
  return { cards, deck: d, cursor: c };
}

/** A shuffled list of player indices [0..n-1] (Fisher–Yates). */
function shuffledOrder(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      step: 'home',
      transition: null,
      scorecardReturn: 'round',

      players: ['', ''],
      avatars: [],
      holes: 9,
      mode: 'amateur',
      noPokerDeck: false,
      useVirtualPokerDeck: false,
      includeMatchups: true,
      includeCaddies: true,
      showLiveActivity: true,
      musicVolume: 0.6,
      musicMuted: false,

      currentHole: 1,
      phase: 'pick',
      pickTurn: 0,
      pickOrder: [0, 1],
      holeCards: {},
      assignment: {},
      results: {},
      matchup: {},
      caddyCards: [],
      caddyAssignment: {},
      caddyTurn: 0,

      pokerPhase: 'intro',
      pokerTurn: -1,
      pokerDeck: [],
      pokerDealt: 0,
      pokerCaddyAssignment: {},
      pokerHands: {},
      pokerSelection: {},
      pokerMulliganOffer: {},

      goTo: (step, transition) => set({ step, transition: transition ?? null }),

      viewScorecard: (from) => set({ scorecardReturn: from, step: 'scorecard', transition: 'push' }),

      setPlayerCount: (n) =>
        set((s) => {
          const count = Math.max(2, Math.min(4, n));
          // Keep typed names; leave the rest blank (shown as placeholders). startRound
          // backfills any blanks with "Player N".
          const players = Array.from({ length: count }, (_, i) => s.players[i] ?? '');
          return { players };
        }),

      setPlayerName: (index, name) =>
        set((s) => {
          const players = s.players.slice();
          players[index] = name;
          return { players };
        }),

      setPlayers: (names, avatars) => set({ players: names, avatars }),

      setHoles: (holes) => set({ holes }),
      setMode: (mode) => set({ mode }),
      // The two poker toggles are mutually exclusive — enabling one disables the other.
      setNoPokerDeck: (v) => set(v ? { noPokerDeck: true, useVirtualPokerDeck: false } : { noPokerDeck: false }),
      setUseVirtualPokerDeck: (v) =>
        set(v ? { useVirtualPokerDeck: true, noPokerDeck: false } : { useVirtualPokerDeck: false }),
      setIncludeMatchups: (includeMatchups) => set({ includeMatchups }),
      setIncludeCaddies: (includeCaddies) => set({ includeCaddies }),
      setShowLiveActivity: (showLiveActivity) => set({ showLiveActivity }),
      setMusicVolume: (v) => set({ musicVolume: Math.max(0, Math.min(1, v)) }),
      setMusicMuted: (musicMuted) => set({ musicMuted }),
      toggleMusicMuted: () => set((s) => ({ musicMuted: !s.musicMuted })),

      startRound: () =>
        set((s) => {
          const players = s.players.map((p, i) => (p.trim() === '' ? DEFAULT_NAMES[i] : p));
          const firstHole = drawCardsFor({ mode: s.mode, includeMatchups: s.includeMatchups });
          return {
            players,
            step: 'round',
            currentHole: 1,
            phase: 'pick',
            pickTurn: 0,
            pickOrder: shuffledOrder(players.length),
            holeCards: { 1: firstHole },
            assignment: {},
            results: {},
            matchup: {},
          };
        }),

      pickCard: (position) =>
        set((s) => {
          const playerIdx = s.pickOrder[s.pickTurn] ?? s.pickTurn;
          const holeAssign = { ...(s.assignment[s.currentHole] ?? {}) };
          holeAssign[playerIdx] = position;
          return { assignment: { ...s.assignment, [s.currentHole]: holeAssign } };
        }),

      // After the round: draw 9 random caddies and let each golfer pick one. When caddy cards
      // are turned off, skip the draw and go straight to the final tally.
      startCaddyDraw: () =>
        set((s) =>
          s.includeCaddies
            ? {
                caddyCards: drawCaddies(9),
                caddyAssignment: {},
                caddyTurn: 0,
                step: 'caddy' as Step,
                transition: 'push' as const,
              }
            : { caddyCards: [], caddyAssignment: {}, step: 'caddyResults' as Step, transition: 'push' as const }
        ),

      pickCaddy: (position) =>
        set((s) => ({ caddyAssignment: { ...s.caddyAssignment, [s.caddyTurn]: position } })),

      advanceCaddyTurn: () =>
        set((s) => {
          if (s.caddyTurn < s.players.length - 1) {
            return { caddyTurn: s.caddyTurn + 1 };
          }
          return { step: 'caddyResults' as Step, transition: 'push' as const };
        }),

      // ---- virtual poker finale ----
      // Replaces the physical results→caddy→caddyResults flow when useVirtualPokerDeck is on.
      startPokerRound: () =>
        set((s) => {
          const firstParticipant = s.players.findIndex((_, i) => get().pokerCardCount(i) > 0);
          return {
            step: 'poker' as Step,
            transition: 'push' as const,
            pokerPhase: 'intro' as PokerPhase,
            pokerTurn: firstParticipant,
            pokerDeck: shuffle(buildDeck()),
            pokerDealt: 0,
            caddyCards: drawCaddies(9),
            pokerCaddyAssignment: {},
            pokerHands: {},
            pokerSelection: {},
            pokerMulliganOffer: {},
          };
        }),

      // Intro "Start" → first player's ready screen (or straight to reveal if nobody earned cards).
      beginPokerReady: () =>
        set((s) => (s.pokerTurn < 0 ? { pokerPhase: 'allIn' as PokerPhase } : { pokerPhase: 'ready' as PokerPhase })),

      // "Yes, ready" → pick a caddy, or straight to the deal when caddy cards are off.
      pokerReady: () => set((s) => ({ pokerPhase: (s.includeCaddies ? 'caddy' : 'deal') as PokerPhase })),

      pickPokerCaddy: (position) =>
        set((s) => ({
          pokerCaddyAssignment: { ...s.pokerCaddyAssignment, [s.pokerTurn]: position },
          pokerPhase: 'deal' as PokerPhase,
        })),

      dealPokerCards: () =>
        set((s) => {
          const idx = s.pokerTurn;
          if (idx < 0 || s.pokerHands[idx]) return { pokerPhase: 'select' as PokerPhase };

          const effect = caddyEffect(s.caddyCards[s.pokerCaddyAssignment[idx]]);
          // Mulligan Draw: deal an extra "offer" of cards the player keeps `keep` of, so
          // reserve those slots in the 18-card cap.
          const keep = effect.kind === 'drawKeep' ? effect.keep : 0;
          const baseCount = Math.min(get().pokerCardCount(idx), MAX_POKER_CARDS - keep);

          let { cards, deck, cursor } = takeCards(s.pokerDeck, s.pokerDealt, baseCount);
          let offer: PokerCard[] = [];
          if (effect.kind === 'drawKeep') {
            const drawn = takeCards(deck, cursor, effect.draw);
            offer = drawn.cards;
            deck = drawn.deck;
            cursor = drawn.cursor;
          }

          return {
            pokerDeck: deck,
            pokerDealt: cursor,
            pokerHands: { ...s.pokerHands, [idx]: cards },
            pokerMulliganOffer: offer.length ? { ...s.pokerMulliganOffer, [idx]: offer } : s.pokerMulliganOffer,
            pokerPhase: 'select' as PokerPhase,
          };
        }),

      togglePokerCard: (id) =>
        set((s) => {
          const idx = s.pokerTurn;
          const current = s.pokerSelection[idx] ?? [];
          const next = current.includes(id)
            ? current.filter((c) => c !== id)
            : current.length >= 5
              ? current
              : [...current, id];
          return { pokerSelection: { ...s.pokerSelection, [idx]: next } };
        }),

      // Mulligan Draw caddy: keep one of the offered cards (added to the hand), discard the rest.
      keepMulliganCard: (id) =>
        set((s) => {
          const idx = s.pokerTurn;
          const offer = s.pokerMulliganOffer[idx];
          const kept = offer?.find((c) => c.id === id);
          if (!kept) return {};
          const nextOffer = { ...s.pokerMulliganOffer };
          delete nextOffer[idx];
          return {
            pokerHands: { ...s.pokerHands, [idx]: [...(s.pokerHands[idx] ?? []), kept] },
            pokerMulliganOffer: nextOffer,
          };
        }),

      lockPokerHand: () =>
        set((s) => {
          const next = s.players.findIndex((_, i) => i > s.pokerTurn && get().pokerCardCount(i) > 0);
          if (next >= 0) {
            return { pokerTurn: next, pokerPhase: 'ready' as PokerPhase };
          }
          return { pokerPhase: 'allIn' as PokerPhase };
        }),

      revealPoker: () => set({ pokerPhase: 'reveal' }),

      // Replace the card at `position` with a fresh random draw (different from the current).
      redrawCard: (position) =>
        set((s) => {
          const pool = buildDrawPool(s.mode, s.includeMatchups);
          const currentId = s.holeCards[s.currentHole]?.[position];
          const candidates = pool.filter((c) => c.id !== currentId);
          const nextId = drawDistinct(candidates, 1)[0]?.id ?? currentId;
          const holeCards = (s.holeCards[s.currentHole] ?? []).slice();
          holeCards[position] = nextId;
          return { holeCards: { ...s.holeCards, [s.currentHole]: holeCards } };
        }),

      advanceTurn: () =>
        set((s) => {
          if (s.pickTurn < s.players.length - 1) {
            return { pickTurn: s.pickTurn + 1 };
          }
          return { phase: 'transition' as Phase };
        }),

      // A matchup card was flipped: the whole hole becomes a single head-to-head.
      // Remaining players don't pick; earlier picks are ignored for scoring.
      triggerMatchup: (cardId) =>
        set((s) => ({
          phase: 'matchup' as Phase,
          matchup: { ...s.matchup, [s.currentHole]: { cardId, winner: null } },
        })),

      setMatchupWinner: (playerIdx) =>
        set((s) => {
          const existing = s.matchup[s.currentHole];
          if (!existing) return {};
          return {
            matchup: { ...s.matchup, [s.currentHole]: { ...existing, winner: playerIdx } },
          };
        }),

      beginScoring: () => set({ phase: 'score' }),

      markResult: (playerIdx, result) =>
        set((s) => {
          const holeResults = { ...(s.results[s.currentHole] ?? {}) };
          holeResults[playerIdx] = result;
          return { results: { ...s.results, [s.currentHole]: holeResults } };
        }),

      // Correct a specific hole's result (used by the scorecard's "Incorrect?" flow).
      setHoleResult: (hole, playerIdx, result) =>
        set((s) => {
          const holeResults = { ...(s.results[hole] ?? {}) };
          holeResults[playerIdx] = result;
          return { results: { ...s.results, [hole]: holeResults } };
        }),

      // Correct a specific hole's matchup winner (null = no winner).
      setHoleMatchupWinner: (hole, winner) =>
        set((s) => {
          const existing = s.matchup[hole];
          if (!existing) return {};
          return { matchup: { ...s.matchup, [hole]: { ...existing, winner } } };
        }),

      nextHole: () =>
        set((s) => {
          if (s.currentHole < s.holes) {
            const next = s.currentHole + 1;
            const cards = drawCardsFor({ mode: s.mode, includeMatchups: s.includeMatchups });
            return {
              currentHole: next,
              phase: 'pick' as Phase,
              pickTurn: 0,
              pickOrder: shuffledOrder(s.players.length),
              holeCards: { ...s.holeCards, [next]: cards },
            };
          }
          return { step: 'results' as Step };
        }),

      reset: () =>
        set({
          step: 'home',
          transition: null,
          players: ['', ''],
          avatars: [],
          holes: 9,
          // mode (black-tees setting) is a persistent menu preference — not reset here.
          currentHole: 1,
          phase: 'pick',
          pickTurn: 0,
          pickOrder: [0, 1],
          holeCards: {},
          assignment: {},
          results: {},
          matchup: {},
          caddyCards: [],
          caddyAssignment: {},
          caddyTurn: 0,
          pokerPhase: 'intro',
          pokerTurn: -1,
          pokerDeck: [],
          pokerDealt: 0,
          pokerCaddyAssignment: {},
          pokerHands: {},
          pokerSelection: {},
          pokerMulliganOffer: {},
        }),

      // Final poker-card tally: matchup winner gets MATCHUP_REWARD; otherwise +1 per Achieved.
      pokerCardCount: (playerIdx) => {
        const { results, matchup, holes } = get();
        let count = 0;
        for (let hole = 1; hole <= holes; hole++) {
          const m = matchup[hole];
          if (m) {
            if (m.winner === playerIdx) count += MATCHUP_REWARD;
            continue;
          }
          if (results[hole]?.[playerIdx] === 'achieved') count++;
        }
        return count;
      },

      // Challenges won: an Achieved result counts; on a matchup hole, the matchup winner wins it.
      challengesWon: (playerIdx) => {
        const { results, matchup, holes } = get();
        let count = 0;
        for (let hole = 1; hole <= holes; hole++) {
          const m = matchup[hole];
          if (m) {
            if (m.winner === playerIdx) count++;
            continue;
          }
          if (results[hole]?.[playerIdx] === 'achieved') count++;
        }
        return count;
      },

      pickedPositions: () => {
        const s = get();
        const holeAssign = s.assignment[s.currentHole] ?? {};
        return Object.values(holeAssign);
      },
    }),
    {
      name: 'caddy-game',
      // Bump when the persisted round shape changes — old saved rounds are then discarded
      // so the app boots fresh at the home screen instead of resuming a stale round.
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only data (not action functions) so a backgrounded round resumes.
      partialize: (s) => ({
        step: s.step,
        players: s.players,
        avatars: s.avatars,
        holes: s.holes,
        mode: s.mode,
        noPokerDeck: s.noPokerDeck,
        useVirtualPokerDeck: s.useVirtualPokerDeck,
        includeMatchups: s.includeMatchups,
        includeCaddies: s.includeCaddies,
        showLiveActivity: s.showLiveActivity,
        musicVolume: s.musicVolume,
        musicMuted: s.musicMuted,
        currentHole: s.currentHole,
        phase: s.phase,
        pickTurn: s.pickTurn,
        pickOrder: s.pickOrder,
        holeCards: s.holeCards,
        assignment: s.assignment,
        results: s.results,
        matchup: s.matchup,
        caddyCards: s.caddyCards,
        caddyAssignment: s.caddyAssignment,
        caddyTurn: s.caddyTurn,
        pokerPhase: s.pokerPhase,
        pokerTurn: s.pokerTurn,
        pokerDeck: s.pokerDeck,
        pokerDealt: s.pokerDealt,
        pokerCaddyAssignment: s.pokerCaddyAssignment,
        pokerHands: s.pokerHands,
        pokerSelection: s.pokerSelection,
        pokerMulliganOffer: s.pokerMulliganOffer,
      }),
    }
  )
);
