import { useRef } from 'react';
import { Image, PanResponder, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

export type CarouselItem = { id: string; source: ImageSourcePropType };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function Slide({
  index,
  pos,
  size,
  slot,
  source,
}: {
  index: number;
  pos: SharedValue<number>;
  size: number;
  slot: number;
  source: ImageSourcePropType;
}) {
  // scale & opacity are one continuous function of distance from center — interpolated
  // live as `pos` moves, never toggled between fixed states.
  const style = useAnimatedStyle(() => {
    const o = index - pos.value; // signed distance from center (slots)
    const d = Math.abs(o);
    const k = Math.max(0, 1 - 0.5 * d); // 1.0 center → 0.5 adjacent → 0 two-away
    return {
      transform: [{ translateX: o * slot }, { scale: k }],
      opacity: k,
      zIndex: Math.round(100 - d * 10), // centered image on top (must be in the animated style)
    };
  });

  return (
    <Animated.View
      style={[styles.slide, { width: size, height: size, marginLeft: -size / 2 }, style]}
    >
      {/* Fixed square frame, center-cropped (face-centered) for any aspect ratio. */}
      <Image source={source} resizeMode="cover" style={styles.image} />
    </Animated.View>
  );
}

type Props = {
  items: CarouselItem[];
  /** Frame size of the focused (centered) image. */
  size: number;
  initialIndex?: number;
  /** Auto-selected on snap. */
  onSelect?: (index: number) => void;
};

export function Carousel({ items, size, initialIndex = 0, onSelect }: Props) {
  const slot = size * 0.62; // spacing between adjacent slots (also drag px → 1 slot)
  const last = Math.max(0, items.length - 1);
  const start = clamp(initialIndex, 0, last);

  const pos = useSharedValue(start);
  const startPos = useRef(start);
  const idxRef = useRef(start);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        startPos.current = pos.value;
      },
      // Drag follows the finger: shifting pos by dx/slot moves every image by dx.
      onPanResponderMove: (_, g) => {
        pos.value = clamp(startPos.current - g.dx / slot, 0, last);
      },
      // Velocity-aware snap to the nearest image.
      onPanResponderRelease: (_, g) => {
        const target = clamp(Math.round(pos.value - g.vx * 0.3), 0, last);
        pos.value = withSpring(target, { damping: 18, stiffness: 160, mass: 0.6 });
        if (target !== idxRef.current) {
          idxRef.current = target;
          onSelect?.(target);
        }
      },
    })
  ).current;

  return (
    <View style={[styles.viewport, { height: size }]} {...pan.panHandlers}>
      {items.map((it, i) => (
        <Slide key={it.id} index={i} pos={pos} size={size} slot={slot} source={it.source} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    width: '100%',
    overflow: 'visible', // let neighbors peek beyond the focused frame
    justifyContent: 'center',
  },
  slide: {
    position: 'absolute',
    left: '50%', // center the frame; translateX (animated) offsets it
    top: 0,
  },
  image: { width: '100%', height: '100%' },
});
