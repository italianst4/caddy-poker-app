import type { ImageSourcePropType } from 'react-native';

export type CardType = 'white' | 'black' | 'matchup' | 'caddy';
export type GameMode = 'amateur' | 'pro';

export type Card = {
  id: string;
  name: string;
  type: CardType;
  image: ImageSourcePropType;
  /** Caddy cards: the rule text printed on the card (transcribed from the art). */
  details?: string;
  /** Caddy cards: the card's category label (e.g. "Wild Card", "Suit Manipulation"). */
  category?: string;
};

/**
 * The card manifest, built from the supplied artwork in assets/cards/{white,black,matchup}.
 *
 * - `white`   challenge cards — drawn in BOTH amateur and pro modes.
 * - `black`   challenge cards — drawn ONLY in pro mode.
 * - `matchup` cards — drawn in BOTH modes; trigger a head-to-head for the whole group.
 *
 * Display names are derived from the file names. To add/replace a card, drop the PNG in the
 * matching folder and add an entry here.
 */
export const CARDS: Card[] = [
  // ---- White-tee (amateur) challenges ----
  { id: 'w-bogey-train', name: 'Bogey Train', type: 'white', image: require('../../assets/cards/white/Bogey-Train.png') },
  { id: 'w-cap-the-damage', name: 'Cap the Damage', type: 'white', image: require('../../assets/cards/white/Cap-the-Damage.png') },
  { id: 'w-find-it', name: 'Find It', type: 'white', image: require('../../assets/cards/white/Find-It.png') },
  { id: 'w-greenlight', name: 'Greenlight', type: 'white', image: require('../../assets/cards/white/Greenlight.png') },
  { id: 'w-lag-it-close', name: 'Lag It Close', type: 'white', image: require('../../assets/cards/white/Lag-It-Close.png') },
  { id: 'w-make-par', name: 'Make Par', type: 'white', image: require('../../assets/cards/white/Make-Par.png') },
  { id: 'w-no-snowman', name: 'No Snowman', type: 'white', image: require('../../assets/cards/white/No-Snowman.png') },
  { id: 'w-no-three-jacks', name: 'No Three Jacks', type: 'white', image: require('../../assets/cards/white/No-Three-Jacks.png') },
  { id: 'w-not-the-goat', name: 'Not the Goat', type: 'white', image: require('../../assets/cards/white/Not-the-Goat.png') },
  { id: 'w-one-and-done', name: 'One and Done', type: 'white', image: require('../../assets/cards/white/One-and-Done.png') },
  { id: 'w-skip-the-beach', name: 'Skip the Beach', type: 'white', image: require('../../assets/cards/white/Skip-the-Beach.png') },
  { id: 'w-split-the-fairway', name: 'Split the Fairway', type: 'white', image: require('../../assets/cards/white/Split-the-Fairway.png') },
  { id: 'w-stay-dry', name: 'Stay Dry', type: 'white', image: require('../../assets/cards/white/Stay-Dry.png') },
  { id: 'w-tree-free', name: 'Tree Free', type: 'white', image: require('../../assets/cards/white/Tree-Free.png') },

  // ---- Black-tee (pro-only) challenges ----
  { id: 'b-birdie-hunter', name: 'Birdie Hunter', type: 'black', image: require('../../assets/cards/black/Birdie-Hunter.png') },
  { id: 'b-drain-the-bomb', name: 'Drain the Bomb', type: 'black', image: require('../../assets/cards/black/Drain-the-Bomb.png') },
  { id: 'b-go-for-it', name: 'Go For It', type: 'black', image: require('../../assets/cards/black/Go-For-It.png') },
  { id: 'b-nuke-it', name: 'Nuke It', type: 'black', image: require('../../assets/cards/black/Nuke-It.png') },

  // ---- Matchup cards (both modes) ----
  { id: 'm-closest-to-the-pin', name: 'Closest to the Pin', type: 'matchup', image: require('../../assets/cards/matchup/Closest-to-the-Pin.png') },
  { id: 'm-long-ball', name: 'Long Ball', type: 'matchup', image: require('../../assets/cards/matchup/Long-Ball.png') },
];

export const isMatchup = (c: Card): boolean => c.type === 'matchup';

/**
 * Build the per-round draw pool, INCLUDING duplicate copies:
 *   - 2 copies of each white card
 *   - 1 copy of each black card (pro mode only)
 *   - 1 copy of each matchup card (both modes)
 *
 * Duplicates are real array slots, so two players can draw the same white challenge in a
 * hole. `drawDistinct` selects distinct slots, which preserves that behaviour.
 */
export function buildDrawPool(mode: GameMode, includeMatchups = true): Card[] {
  const pool: Card[] = [];
  for (const card of CARDS) {
    if (card.type === 'white') {
      pool.push(card, card); // 2 copies
    } else if (card.type === 'matchup') {
      if (includeMatchups) pool.push(card); // 1 copy, both modes (unless disabled)
    } else if (card.type === 'black' && mode === 'pro') {
      pool.push(card); // 1 copy, pro only
    }
  }
  return pool;
}

/**
 * Draw `n` distinct slots from `pool` (Fisher–Yates partial shuffle). Because `pool` may
 * contain duplicate cards, the same card can legitimately be returned more than once.
 */
export function drawDistinct(pool: Card[], n: number): Card[] {
  const items = pool.slice();
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, Math.min(n, items.length));
}

/** Resolve a card id back to its card (used when rehydrating persisted state). */
export function cardById(id: string): Card | undefined {
  return CARDS.find((c) => c.id === id);
}
