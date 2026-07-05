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
