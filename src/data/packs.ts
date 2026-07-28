import type { ImageSourcePropType } from 'react-native';
import { CARDS, type Card } from './cards';
import { CADDY_CARDS } from './caddyCards';

/**
 * Card packs — the ownable/openable unit of content. Six challenge packs each hold the cards whose
 * `pack` matches their id (see cards.ts); the caddy pack holds the CADDY_CARDS. `standard` is the
 * free, required starter a new player opens before their first round; the others are free to open
 * from the Card Packs screen. This is the seam a future earn/purchase economy plugs into.
 */
export type PackId =
  | 'standard'
  | 'the-tips'
  | 'league'
  | 'etiquette'
  | 'mulligans'
  | 'matchups'
  | 'caddy';

export type PackCategory = 'challenge' | 'caddy';

export type Pack = {
  id: PackId;
  name: string;
  /** Name shown on the Card Packs grid, if it should differ from `name`. */
  gridName?: string;
  /** Heading shown on the open/browse (reveal) screen. */
  openTitle: string;
  category: PackCategory;
  /** Short line shown under the name / below the pack. */
  tagline: string;
  /** Punchy blurb shown below the (unopened) pack on the Card Packs view. */
  blurb: string;
  /** The required free starter. Others are free-to-open for now. */
  free: boolean;
  /** Pack art shown before opening (and in the Card Packs list). */
  front: ImageSourcePropType;
  /** Pack art the front flips to during the open animation. */
  packBack: ImageSourcePropType;
  /** Torn-open pack front, overlaid on the bottom of the fanned cards (opened packs). */
  ripped: ImageSourcePropType;
  /** Color for the pack-name label baked over the art (defaults to white). */
  labelColor?: string;
};

const NAVY = '#17324E';

export const PACKS: Pack[] = [
  {
    id: 'standard',
    name: 'Standard',
    openTitle: 'Standard Challenges',
    category: 'challenge',
    tagline: 'The core on-course challenges.',
    blurb: 'Where every round starts. Clear these staple challenges to bank poker cards.',
    free: true,
    front: require('../../assets/cards/packs/packs-WhiteFront.png'),
    packBack: require('../../assets/cards/packs/packs-WhiteBack.png'),
    ripped: require('../../assets/cards/packs/packs-WhiteRipped.png'),
    labelColor: NAVY, // white art → navy label
  },
  {
    id: 'the-tips',
    name: 'The Tips',
    openTitle: 'The Tips Challenges',
    category: 'challenge',
    tagline: 'Tougher challenges for low handicappers.',
    blurb: 'Think you can hang? The Tips bring the challenges only real sticks will earn.',
    free: false,
    front: require('../../assets/cards/packs/packs-BlackFront.png'),
    packBack: require('../../assets/cards/packs/packs-BlackBack.png'),
    ripped: require('../../assets/cards/packs/packs-BlackRipped.png'),
  },
  {
    id: 'league',
    name: 'League',
    openTitle: 'League Challenges',
    category: 'challenge',
    tagline: 'Shot-making and scoring challenges.',
    blurb: 'Step up your game — League cards reward real shot-making and lower scores.',
    free: false,
    front: require('../../assets/cards/packs/packs-BlueFront.png'),
    packBack: require('../../assets/cards/packs/packs-BlueBack.png'),
    ripped: require('../../assets/cards/packs/packs-BlueRipped.png'),
  },
  {
    id: 'etiquette',
    name: 'Etiquette',
    openTitle: 'Etiquette Challenges',
    category: 'challenge',
    tagline: 'Good-partner conduct challenges.',
    blurb: 'Respect the game. Etiquette cards reward the little things that make a good playing partner.',
    free: false,
    front: require('../../assets/cards/packs/packs-PurpleFront.png'),
    packBack: require('../../assets/cards/packs/packs-PurpleBack.png'),
    ripped: require('../../assets/cards/packs/packs-PurpleRipped.png'),
    labelColor: NAVY, // light purple art → navy label
  },
  {
    id: 'mulligans',
    name: 'Mulligans',
    openTitle: 'Mulligans Challenges',
    category: 'challenge',
    tagline: 'Forgiving, keep-it-together challenges.',
    blurb: 'Everyone gets a break. Mulligans cards reward steady, mistake-free golf.',
    free: false,
    front: require('../../assets/cards/packs/packs-RedFront.png'),
    packBack: require('../../assets/cards/packs/packs-RedBack.png'),
    ripped: require('../../assets/cards/packs/packs-RedRipped.png'),
  },
  {
    id: 'matchups',
    name: 'Matchups',
    openTitle: 'Matchup Challenges',
    category: 'challenge',
    tagline: 'Head-to-head cards for the whole group.',
    blurb: 'Winner takes all. The group goes head-to-head, and the champ banks poker cards.',
    free: false,
    front: require('../../assets/cards/packs/packs-YellowFront.png'),
    packBack: require('../../assets/cards/packs/packs-YellowBack.png'),
    ripped: require('../../assets/cards/packs/packs-YellowRipped.png'),
    labelColor: NAVY, // yellow art → navy label
  },
  {
    id: 'caddy',
    name: 'Caddies',
    openTitle: 'Caddies',
    category: 'caddy',
    tagline: 'Caddy cards help improve your poker hand at the end.',
    blurb: 'Caddy cards give you wild cards and boost ups to improve your poker hand.',
    free: false,
    front: require('../../assets/cards/packs/packs-GreenFront.png'),
    packBack: require('../../assets/cards/packs/packs-GreenBack.png'),
    ripped: require('../../assets/cards/packs/packs-GreenRipped.png'),
  },
];

