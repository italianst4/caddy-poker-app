import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useGame } from '../store/gameStore';
import { liveActivity } from '../liveActivity';

/**
 * Drives the iOS Live Activity from the game store. Mounted once (in App.tsx, like
 * BackgroundMusic). No UI. Starts a Live Activity while a round is in progress and the
 * "Show Live Activity" toggle is on, updates it as challenges/holes/results change, and
 * ends it when the round ends or the toggle is turned off. No-ops on Android / older iOS.
 */
export function LiveActivityController() {
  const step = useGame((s) => s.step);
  const showLiveActivity = useGame((s) => s.showLiveActivity);
  // Fields that should trigger a Live Activity refresh while active:
  const currentHole = useGame((s) => s.currentHole);
  const phase = useGame((s) => s.phase);
  const assignment = useGame((s) => s.assignment);
  const results = useGame((s) => s.results);
  const matchup = useGame((s) => s.matchup);
  const holeCards = useGame((s) => s.holeCards);
  const players = useGame((s) => s.players);

  const active = Platform.OS === 'ios' && step === 'round' && showLiveActivity;

  // Start when the round becomes active; end when it stops (or on unmount).
  useEffect(() => {
    if (!active) {
      liveActivity.end();
      return;
    }
    if (!liveActivity.areEnabled()) return;
    liveActivity.start(useGame.getState());
    return () => {
      liveActivity.end();
    };
  }, [active]);

  // Live updates while active.
  useEffect(() => {
    if (!active || !liveActivity.areEnabled()) return;
    liveActivity.update(useGame.getState());
  }, [active, currentHole, phase, assignment, results, matchup, holeCards, players]);

  return null;
}
