import LiveActivity, { type LiveActivityPayload } from '../modules/expo-live-activity';
import { challengeText } from './data/challenges';
import type { useGame } from './store/gameStore';

type GameState = ReturnType<typeof useGame.getState>;

/** True when the native Live Activity module is linked and activities are enabled by the user. */
export function liveActivitiesEnabled(): boolean {
  return !!LiveActivity && LiveActivity.areEnabled();
}

function phaseLabel(phase: GameState['phase'], isMatchup: boolean): string {
  if (isMatchup) return ''; // the widget shows its own "Matchup!" banner
  switch (phase) {
    case 'pick':
      return 'Picking challenges';
    case 'transition':
      return 'Challenges set';
    case 'score':
      return 'Scoring';
    default:
      return '';
  }
}

/** Derive the Live Activity payload (each golfer's challenge for the current hole) from the store. */
export function buildLiveActivityPayload(s: GameState): LiveActivityPayload {
  const hole = s.currentHole;
  const holeCards = s.holeCards[hole] ?? [];
  const matchup = s.matchup[hole];

  const golfers = s.players.map((name, i) => {
    const avatarIndex = Math.max(0, Math.min(7, s.avatars[i] ?? i));
    const cards = s.pokerCardCount(i); // running poker-card total so far
    if (matchup) {
      // Head-to-head hole: everyone shares the one challenge (shown once); winner is marked.
      const result = matchup.winner === i ? 'achieved' : '';
      return { name, avatarIndex, challenge: '', result, cards };
    }
    const position = s.assignment[hole]?.[i];
    const cardId = position != null ? holeCards[position] : undefined;
    const result = s.results[hole]?.[i] ?? '';
    return { name, avatarIndex, challenge: challengeText(cardId), result, cards };
  });

  return {
    hole,
    phase: phaseLabel(s.phase, !!matchup),
    matchup: matchup ? challengeText(matchup.cardId) : '',
    golfers,
  };
}

export const liveActivity = {
  areEnabled: () => liveActivitiesEnabled(),
  start: (s: GameState) => LiveActivity?.start(buildLiveActivityPayload(s)),
  update: (s: GameState) => LiveActivity?.update(buildLiveActivityPayload(s)),
  end: () => LiveActivity?.end(),
};
