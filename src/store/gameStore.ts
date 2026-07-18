import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDrawPool, drawDistinct, cardById, type GameMode } from '../data/cards';
import { NO_PACKS_OWNED, ALL_PACKS_OWNED, type PackId } from '../data/packs';
import { drawCaddies, caddyEffect, caddyById } from '../data/caddyCards';
import { buildDeck, shuffle, type PokerCard } from '../data/pokerDeck';
import { track, startGame, registerConfig } from '../analytics';

export type Step =
  | 'home'
  | 'menu'
  | 'howToPlay'
  | 'paywall'
  | 'count'
  | 'names'
  | 'holes'
  | 'mode'
  | 'overview'
  | 'round'
  | 'scorecard'
  | 'results'
  | 'poker'
  | 'openPack' // the pack-opening reveal (onboarding first pack, or opening a pack from Card Packs)
  | 'packs'; // the Card Packs management view

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
  // The game has a single finale: the in-app virtual poker deck. These two flags are now constant
  // (virtual on, challenges-only off) but retained so the scorecard/finale plumbing is unchanged.
  noPokerDeck: boolean; // always false — retained for the scorecard's end-of-round wording
  useVirtualPokerDeck: boolean; // always true — the only finale
  includeMatchups: boolean; // include head-to-head matchup cards in the draw pool
  includeWhite: boolean; // include the white-tees cards in the draw pool (pack in-play toggle)
  includeCaddies: boolean; // effective this-game caddy inclusion (owned caddy pack AND enabled)
  // Saved default (persists across games) for whether caddies are used; set via the caddy pack.
  defaultIncludeCaddies: boolean; // seeds includeCaddies each new game (gated by caddy pack ownership)
  showLiveActivity: boolean; // show each golfer's challenge in an iOS Live Activity during a round
  musicVolume: number; // background-music volume, 0..1
  musicMuted: boolean; // background-music mute toggle

  // ---- card packs ----
  // Ownership is the source of truth for which cards are available (see buildDrawPool). The
  // in-play toggles are the existing `mode` (black-tees) and `includeMatchups` fields.
  ownedPacks: Record<PackId, boolean>;
  // Which pack the openPack screen is currently revealing (transient — not persisted).
  openingPackId: PackId | null;
  // True when the openPack screen is browsing an already-owned pack (skip the flip, show the grid,
  // no grant) rather than opening a new one. Transient.
  packBrowse: boolean;
  // True when the openPack screen was reached as the New Round first-open onboarding (from the
  // hole-count step) — drives the onboarding UI and its back→holes / continue→overview routing.
  // False when a pack is opened from the Card Packs screen (back/continue → Card Packs). Transient.
  packOnboarding: boolean;
  // Where the Card Packs screen returns to — the Menu, or the ready-to-play Overview. Transient.
  packsReturn: Step;
  // Golfer slot to auto-open for editing when the count screen is reached from the Overview.
  editGolferSlot: number | null;

  // ---- round state ----
  currentHole: number; // 1-based
  phase: Phase;
  pickTurn: number; // position within pickOrder of whose turn it is to pick
  pickOrder: number[]; // randomized player indices for the current hole's pick order
  holeCards: Record<number, string[]>; // hole -> card ids (index = position)
  assignment: Record<number, Record<number, number>>; // hole -> playerIdx -> position
  results: Record<number, Record<number, Result>>; // hole -> playerIdx -> result
  matchup: Record<number, MatchupState>; // hole -> matchup info (present iff a matchup hole)

  // ---- caddy cards (drawn for the virtual poker finale) ----
  caddyCards: string[]; // 9 caddy card ids drawn for the finale's caddy pick

  // ---- virtual poker finale ----
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
  setIncludeMatchups: (v: boolean) => void;
  setIncludeCaddies: (v: boolean) => void;
  setDefaultIncludeCaddies: (v: boolean) => void;
  setShowLiveActivity: (v: boolean) => void;
  setMusicVolume: (v: number) => void;
  setMusicMuted: (m: boolean) => void;
  toggleMusicMuted: () => void;

  // ---- card pack actions ----
  beginOpenPack: (id: PackId, opts?: { onboarding?: boolean }) => void; // navigate into the openPack reveal for this pack
  beginBrowsePack: (id: PackId) => void; // view an already-owned pack's cards as a grid
  goToCardPacks: (from: Step) => void; // open Card Packs, remembering where to return
  editGolfer: (slot: number) => void; // jump to the count screen to edit a golfer, then return
  clearEditGolfer: () => void; // consume the pending golfer-edit slot
  grantPack: (id: PackId) => void; // mark a pack owned (and put it in play) on open
  setPackEnabled: (id: PackId, enabled: boolean) => void; // toggle an owned pack in/out of play
  devResetPacks: () => void; // dev-only: forget all owned packs so first-play onboarding fires again
  devNewUserReset: () => void; // dev-only: wipe to a brand-new-user state (no packs, default settings)

  // ---- round actions ----
  startRound: () => void;
  pickCard: (position: number) => void;
  redrawCard: (position: number) => void;
  advanceTurn: () => void;

  // ---- virtual poker actions ----
  startPokerRound: () => void;
  beginPokerReady: () => void; // no participants -> all-in (otherwise the picker drives the flow)
  dealToPokerGolfer: (idx: number) => void; // picker taps a golfer -> that golfer's ready screen
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

