import { cardById } from './cards';
import challenges from './challenges.json';

/** The challenge instruction text printed on a card (transcribed from the artwork). */
export type ChallengeInfo = {
  /** The "CHALLENGE" line, e.g. "Bogey or better". */
  challenge: string;
  /** The card's category subtitle, e.g. "No-Disaster", "Black Tier", "Matchup". */
  category: string;
  /** Tee/tier label: "White" | "Black" | "Matchup". */
  tee: string;
};

const CHALLENGES = challenges as Record<string, ChallengeInfo>;

/** Look up the challenge info for a challenge card id (white/black/matchup). */
export function challengeFor(cardId: string | undefined): ChallengeInfo | undefined {
  return cardId ? CHALLENGES[cardId] : undefined;
}

/**
 * The short challenge text for a card, falling back to the card's display name if no
 * transcription exists (so a Live Activity row always has something to show).
 */
export function challengeText(cardId: string | undefined): string {
  if (!cardId) return '';
  return CHALLENGES[cardId]?.challenge ?? cardById(cardId)?.name ?? '';
}
