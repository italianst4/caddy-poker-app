import type { Card } from './cards';
import { CATEGORY, type CaddyEffect } from './pokerDeck';

/** Shared back for caddy cards. */
export const CADDY_BACK = require('../../assets/cards/caddy-card-back.png');

/**
 * The caddy deck — bonus cards drawn after the round to improve a poker hand.
 * `category` and `details` are transcribed from the printed card art (see CADDY_EFFECTS
 * for the matching mechanical effect applied in the virtual poker finale).
 */
export const CADDY_CARDS: Card[] = [
  { id: 'almost-a-flush', name: 'Almost a Flush', type: 'caddy', image: require('../../assets/cards/caddy/almost-a-flush.png'), category: 'Suit Manipulation', details: 'A 4-card flush counts as a full flush' },
  { id: 'dead-mans-hand', name: "Dead Man's Hand", type: 'caddy', image: require('../../assets/cards/caddy/dead-mans-hand.png'), category: 'Wild Card', details: 'All aces and eights are wild' },
  { id: 'deuces-wild', name: 'Deuces Wild', type: 'caddy', image: require('../../assets/cards/caddy/deuces-wild.png'), category: 'Wild Card', details: '2s are wild' },
  { id: 'in-the-black', name: 'In the Black', type: 'caddy', image: require('../../assets/cards/caddy/in-the-black.png'), category: 'Suit Manipulation', details: 'All black cards are one suit' },
  { id: 'mulligan-draw', name: 'Mulligan Draw', type: 'caddy', image: require('../../assets/cards/caddy/mulligan-draw.png'), category: 'Draw & Swap', details: 'Draw 2 extra cards, keep 1' },
  { id: 'one-eyed-caddies', name: 'One-Eyed Caddies', type: 'caddy', image: require('../../assets/cards/caddy/one-eyed-caddies.png'), category: 'Wild Card', details: 'Jack of spades and jack of hearts are wild' },
  { id: 'pair-up', name: 'Pair Up', type: 'caddy', image: require('../../assets/cards/caddy/pair-up.png'), category: 'Hand Booster', details: 'Pairs count as three-of-a-kind' },
  { id: 'pocket-aces', name: 'Pocket Aces', type: 'caddy', image: require('../../assets/cards/caddy/pocket-aces.png'), category: 'Wild Card', details: 'Aces are wild' },
  { id: 'seeing-red', name: 'Seeing Red', type: 'caddy', image: require('../../assets/cards/caddy/seeing-red.png'), category: 'Suit Manipulation', details: 'All red cards are one suit' },
  { id: 'the-kings-suicide', name: "The King's Suicide", type: 'caddy', image: require('../../assets/cards/caddy/the-kings-suicide.png'), category: 'Wild Card', details: 'King of hearts is wild' },
  { id: 'three-to-tee', name: 'Three to Tee', type: 'caddy', image: require('../../assets/cards/caddy/three-to-tee.png'), category: 'Straight Helper', details: 'A 4-card straight counts as a full straight' },
  { id: 'trips-to-quads', name: 'Trips to Quads', type: 'caddy', image: require('../../assets/cards/caddy/trips-to-quads.png'), category: 'Hand Booster', details: 'Three-of-a-kind counts as four-of-a-kind' },
];

export function caddyById(id: string): Card | undefined {
  return CADDY_CARDS.find((c) => c.id === id);
}

/**
 * Functional effect each caddy card has on a player's poker hand when the virtual poker deck
 * is enabled. `wild*`/`floor`/`upgrade`/`flushCount` alter hand evaluation; `addCards`/`redraw`
 * change the cards dealt before selection. Cards with no entry have no effect.
 */
export const CADDY_EFFECTS: Record<string, CaddyEffect> = {
  // Wild Card
  'deuces-wild': { kind: 'wildRanks', ranks: ['2'] },
  'dead-mans-hand': { kind: 'wildRanks', ranks: ['A', '8'] },
  'pocket-aces': { kind: 'wildRanks', ranks: ['A'] },
  'one-eyed-caddies': { kind: 'wildCards', cardIds: ['J-S', 'J-H'] }, // jack of spades & hearts
  'the-kings-suicide': { kind: 'wildCards', cardIds: ['K-H'] }, // king of hearts
  // Suit Manipulation — the listed suits all count as one suit for a flush.
  'in-the-black': { kind: 'sameSuit', suits: ['S', 'C'] },
  'seeing-red': { kind: 'sameSuit', suits: ['H', 'D'] },
  // Hand Booster / Straight Helper
  'pair-up': { kind: 'upgrade', from: CATEGORY.PAIR, to: CATEGORY.TRIPS },
  'trips-to-quads': { kind: 'upgrade', from: CATEGORY.TRIPS, to: CATEGORY.QUADS },
  'almost-a-flush': { kind: 'flushCount', count: 4 },
  'three-to-tee': { kind: 'straightCount', count: 4 },
  // Draw & Swap (applied when cards are dealt)
  'mulligan-draw': { kind: 'drawKeep', draw: 2, keep: 1 },
};

/** The effect for a caddy card id (a no-op `none` effect if unknown). */
export function caddyEffect(id: string | undefined): CaddyEffect {
  return (id && CADDY_EFFECTS[id]) || { kind: 'none' };
}

/** Draw `n` distinct random caddy cards (Fisher–Yates partial shuffle). */
export function drawCaddies(n: number): string[] {
  const pool = CADDY_CARDS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length)).map((c) => c.id);
}