function drawCardsFor(
  state: Pick<GameState, 'mode' | 'includeMatchups' | 'ownedPacks' | 'includeWhite'>
): string[] {
  const pool = buildDrawPool(state.mode, state.includeMatchups, state.ownedPacks, state.includeWhite);
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
      // Constant finale flags — virtual poker is the only mode.
      noPokerDeck: false,
      useVirtualPokerDeck: true,
      includeMatchups: true,
      includeWhite: true,
      includeCaddies: true,
      defaultIncludeCaddies: true,
      showLiveActivity: true,
      musicVolume: 0.6,
      musicMuted: false,

      // Fresh install owns nothing — the first "New Round" forces opening the free White Tees pack.
      // Upgraders are granted all packs by the persist `migrate` below.
      ownedPacks: { ...NO_PACKS_OWNED },
      openingPackId: null,
      packBrowse: false,
      packOnboarding: false,
      packsReturn: 'menu',
      editGolferSlot: null,

      currentHole: 1,
      phase: 'pick',
      pickTurn: 0,
      pickOrder: [0, 1],
      holeCards: {},
      assignment: {},
      results: {},
      matchup: {},
      caddyCards: [],

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

      setPlayers: (names, avatars) => {
        avatars.forEach((a) => track('avatar_selected', { avatar_index: a }));
        set({ players: names, avatars });
      },

      setHoles: (holes) => set({ holes }),
      setMode: (mode) => set({ mode }),
      setIncludeMatchups: (includeMatchups) => set({ includeMatchups }),
      setIncludeCaddies: (includeCaddies) => set({ includeCaddies }),
      setDefaultIncludeCaddies: (v) => set({ defaultIncludeCaddies: v, includeCaddies: v }),
      setShowLiveActivity: (showLiveActivity) => set({ showLiveActivity }),
      setMusicVolume: (v) => set({ musicVolume: Math.max(0, Math.min(1, v)) }),
      setMusicMuted: (musicMuted) => set({ musicMuted }),
      toggleMusicMuted: () => set((s) => ({ musicMuted: !s.musicMuted })),

      beginOpenPack: (id, opts) =>
        set({ openingPackId: id, packBrowse: false, packOnboarding: !!opts?.onboarding, step: 'openPack', transition: 'push' }),

      beginBrowsePack: (id) =>
        set({ openingPackId: id, packBrowse: true, packOnboarding: false, step: 'openPack', transition: 'push' }),

      goToCardPacks: (from) => set({ packsReturn: from, step: 'packs', transition: 'push' }),

      editGolfer: (slot) => set({ editGolferSlot: slot, step: 'count', transition: 'pop' }),

      clearEditGolfer: () => set({ editGolferSlot: null }),

      grantPack: (id) =>
        set((s) => {
          track('pack_opened', { pack_id: id });
          // Owning a pack also puts it in play (via the existing in-play toggles), so a
          // just-opened pack is immediately usable in the next round.
          const next: Partial<GameState> = { ownedPacks: { ...s.ownedPacks, [id]: true } };
          if (id === 'black-tees') next.mode = 'pro';
          if (id === 'matchups') next.includeMatchups = true;
          if (id === 'caddy') {
            next.defaultIncludeCaddies = true;
            next.includeCaddies = true;
          }
          return next;
        }),

      setPackEnabled: (id, enabled) => {
        track('pack_toggle', { pack_id: id, enabled });
        // Each pack maps to its in-play flag. Challenge packs feed the draw pool; the caddy pack
        // maps to the persistent caddy setting (and the effective flag for this game).
        if (id === 'white-tees') set({ includeWhite: enabled });
        else if (id === 'black-tees') set({ mode: enabled ? 'pro' : 'amateur' });
        else if (id === 'matchups') set({ includeMatchups: enabled });
        else if (id === 'caddy') set({ defaultIncludeCaddies: enabled, includeCaddies: enabled });
      },

      // Dev-only: return to the fresh-install pack state (nothing owned) so the next "New Round"
      // replays the White Tees onboarding. Also resets the in-play flags to their defaults.
      devResetPacks: () =>
        set({ ownedPacks: { ...NO_PACKS_OWNED }, openingPackId: null, mode: 'amateur', includeMatchups: true }),

      // Dev-only: wipe everything back to a brand-new-user state — no packs owned, config back to
      // fresh-install defaults, and any in-progress game cleared. (Trial is reset separately.)
      devNewUserReset: () =>
        set({
          step: 'home',
          transition: null,
          players: ['', ''],
          avatars: [],
          holes: 9,
          mode: 'amateur',
          noPokerDeck: false,
          useVirtualPokerDeck: true,
          includeMatchups: true,
          includeWhite: true,
          includeCaddies: true,
          defaultIncludeCaddies: true,
          ownedPacks: { ...NO_PACKS_OWNED },
          openingPackId: null,
          packBrowse: false,
          currentHole: 1,
          phase: 'pick',
          pickTurn: 0,
          pickOrder: [0, 1],
          holeCards: {},
          assignment: {},
          results: {},
          matchup: {},
          caddyCards: [],
          pokerPhase: 'intro',
          pokerTurn: -1,
          pokerDeck: [],
          pokerDealt: 0,
          pokerCaddyAssignment: {},
          pokerHands: {},
          pokerSelection: {},
          pokerMulliganOffer: {},
        }),

      startRound: () =>
        set((s) => {
          const players = s.players.map((p, i) => (p.trim() === '' ? DEFAULT_NAMES[i] : p));
          const firstHole = drawCardsFor({ mode: s.mode, includeMatchups: s.includeMatchups, ownedPacks: s.ownedPacks, includeWhite: s.includeWhite });
          // Caddies only apply if the caddy pack is owned AND enabled. Virtual poker is the only finale.
          const includeCaddies = s.ownedPacks['caddy'] && s.defaultIncludeCaddies;
          startGame();
          registerConfig({
            mode: s.mode,
            matchups: s.includeMatchups,
            caddies: includeCaddies,
            live_activity: s.showLiveActivity,
          });
          track('game_started', {
            players: players.length,
            holes: s.holes,
            mode: s.mode,
            matchups: s.includeMatchups,
            caddies: includeCaddies,
            live_activity: s.showLiveActivity,
          });
          return {
            players,
            includeCaddies,
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
          const cardId = s.holeCards[s.currentHole]?.[position];
          if (cardId) {
            track('challenge_selected', {
              card_id: cardId,
              card_name: cardById(cardId)?.name,
              tee: s.mode,
            });
          }
          return { assignment: { ...s.assignment, [s.currentHole]: holeAssign } };
        }),

      // ---- virtual poker finale ----
      startPokerRound: () =>
        set((s) => {
          // Go straight to the first participant's "Pass the phone" screen and cycle through the
          // golfers in the order they were added (no separate "Dealing Cards" picker).
          const firstParticipant = s.players.findIndex((_, i) => get().pokerCardCount(i) > 0);
          return {
            step: 'poker' as Step,
            transition: 'push' as const,
            pokerPhase: (firstParticipant < 0 ? 'allIn' : 'ready') as PokerPhase,
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

      // No one earned cards → skip straight to the reveal handoff. Otherwise the picker
      // (IntroPhase) drives who is dealt next, so nothing to do here.
      beginPokerReady: () =>
        set((s) => (s.pokerTurn < 0 ? { pokerPhase: 'allIn' as PokerPhase } : {})),

      // Picker tapped a golfer: make them the active player and send them to the ready screen.
      dealToPokerGolfer: (idx) => set({ pokerTurn: idx, pokerPhase: 'ready' as PokerPhase }),

      // "Yes, ready" → pick a caddy, or straight to the deal when caddy cards are off.
      pokerReady: () => set((s) => ({ pokerPhase: (s.includeCaddies ? 'caddy' : 'deal') as PokerPhase })),

      pickPokerCaddy: (position) =>
        set((s) => {
          const cardId = s.caddyCards[position];
          if (cardId) {
            track('caddy_selected', { card_id: cardId, card_name: caddyById(cardId)?.name, context: 'virtual' });
          }
          return {
            pokerCaddyAssignment: { ...s.pokerCaddyAssignment, [s.pokerTurn]: position },
            pokerPhase: 'deal' as PokerPhase,
          };
        }),

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

      // Lock in the current player's hand and advance to the next participant (in add order). When
      // the last one has locked, hand off to the all-in / reveal screen.
      lockPokerHand: () =>
        set((s) => {
          const next = s.players.findIndex((_, i) => i > s.pokerTurn && get().pokerCardCount(i) > 0);
          return next >= 0
            ? { pokerTurn: next, pokerPhase: 'ready' as PokerPhase }
            : { pokerPhase: 'allIn' as PokerPhase };
        }),

      revealPoker: () => set({ pokerPhase: 'reveal' }),

      // Replace the card at `position` with a fresh random draw (different from the current).
      redrawCard: (position) =>
        set((s) => {
          const pool = buildDrawPool(s.mode, s.includeMatchups, s.ownedPacks, s.includeWhite);
          const currentId = s.holeCards[s.currentHole]?.[position];
          const candidates = pool.filter((c) => c.id !== currentId);
          const nextId = drawDistinct(candidates, 1)[0]?.id ?? currentId;
          const holeCards = (s.holeCards[s.currentHole] ?? []).slice();
          holeCards[position] = nextId;
          track('card_redraw', {
            from_card_id: currentId,
            from_card_name: currentId ? cardById(currentId)?.name : undefined,
            to_card_id: nextId,
            to_card_name: nextId ? cardById(nextId)?.name : undefined,
          });
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
        set((s) => {
          track('matchup_played', { card_id: cardId, card_name: cardById(cardId)?.name });
          return {
            phase: 'matchup' as Phase,
            matchup: { ...s.matchup, [s.currentHole]: { cardId, winner: null } },
          };
        }),

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
          const position = s.assignment[s.currentHole]?.[playerIdx];
          const cardId = position != null ? s.holeCards[s.currentHole]?.[position] : undefined;
          if (cardId) {
            track('challenge_scored', {
              card_id: cardId,
              card_name: cardById(cardId)?.name,
              achieved: result === 'achieved',
            });
          }
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
            const cards = drawCardsFor({ mode: s.mode, includeMatchups: s.includeMatchups, ownedPacks: s.ownedPacks, includeWhite: s.includeWhite });
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

      reset: () => {
        const prev = get();
        // Only report a game that actually started (avoids stray resets from the home screen).
        if (prev.step !== 'home') {
          track('game_ended', { holes_selected: prev.holes, holes_played: prev.currentHole });
        }
        set({
          step: 'home',
          transition: null,
          players: ['', ''],
          avatars: [],
          holes: 9,
          // mode (black-tees setting) and ownedPacks are persistent preferences — not reset here.
          openingPackId: null,
          currentHole: 1,
          phase: 'pick',
          pickTurn: 0,
          pickOrder: [0, 1],
          holeCards: {},
          assignment: {},
          results: {},
          matchup: {},
          caddyCards: [],
          pokerPhase: 'intro',
          pokerTurn: -1,
          pokerDeck: [],
          pokerDealt: 0,
          pokerCaddyAssignment: {},
          pokerHands: {},
          pokerSelection: {},
          pokerMulliganOffer: {},
        });
      },

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
      // Bump when the persisted round shape changes. `migrate` below preserves player settings
      // across bumps (only the in-progress round is allowed to be dropped).
      version: 8,
      // v6: card packs. Existing users are granted ALL packs so they're never forced through
      //     onboarding and keep their pro/matchup settings; fresh installs own nothing.
      // v8: game simplified to virtual-only (game-mode picker removed); caddies became a pack.
      //     Grant the caddy pack to existing users so their caddies keep working.
      migrate: (persisted: any, version) => {
        let p = persisted;
        if (p && version < 5) {
          p = { ...p, defaultIncludeCaddies: p.includeCaddies ?? true };
        }
        if (p && version < 6) {
          p = { ...p, ownedPacks: { ...ALL_PACKS_OWNED } };
        }
        if (p && version < 8) {
          p = {
            ...p,
            ownedPacks: { ...NO_PACKS_OWNED, ...(p.ownedPacks ?? {}), caddy: true },
            useVirtualPokerDeck: true,
            noPokerDeck: false,
          };
        }
        return p;
      },
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
        includeWhite: s.includeWhite,
        includeCaddies: s.includeCaddies,
        defaultIncludeCaddies: s.defaultIncludeCaddies,
        showLiveActivity: s.showLiveActivity,
        musicVolume: s.musicVolume,
        musicMuted: s.musicMuted,
        ownedPacks: s.ownedPacks, // openingPackId is transient — intentionally not persisted
        currentHole: s.currentHole,
        phase: s.phase,
        pickTurn: s.pickTurn,
        pickOrder: s.pickOrder,
        holeCards: s.holeCards,
        assignment: s.assignment,
        results: s.results,
        matchup: s.matchup,
        caddyCards: s.caddyCards,
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
