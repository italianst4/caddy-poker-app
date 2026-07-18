import { useEffect } from 'react';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { DeviceMotion } from 'expo-sensors';

/**
 * A 3D tilt driven by the device's orientation. Returns `rx`/`ry` (degrees) that a caller feeds
 * into a `rotateX`/`rotateY` transform (with `perspective`), so a pack leans with the phone — as
 * if you're turning it over in your hand. Tilt is relative to how the phone is held on mount and
 * clamped so it stays subtle. No-op on devices without motion (e.g. the simulator).
 */
export function usePackTilt(): { rx: SharedValue<number>; ry: SharedValue<number> } {
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  useEffect(() => {
    const base: { beta: number | null; gamma: number | null } = { beta: null, gamma: null };
    DeviceMotion.setUpdateInterval(40);
    const sub = DeviceMotion.addListener((d) => {
      const rot = d.rotation;
      if (!rot) return;
      if (base.beta == null) { base.beta = rot.beta; base.gamma = rot.gamma; }
      const DEG = 180 / Math.PI;
      const GAIN = 1.4;
      const MAX = 20;
      const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));
      rx.value = withTiming(clamp(-(rot.beta - (base.beta ?? 0)) * DEG * GAIN), { duration: 80 });
      ry.value = withTiming(clamp((rot.gamma - (base.gamma ?? 0)) * DEG * GAIN), { duration: 80 });
    });
    return () => sub.remove();
  }, [rx, ry]);
  return { rx, ry };
}
