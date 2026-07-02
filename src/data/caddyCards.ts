import type { Card } from './cards';

/** Shared back for caddy cards. */
export const CADDY_BACK = require('../../assets/cards/caddy-card-back.png');

/** The caddy deck — bonus cards drawn after the round to improve a poker hand. */
export const CADDY_CARDS: Card[] = [
  { id: 'almost-a-flush', name: 'Almost a Flush', type: 'caddy', image: require('../../assets/cards/caddy/almost-a-flush.png') },
  { id: 'dead-mans-hand', name: "Dead Man's Hand", type: 'caddy', image: require('../../assets/cards/caddy/dead-mans-hand.png') },
  { id: 'deuces-wild', name: 'Deuces Wild', type: 'caddy', image: require('../../assets/cards/caddy/deuces-wild.png') },
  { id: 'in-the-black', name: 'In the Black', type: 'caddy', image: require('../../assets/cards/caddy/in-the-black.png') },
  { id: 'mulligan-draw', name: 'Mulligan Draw', type: 'caddy', image: require('../../assets/cards/caddy/mulligan-draw.png') },
  { id: 'one-eyed-caddies', name: 'One-Eyed Caddies', type: 'caddy', image: require('../../assets/cards/caddy/one-eyed-caddies.png') },
  { id: 'pair-up', name: 'Pair Up', type: 'caddy', image: require('../../assets/cards/caddy/pair-up.png') },
  { id: 'pocket-aces', name: 'Pocket Aces', type: 'caddy', image: require('../../assets/cards/caddy/pocket-aces.png') },
  { id: 'seeing-red', name: 'Seeing Red', type: 'caddy', image: require('../../assets/cards/caddy/seeing-red.png') },
  { id: 'the-kings-suicide', name: "The King's Suicide", type: 'caddy', image: require('../../assets/cards/caddy/the-kings-suicide.png') },
  { id: 'three-to-tee', name: 'Three to Tee', type: 'caddy', image: require('../../assets/cards/caddy/three-to-tee.png') },
  { id: 'trips-to-quads', name: 'Trips to Quads', type: 'caddy', image: require('../../assets/cards/caddy/trips-to-quads.png') },
];

export function caddyById(id: string): Card | undefined {
  return CADDY_CARDS.find((c) => c.id === id);
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
