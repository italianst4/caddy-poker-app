import { requireOptionalNativeModule } from 'expo-modules-core';

export type LiveActivityGolfer = {
  name: string;
  avatarIndex: number;
  challenge: string;
  result: string; // "", "achieved", "failed"
  cards: number; // running poker-card count so far
};

export type LiveActivityPayload = {
  hole: number;
  phase: string;
  /** Non-empty on matchup holes = the shared head-to-head challenge text. */
  matchup: string;
  golfers: LiveActivityGolfer[];
};

type LiveActivityNativeModule = {
  areEnabled(): boolean;
  start(payload: LiveActivityPayload): void;
  update(payload: LiveActivityPayload): void;
  end(): void;
};

// Optional: null on Android / older iOS / when the module isn't linked.
export default requireOptionalNativeModule<LiveActivityNativeModule>('LiveActivity');
