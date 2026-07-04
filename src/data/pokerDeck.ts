/**
 * Virtual 52-card poker deck + hand evaluator for the in-app poker finale
 * (enabled by the "Use Virtual Poker Deck" menu toggle).
 *
 * Cards are represented with letters/numbers for ranks (A J Q K + 2–10) and emoji for suits.
 * The evaluator supports the functional caddy-card effects (wild cards, floor/upgrade rules)
 * and is only ever run on a player's selected ≤5-card hand, so a category-feasibility search
 * (rather than brute-forcing wild substitutions) keeps it exact and fast.
 */

export type Suit = 'S' | 'H' | 'D' | 'C';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export type PokerCard = { id: string; rank: Rank; suit: Suit };

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/** Ace is high (14); the wheel A-2-3-4-5 straight is handled explicitly in the evaluator. */
export const RANK_VAL: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  J: 11, Q: 12, K: 13, A: 14,
};

export const SUIT_EMOJI: Record<Suit, string> = { S: '♠️', H: '♥️', D: '♦️', C: '♣️' };
/** Spades/clubs are black, hearts/diamonds red — used by the black/red caddy effects and UI. */
export const SUIT_IS_RED: Record<Suit, boolean> = { S: false, H: true, D: true, C: false };

export const cardId = (rank: Rank, suit: Suit): string => `${rank}-${suit}`;

/** A fresh, ordered 52-card deck. */
export function buildDeck(): PokerCard[] {
  const deck: PokerCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: cardId(rank, suit), rank, suit });
    }
  }
  return deck;
}

/** Fisher–Yates shuffle (returns a new array). Same idiom as drawCaddies/shuffledOrder. */
export function shuffle<T>(input: readonly T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/* Hand ranking                                                       */
/* ------------------------------------------------------------------ */

export const CATEGORY = {
  HIGH: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  TRIPS: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  QUADS: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
} as const;

export const HAND_NAMES: string[] = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
];

export type HandResult = { cat: number; tb: number[]; name: string };

/**
 * Functional caddy effects.
 * - `wildRanks`/`wildCards` make matching cards wild (evaluation).
 * - `sameSuit` treats the listed suits as one suit for flush purposes (evaluation).
 * - `upgrade` promotes one hand category to another (evaluation).
 * - `flushCount`/`straightCount` let an N-card flush/straight count as the full thing (evaluation).
 * - `drawKeep` is applied when cards are dealt (in the store), not here.
 */
export type CaddyEffect =
  | { kind: 'wildRanks'; ranks: Rank[] }
  | { kind: 'wildCards'; cardIds: string[] }
  | { kind: 'sameSuit'; suits: Suit[] }
  | { kind: 'upgrade'; from: number; to: number }
  | { kind: 'flushCount'; count: number }
  | { kind: 'straightCount'; count: number }
  | { kind: 'drawKeep'; draw: number; keep: number }
  | { kind: 'none' };

type Real = { rv: number; suit: Suit };

/** Straight windows by high card (6..A) plus the A-2-3-4-5 wheel (high = 5). */
const WINDOWS: { high: number; ranks: Set<number> }[] = [
  ...Array.from({ length: 9 }, (_, i) => {
    const high = i + 6; // 6..14
    return { high, ranks: new Set([high, high - 1, high - 2, high - 3, high - 4]) };
  }),
  { high: 5, ranks: new Set([14, 5, 4, 3, 2]) },
];

