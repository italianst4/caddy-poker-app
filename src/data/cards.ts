import type { ImageSourcePropType } from 'react-native';
// Type-only import — erased at compile, so this does not create a runtime cycle with packs.ts
// (which imports CARDS from here).
import type { PackId } from './packs';
import { CARDS as GENERATED_CARDS } from './cards.generated';

/** Individual = per-player achieved/failed challenge; Matchup = head-to-head for the whole group. */
export type CardKind = 'individual' | 'matchup';

export type Card = {
  id: string; // `${pack}-${slug}` — pack-scoped, unique
  name: string;
  pack: PackId; // explicit pack membership
  kind: CardKind;
  /** Matchup cards only: allow selecting more than one winner (co-winners each earn the reward). */
  multiWinner: boolean;
  /** Short text shown on the card face (the "CHALLENGE" line). */
  challenge: string;
  /** Long detail text shown in the card's "How to win" overlay. */
  howToWin: string;
  /** Illustration art; optional so a card missing art falls back to a text placeholder. */
  image?: ImageSourcePropType;
  /** Caddy cards: the rule text printed on the card (transcribed from the art). */
  details?: string;
  /** Caddy cards: the card's category label (e.g. "Wild Card", "Suit Manipulation"). */
  category?: string;
};

/**
 * The challenge-card manifest, generated from `assets/cards/cards.csv` by `scripts/gen-cards.js`
 * (run `npm run gen:cards`). Each entry statically `require()`s its illustration under
 * `assets/cards/illustrations/<pack>/`. Caddy cards live separately in `caddyCards.ts`.
 */
export const CARDS: Card[] = GENERATED_CARDS;

export const isMatchup = (c: Card): boolean => c.kind === 'matchup';

/**
 * Build the per-round draw pool: one copy of each in-play challenge card. A card enters the pool
 * only if the player OWNS its pack AND that pack is enabled (`packEnabled`). Caddy cards are never
 * in `CARDS`, so they never enter the pool.
 */
export function buildDrawPool(
  ownedPacks: Record<PackId, boolean>,
  packEnabled: Record<PackId, boolean>
): Card[] {
  return CARDS.filter((c) => ownedPacks[c.pack] && packEnabled[c.pack]);
}

/** Draw `n` distinct cards from `pool` (Fisher–Yates partial shuffle). */
export function drawDistinct(pool: Card[], n: number): Card[] {
  const items = pool.slice();
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, Math.min(n, items.length));
}

/** Resolve a challenge-card id back to its card (used when rehydrating persisted state). */
export function cardById(id: string): Card | undefined {
  return CARDS.find((c) => c.id === id);
}
