import { cardById } from './cards';

/**
 * The short challenge text for a card, falling back to the card's display name if the card has no
 * challenge line (so a Live Activity row always has something to show).
 */
export function challengeText(cardId: string | undefined): string {
  if (!cardId) return '';
  const card = cardById(cardId);
  return card?.challenge || card?.name || '';
}
