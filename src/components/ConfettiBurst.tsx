import { useEffect, useMemo } from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export const FESTIVE_COLORS = ['#FFD66B', '#34C759', '#FF6B6B', '#4DA3FF', '#FF9F40', '#B47CFF'];
export const FAIL_COLORS = ['#FF6B6B', '#FFFFFF', '#B0B0B0', '#FF9F40', '#8A93A0'];

const GRAVITY = 360;

function BurstPiece({
  originX,
  originY,
  colors,
}: {
  originX: number;
  originY: number;
  colors: string[];
}) {
  const cfg = useMemo(() => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 170;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (50 + Math.random() * 90), // upward bias
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720),
      duration: 1000 + Math.random() * 700,
      square: Math.random() < 0.5,
    };
  }, [colors]);

  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: cfg.duration, easing: Easing.out(Easing.quad) });
  }, [p, cfg]);

  const style = useAnimatedStyle(() => {
    const t = p.value;
    return {
      transform: [
        { translateX: cfg.vx * t },
        { translateY: cfg.vy * t + GRAVITY * t * t },
        { rotate: `${cfg.spin * t}deg` },
      ],
      opacity: interpolate(t, [0, 0.8, 1], [1, 1, 0]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: originX,
          top: originY,
          width: cfg.size,
          height: cfg.square ? cfg.size : cfg.size * 0.5,
          backgroundColor: cfg.color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

type Props = {
  originX: number;
  originY: number;
  count?: number;
  colors?: string[];
};

/** A one-shot confetti explosion emanating from (originX, originY). */
export function ConfettiBurst({ originX, originY, count = 38, colors = FESTIVE_COLORS }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <BurstPiece key={i} originX={originX} originY={originY} colors={colors} />
      ))}
    </>
  );
}
