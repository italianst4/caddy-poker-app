import type { ImageSourcePropType } from 'react-native';
import { CARDS, type Card, type CardType } from './cards';
import { CADDY_CARDS } from './caddyCards';

/**
 * Card packs — the ownable/openable unit of content. Challenge packs map 1:1 onto a challenge
 * card `type` in the manifest (see cards.ts); the caddy pack holds the CADDY_CARDS. The Core Pack
 * is the free, required starter a new player must open before their first round; the others are
 * free to open from the Card Packs screen. This is the seam a future earn/purchase economy plugs
 * into.
 */
export type PackId = 'white-tees' | 'black-tees' | 'matchups' | 'caddy';

export type PackCategory = 'challenge' | 'caddy';

export type Pack = {
  id: PackId;
  name: string;
  /** Name shown on the Card Packs grid, if it should differ from `name`. */
  gridName?: string;
  /** Heading shown on the open/browse (reveal) screen. */
  openTitle: string;
  category: PackCategory;
  /** Links the pack to the cards it contains (challenge packs via CARDS `type`; caddy via CADDY_CARDS). */
  cardType: CardType;
  /** Short line shown under the name / below the pack. */
  tagline: string;
  /** Punchy blurb shown below the (unopened) pack on the Card Packs view. */
  blurb: string;
  /** The required free starter (Core Pack). Others are free-to-open for now. */
  free: boolean;
  /** Pack art shown before opening (and in the Card Packs list). */
  front: ImageSourcePropType;
  /** Pack art the front flips to during the open animation. */
  packBack: ImageSourcePropType;
  /** Color for the pack-name label baked over the art (defaults to white). */
  labelColor?: string;
};

export const PACKS: Pack[] = [
  {
    // Internal id kept as 'white-tees' (persisted ownership + draw-pool wiring key on it); the
    // display is the green "Core Pack".
    id: 'white-tees',
    name: 'Challenge Cards',
    gridName: 'Standard',
    openTitle: 'Standard Challenges',
    category: 'challenge',
    cardType: 'white',
    tagline: 'The core challenges — required to play.',
    blurb: 'Where every round starts. Clear these on-course challenges to bank poker cards.',
    free: true,
    front: require('../../assets/card-packs/packs-GreenFront.png'),
    packBack: require('../../assets/card-packs/packs-GreenBack.png'),
  },
  {
    id: 'black-tees',
    name: 'The Tips',
    openTitle: 'The Tips Challenges',
    category: 'challenge',
    cardType: 'black',
    tagline: 'Tougher pro-tee challenges for low handicappers.',
    blurb: 'Think you can hang? Tips cards bring the tougher challenges only real sticks will earn.',
    free: false,
    front: require('../../assets/card-packs/packs-BlackFront.png'),
    packBack: require('../../assets/card-packs/packs-BlackBack.png'),
  },
  {
    id: 'matchups',
    name: 'Matchups',
    openTitle: 'Matchup Challenges',
    category: 'challenge',
    cardType: 'matchup',
    tagline: 'Head-to-head cards that pit the whole group against each other.',
    blurb: 'Winner takes all. The whole group goes head-to-head, and the champ banks 2 poker cards.',
    free: false,
    front: require('../../assets/card-packs/packs-RedFront.png'),
    packBack: require('../../assets/card-packs/packs-RedBack.png'),
  },
  {
    id: 'caddy',
    name: 'Caddies',
    openTitle: 'Caddies',
    category: 'caddy',
    cardType: 'caddy',
    tagline: 'Caddy cards help improve your poker hand at the end.',
    blurb: 'Caddy cards give you wild cards and boost ups to improve your poker hand.',
    free: false,
    front: require('../../assets/card-packs/packs-WhiteFront.png'),
    packBack: require('../../assets/card-packs/packs-WhiteBack.png'),
    // White pack art → dark navy label so "CADDIES" reads on the light band.
    labelColor: '#102445',
  },
];

/** Display/list order (all packs). */
export const PACK_ORDER: PackId[] = ['white-tees', 'black-tees', 'matchups', 'caddy'];

/** Challenge packs shown in the Card Packs "Challenge Packs" tab, in order. */
export const CHALLENGE_PACK_IDS: PackId[] = ['white-tees', 'black-tees', 'matchups'];

/** Caddy packs shown in the "Caddy Packs" tab (just the one for now). */
export const CADDY_PACK_IDS: PackId[] = ['caddy'];

export function packById(id: PackId): Pack {
  const pack = PACKS.find((p) => p.id === id);
  if (!pack) throw new Error(`Unknown pack id: ${id}`);
  return pack;
}

/** The cards contained in a pack, in manifest order. */
export function cardsInPack(id: PackId): Card[] {
  if (id === 'caddy') return CADDY_CARDS;
  const { cardType } = packById(id);
  return CARDS.filter((c) => c.type === cardType);
}

/** Fresh-install ownership: a new player owns nothing until they open the free starter. */
export const NO_PACKS_OWNED: Record<PackId, boolean> = {
  'white-tees': false,
  'black-tees': false,
  'matchups': false,
  'caddy': false,
};

/** Upgrade grant: existing players keep everything they already had access to. */
export const ALL_PACKS_OWNED: Record<PackId, boolean> = {
  'white-tees': true,
  'black-tees': true,
  'matchups': true,
  'caddy': true,
};
