import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Card-flip haptics — tuned in one place so the "feel" can be adjusted centrally.
 *
 * The pair is meant to read like a physical card: a subtle lift as it starts to turn, then a
 * firm snap when it lands. Calls are fire-and-forget (never awaited on the UI thread).
 * No-op on web. On Android we use the modern predictive-haptics API — `impactAsync` there
 * routes through the legacy Vibrator and feels buzzy.
 */

/** Subtle "lift" as the card begins to flip. */
export function hapticFlipStart(): void {
  if (Platform.OS === 'web') return;
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Gesture_Start).catch(() => {});
    return;
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
}

/** Satisfying "snap" when the card lands face-up. */
export function hapticFlipEnd(): void {
  if (Platform.OS === 'web') return;
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
    return;
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
}

/** Fire a single impact (no-op on web); swallow errors. */
function impact(style: Haptics.ImpactFeedbackStyle): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(style).catch(() => {});
}

/**
 * A build-up "buzz" that EASES IN and SPEEDS UP over ~`duration` ms: impacts start sparse and
 * light, then fire at ever-shorter intervals with rising intensity toward the end — a crescendo
 * that lands right as the pack flips open. Returns a cancel fn to stop any pending buzzes.
 * No-op on web.
 */
export function rampingBuzz(duration = 520): () => void {
  if (Platform.OS === 'web') return () => {};
  const S = Haptics.ImpactFeedbackStyle;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let t = 0;
  let gap = 120; // starting interval (ms) — sparse at first
  while (t < duration) {
    const at = t;
    // Intensity climbs as we approach the open: Light → Medium → Heavy.
    const style = at < duration * 0.4 ? S.Light : at < duration * 0.75 ? S.Medium : S.Heavy;
    timers.push(setTimeout(() => impact(style), at));
    gap = Math.max(22, gap * 0.72); // each gap shorter than the last → speeds up
    t += gap;
  }
  return () => {
    for (const id of timers) clearTimeout(id);
  };
}

/**
 * A crisp camera-"shutter" snap — a firm click with a quick soft release right after. Used for
 * the first taps on a sealed pack. No-op on web.
 */
export function shutter(): void {
  if (Platform.OS === 'web') return;
  const S = Haptics.ImpactFeedbackStyle;
  impact(S.Rigid);
  setTimeout(() => impact(S.Light), 45);
}

/**
 * A sustained "rumble" for ~`duration` ms: firm impacts fired at a steady fast cadence so it reads
 * as one continuous rumble (expo-haptics has no true continuous motor). Alternates Heavy/Medium for
 * a rolling texture. Returns a cancel fn to stop it early (e.g. on unmount). No-op on web.
 */
export function rumble(duration = 1000): () => void {
  if (Platform.OS === 'web') return () => {};
  const S = Haptics.ImpactFeedbackStyle;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const gap = 55;
  let t = 0;
  let i = 0;
  while (t < duration) {
    const at = t;
    const style = i % 2 === 0 ? S.Heavy : S.Medium;
    timers.push(setTimeout(() => impact(style), at));
    t += gap;
    i += 1;
  }
  return () => {
    for (const id of timers) clearTimeout(id);
  };
}

/** A big celebratory jolt for the pack "explosion" as it bursts open. No-op on web. */
export function bigPop(): void {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  impact(Haptics.ImpactFeedbackStyle.Heavy);
  setTimeout(() => impact(Haptics.ImpactFeedbackStyle.Heavy), 80);
  setTimeout(() => impact(Haptics.ImpactFeedbackStyle.Rigid), 160);
}