/** Lexicographic compare of two tiebreaker arrays (longer treated as larger when prefixes tie). */
function cmpArr(a: number[], b: number[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const av = a[i] ?? -1;
    const bv = b[i] ?? -1;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/** Append `w` high "wild" ranks (14,13,… skipping present values) to a descending rank list. */
function fillWildRanks(existingDesc: number[], w: number): number[] {
  const out = existingDesc.slice();
  const present = new Set(existingDesc);
  let v = 14;
  for (let i = 0; i < w; i++) {
    while (v >= 2 && present.has(v)) v--;
    out.push(v >= 2 ? v : 14);
    present.add(v);
    v--;
  }
  return out.sort((a, b) => b - a);
}

/** Rank a concrete hand of ≤5 cards (no wilds). */
function rankConcrete(rvs: number[], suits: Suit[]): { cat: number; tb: number[] } {
  const n = rvs.length;
  const desc = rvs.slice().sort((a, b) => b - a);

  const counts = new Map<number, number>();
  for (const v of desc) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const groupFlat = groups.flatMap(([rv, ct]) => Array(ct).fill(rv));

  const isFlush = n === 5 && suits.every((s) => s === suits[0]);
  const straightHigh = getStraightHigh(desc, n);

  if (straightHigh > 0 && isFlush) {
    return { cat: straightHigh === 14 ? CATEGORY.ROYAL_FLUSH : CATEGORY.STRAIGHT_FLUSH, tb: [straightHigh] };
  }
  if (groups[0][1] === 4) return { cat: CATEGORY.QUADS, tb: groupFlat };
  if (groups[0][1] === 3 && groups[1] && groups[1][1] >= 2) return { cat: CATEGORY.FULL_HOUSE, tb: groupFlat };
  if (isFlush) return { cat: CATEGORY.FLUSH, tb: desc };
  if (straightHigh > 0) return { cat: CATEGORY.STRAIGHT, tb: [straightHigh] };
  if (groups[0][1] === 3) return { cat: CATEGORY.TRIPS, tb: groupFlat };
  if (groups[0][1] === 2 && groups[1] && groups[1][1] === 2) return { cat: CATEGORY.TWO_PAIR, tb: groupFlat };
  if (groups[0][1] === 2) return { cat: CATEGORY.PAIR, tb: groupFlat };
  return { cat: CATEGORY.HIGH, tb: desc };
}

function getStraightHigh(desc: number[], n: number): number {
  if (n !== 5) return 0;
  const uniq = [...new Set(desc)].sort((a, b) => b - a);
  if (uniq.length !== 5) return 0;
  if (uniq[0] - uniq[4] === 4) return uniq[0];
  if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) return 5; // wheel
  return 0;
}

/** Best ≤5-card hand given `reals` plus `w` fully-wild cards. Category-feasibility search. */
function bestWithWilds(reals: Real[], w: number, flushMin: number): { cat: number; tb: number[] } {
  const n = reals.length + w;
  const cnt = (rv: number) => reals.filter((r) => r.rv === rv).length;

  // Straight flush / royal (needs 5 cards, all reals same suit forming part of one straight).
  if (n === 5) {
    let best = 0;
    for (const suit of SUITS) {
      const inS = reals.filter((r) => r.suit === suit);
      if (inS.length !== reals.length) continue;
      const rset = new Set(inS.map((r) => r.rv));
      if (rset.size !== inS.length) continue;
      for (const win of WINDOWS) {
        if (![...rset].every((rv) => win.ranks.has(rv))) continue;
        best = Math.max(best, win.high);
      }
    }
    if (best > 0) return { cat: best === 14 ? CATEGORY.ROYAL_FLUSH : CATEGORY.STRAIGHT_FLUSH, tb: [best] };
  }

  // Quads.
  if (n >= 4) {
    let best: { cat: number; tb: number[] } | null = null;
    for (let rq = 14; rq >= 2; rq--) {
      const c = cnt(rq);
      const need = 4 - c;
      if (need < 0 || need > w) continue;
      const others = reals.length - c;
      const kickerSlots = n - 4;
      const wildsLeft = w - need;
      if (others > kickerSlots || others + wildsLeft !== kickerSlots) continue;
      const otherRvs = reals.filter((r) => r.rv !== rq).map((r) => r.rv);
      const kicker = kickerSlots > 0 ? (wildsLeft > 0 ? 14 : Math.max(0, ...otherRvs)) : undefined;
      const tb = kicker !== undefined ? [rq, rq, rq, rq, kicker] : [rq, rq, rq, rq];
      if (!best || cmpArr(tb, best.tb) > 0) best = { cat: CATEGORY.QUADS, tb };
    }
    if (best) return best;
  }

  // Full house.
  if (n === 5) {
    let best: { cat: number; tb: number[] } | null = null;
    for (let tripR = 14; tripR >= 2; tripR--) {
      const ct = cnt(tripR);
      const needT = 3 - ct;
      if (needT < 0 || needT > w) continue;
      for (let pairR = 14; pairR >= 2; pairR--) {
        if (pairR === tripR) continue;
        const cp = cnt(pairR);
        const needP = 2 - cp;
        if (needP < 0 || needT + needP !== w) continue;
        if (reals.length !== ct + cp) continue;
        const tb = [tripR, tripR, tripR, pairR, pairR];
        if (!best || cmpArr(tb, best.tb) > 0) best = { cat: CATEGORY.FULL_HOUSE, tb };
      }
    }
    if (best) return best;
  }

  // Flush (all reals one suit; flushMin lets "Almost a Flush" count 4 same-suit as a flush).
  {
    let best: { cat: number; tb: number[] } | null = null;
    for (const suit of SUITS) {
      const inS = reals.filter((r) => r.suit === suit);
      if (reals.length !== inS.length) continue;
      if (inS.length + w < flushMin) continue;
      if (n < flushMin) continue;
      const ranks = inS.map((r) => r.rv).sort((a, b) => b - a);
      const tb = fillWildRanks(ranks, w).slice(0, 5);
      if (!best || cmpArr(tb, best.tb) > 0) best = { cat: CATEGORY.FLUSH, tb };
    }
    if (best) return best;
  }

  // Straight.
  if (n === 5) {
    const rvs = reals.map((r) => r.rv);
    if (new Set(rvs).size === rvs.length) {
      let best = 0;
      for (const win of WINDOWS) {
        if (!rvs.every((rv) => win.ranks.has(rv))) continue;
        best = Math.max(best, win.high);
      }
      if (best > 0) return { cat: CATEGORY.STRAIGHT, tb: [best] };
    }
  }

  // Trips.
  if (n >= 3) {
    const best = matchGroup(reals, w, n, [3], CATEGORY.TRIPS, cnt);
    if (best) return best;
  }
  // Two pair.
  if (n >= 4) {
    const best = matchGroup(reals, w, n, [2, 2], CATEGORY.TWO_PAIR, cnt);
    if (best) return best;
  }
  // Pair.
  if (n >= 2) {
    const best = matchGroup(reals, w, n, [2], CATEGORY.PAIR, cnt);
    if (best) return best;
  }

  // High card (reachable only when w === 0, since a wild always makes at least a pair for n≥2).
  const desc = reals.map((r) => r.rv).sort((a, b) => b - a);
  return { cat: CATEGORY.HIGH, tb: fillWildRanks(desc, w).slice(0, n) };
}

/** Feasibility for count-based categories (pair/two-pair/trips): target `groupSizes` ranks. */
function matchGroup(
  reals: Real[],
  w: number,
  n: number,
  groupSizes: number[],
  cat: number,
  cnt: (rv: number) => number
): { cat: number; tb: number[] } | null {
  let best: { cat: number; tb: number[] } | null = null;
  const pick = (chosen: number[], startRank: number, wildUsed: number, realUsed: number) => {
    if (chosen.length === groupSizes.length) {
      const kickerSlots = n - groupSizes.reduce((a, b) => a + b, 0);
      const others = reals.length - realUsed;
      const wildsLeft = w - wildUsed;
      if (others > kickerSlots || others + wildsLeft !== kickerSlots) return;
      const usedSet = new Set(chosen);
      const otherRvs = reals.filter((r) => !usedSet.has(r.rv)).map((r) => r.rv).sort((a, b) => b - a);
      const kickers = fillWildRanks(otherRvs, wildsLeft).slice(0, kickerSlots);
      const tb: number[] = [];
      chosen.forEach((rv, i) => {
        for (let k = 0; k < groupSizes[i]; k++) tb.push(rv);
      });
      tb.push(...kickers);
      if (!best || cmpArr(tb, best.tb) > 0) best = { cat, tb };
      return;
    }
    const size = groupSizes[chosen.length];
    for (let rq = startRank; rq >= 2; rq--) {
      const c = cnt(rq);
      const need = size - c;
      if (need < 0 || wildUsed + need > w) continue;
      pick([...chosen, rq], rq - 1, wildUsed + need, realUsed + c);
    }
  };
  pick([], 14, 0, 0);
  return best;
}

/** Whether a single card acts as wild under the given effect (for UI highlighting). */
export function isWildCard(card: PokerCard, effect: CaddyEffect): boolean {
  switch (effect.kind) {
    case 'wildRanks':
      return effect.ranks.includes(card.rank);
    case 'wildCards':
      return effect.cardIds.includes(card.id);
    default:
      return false;
  }
}

/** Which selected cards act as wild under the given effect. */
function wildFlags(cards: PokerCard[], effect: CaddyEffect): boolean[] {
  return cards.map((c) => isWildCard(c, effect));
}

/**
 * Evaluate a player's selected ≤5-card hand, applying their caddy effect.
 * Returns the poker category, tiebreakers, and a display name.
 */
export function evaluateHand(cards: PokerCard[], effect: CaddyEffect = { kind: 'none' }): HandResult {
  if (cards.length === 0) return { cat: -1, tb: [], name: 'No Hand' };

  // "Suit manipulation" (In the Black / Seeing Red): the listed suits all count as one suit.
  let evalCards = cards;
  if (effect.kind === 'sameSuit') {
    const canon = effect.suits[0];
    evalCards = cards.map((c) => (effect.suits.includes(c.suit) ? { ...c, suit: canon } : c));
  }

  const flags = wildFlags(evalCards, effect);
  const w = flags.filter(Boolean).length;
  const reals: Real[] = evalCards
    .filter((_, i) => !flags[i])
    .map((c) => ({ rv: RANK_VAL[c.rank], suit: c.suit }));
  const flushMin = effect.kind === 'flushCount' ? effect.count : 5;

  let base =
    w > 0
      ? bestWithWilds(reals, w, flushMin)
      : rankConcrete(
          evalCards.map((c) => RANK_VAL[c.rank]),
          evalCards.map((c) => c.suit)
        );

  // "Almost a Flush": an N-same-suit hand (default 4) counts as a full flush.
  if (effect.kind === 'flushCount' && w === 0 && base.cat < CATEGORY.FLUSH) {
    const bySuit = new Map<Suit, number[]>();
    for (const c of evalCards) {
      const arr = bySuit.get(c.suit) ?? [];
      arr.push(RANK_VAL[c.rank]);
      bySuit.set(c.suit, arr);
    }
    for (const ranks of bySuit.values()) {
      if (ranks.length >= effect.count) {
        base = { cat: CATEGORY.FLUSH, tb: ranks.sort((a, b) => b - a) };
        break;
      }
    }
  }

  // "Three to Tee": an N-card straight run (default 4) counts as a full straight.
  if (effect.kind === 'straightCount' && base.cat < CATEGORY.STRAIGHT) {
    const high = bestRun(evalCards.map((c) => RANK_VAL[c.rank]));
    if (high.length >= effect.count) base = { cat: CATEGORY.STRAIGHT, tb: [high.high] };
  }

  // "Pair Up" / "Trips to Quads": promote one category to another.
  if (effect.kind === 'upgrade' && base.cat === effect.from) {
    base = { cat: effect.to, tb: base.tb };
  }

  return { cat: base.cat, tb: base.tb, name: HAND_NAMES[base.cat] ?? 'High Card' };
}

/** Longest run of consecutive distinct ranks (Ace counts high and low). */
function bestRun(rankValues: number[]): { length: number; high: number } {
  const set = new Set(rankValues);
  if (set.has(14)) set.add(1); // Ace low, for A-2-3-4 style runs
  const sorted = [...set].sort((a, b) => a - b);
  let best = { length: 0, high: 0 };
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    run = i > 0 && sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    if (run > best.length) best = { length: run, high: sorted[i] };
  }
  return best;
}

/** Compare two results (positive if `a` beats `b`). */
export function compareHands(a: HandResult, b: HandResult): number {
  if (a.cat !== b.cat) return a.cat - b.cat;
  return cmpArr(a.tb, b.tb);
}

/** Indices of the winning hand(s); ties yield co-winners. */
export function pickWinners(results: HandResult[]): number[] {
  if (results.length === 0) return [];
  let bestIdx = 0;
  for (let i = 1; i < results.length; i++) {
    if (compareHands(results[i], results[bestIdx]) > 0) bestIdx = i;
  }
  return results
    .map((r, i) => (compareHands(r, results[bestIdx]) === 0 ? i : -1))
    .filter((i) => i >= 0);
}
