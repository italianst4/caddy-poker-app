import { useEffect, useMemo } from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const SMOKE_COLORS = ['#C9CDD2', '#AEB4BB', '#E2E5E8', '#9AA0A8', '#D7DBDF'];
const PUFFS = 9;

type PuffCfg = {
  color: string;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  duration: number;
};

function Puff({ originX, originY, cfg }: { originX: number; originY: number; cfg: PuffCfg }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(cfg.delay, withTiming(1, { duration: cfg.duration, easing: Easing.out(Easing.quad) }));
  }, [p, cfg]);

  const style = useAnimatedStyle(() => {
    const t = p.value;
    return {
      transform: [
        { translateX: Math.cos(cfg.angle) * cfg.distance * t },
        { translateY: Math.sin(cfg.angle) * cfg.distance * t - 24 * t }, // drift up like smoke
        { scale: 0.4 + 1.9 * t },
      ],
      opacity: interpolate(t, [0, 0.18, 1], [0, 0.5, 0]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: originX - cfg.size / 2,
          top: originY - cfg.size / 2,
          width: cfg.size,
          height: cfg.size,
          borderRadius: cfg.size / 2,
          backgroundColor: cfg.color,
        },
        style,
      ]}
    />
  );
}

/** A soft expanding puff of smoke emanating from (originX, originY). */
export function SmokePuff({ originX, originY }: { originX: number; originY: number }) {
  const puffs = useMemo<PuffCfg[]>(() => {
    return Array.from({ length: PUFFS }, () => ({
      color: SMOKE_COLORS[Math.floor(Math.random() * SMOKE_COLORS.length)],
      angle: Math.random() * Math.PI * 2,
      distance: 30 + Math.random() * 70,
      size: 60 + Math.random() * 80,
      delay: Math.random() * 120,
      duration: 600 + Math.random() * 400,
    }));
  }, []);

  return (
    <>
      {puffs.map((cfg, i) => (
        <Puff key={i} originX={originX} originY={originY} cfg={cfg} />
      ))}
    </>
  );
}