/** Display/list order (all packs). */
export const PACK_ORDER: PackId[] = [
  'mulligans',
  'standard',
  'league',
  'the-tips',
  'matchups',
  'etiquette',
  'caddy',
];

/** Challenge packs shown in the Card Packs "Challenge Packs" tab, in order. */
export const CHALLENGE_PACK_IDS: PackId[] = [
  'mulligans',
  'standard',
  'league',
  'the-tips',
  'matchups',
  'etiquette',
];

/** Caddy packs shown in the "Caddy Packs" tab (just the one for now). */
export const CADDY_PACK_IDS: PackId[] = ['caddy'];

/**
 * Per-pack color palette for the composed challenge-card face (see CardArt). Sampled from the pack
 * box art; light bands use navy ink + a white pill, dark bands (The Tips / Mulligans) use light
 * ink, and Standard uses an inverted navy pill so it reads on the near-white band. Caddy is unused
 * (caddy cards render their full art).
 */
export type PackTheme = {
  band: string;
  ink: string;
  divider: string;
  panel: string;
  pill: string;
  pillInk: string;
};

const CREAM = '#FBF5E6';

export const PACK_THEME: Record<PackId, PackTheme> = {
  standard: { band: '#EBEBEB', ink: NAVY, divider: NAVY, panel: '#FFFFFF', pill: NAVY, pillInk: '#FFFFFF' },
  // Dark-band packs whose illustrations have opaque white backgrounds: the divider matches the band
  // (invisible) so it doesn't leave a thin line above the white illustration.
  'the-tips': { band: '#323232', ink: CREAM, divider: '#323232', panel: '#FFFFFF', pill: CREAM, pillInk: '#323232' },
  league: { band: '#6FA0C4', ink: NAVY, divider: NAVY, panel: '#FFFFFF', pill: '#FFFFFF', pillInk: NAVY },
  etiquette: { band: '#ECAAFF', ink: NAVY, divider: NAVY, panel: '#FFFFFF', pill: '#FFFFFF', pillInk: NAVY },
  mulligans: { band: '#CB5043', ink: '#FFFFFF', divider: '#CB5043', panel: '#FFFFFF', pill: '#FFFFFF', pillInk: '#B23B2E' },
  matchups: { band: '#E0A52B', ink: NAVY, divider: NAVY, panel: '#FFFFFF', pill: '#FFFFFF', pillInk: NAVY },
  caddy: { band: '#3AA756', ink: '#FFFFFF', divider: '#FFFFFF', panel: '#FFFFFF', pill: '#FFFFFF', pillInk: '#1E5B32' },
};

export function packById(id: PackId): Pack {
  const pack = PACKS.find((p) => p.id === id);
  if (!pack) throw new Error(`Unknown pack id: ${id}`);
  return pack;
}

/** The cards contained in a pack, in manifest order. */
export function cardsInPack(id: PackId): Card[] {
  if (id === 'caddy') return CADDY_CARDS;
  return CARDS.filter((c) => c.pack === id);
}

/** Fresh-install ownership: a new player owns nothing until they open the free starter. */
export const NO_PACKS_OWNED: Record<PackId, boolean> = {
  standard: false,
  'the-tips': false,
  league: false,
  etiquette: false,
  mulligans: false,
  matchups: false,
  caddy: false,
};

/** Upgrade grant: existing players keep everything they already had access to. */
export const ALL_PACKS_OWNED: Record<PackId, boolean> = {
  standard: true,
  'the-tips': true,
  league: true,
  etiquette: true,
  mulligans: true,
  matchups: true,
  caddy: true,
};
