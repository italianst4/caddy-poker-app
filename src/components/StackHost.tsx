import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type TransitionDir = 'push' | 'pop' | null;

const PARALLAX = 0.3; // the receding view travels 1/3 of full distance
const DIM = 0.28; // max dim on the receding view
const DURATION = 350; // ~iOS push timing
const EASING = Easing.out(Easing.cubic);
const EDGE = 28; // px from the left edge where a back-swipe can start

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

type Props = {
  routeKey: string;
  /** Direction for THIS route change. null/undefined → instant swap (no animation). */
  transition: TransitionDir;
  render: (key: string) => ReactNode;
  /** If set, the current route supports interactive edge-swipe back to this route. */
  backKey?: string | null;
  /** Called when an edge-swipe back completes (parent should swap to backKey instantly). */
  onSwipeBack?: () => void;
};

/**
 * iOS-style push/pop between two route keys. The incoming view slides full-width; the outgoing
 * view parallaxes at 1/3 speed and dims. Two fixed slots are always rendered — slot A (behind)
 * holds the outgoing/back screen, slot B (front) ALWAYS holds `current`. Because `current` keeps a
 * stable position in the tree, the screen you land on is never remounted when a transition settles,
 * so its entrance animations don't replay (no "double flicker"). When `backKey` is set, a left-edge
 * pan drives an interactive finger-following pop.
 */
export function StackHost({ routeKey, transition, render, backKey = null, onSwipeBack }: Props) {
  const { width } = useWindowDimensions();

  const [current, setCurrent] = useState(routeKey);
  const [previous, setPrevious] = useState<string | null>(null);
  const fromRef = useRef(routeKey);

  const progress = useSharedValue(0);
  const dir = useSharedValue(1); // 1 = push, 0 = pop
  const transitioning = useSharedValue(0); // 1 while a timed push/pop animates
  const swipe = useSharedValue(0); // interactive edge-swipe (0 = current shown, 1 = popped)

  const transitionRef = useRef(transition);
  transitionRef.current = transition;
  const previousRef = useRef(previous);
  previousRef.current = previous;

  // Instant (no-transition) route changes: sync `current` during render so we never paint the
  // old screen for a frame.
  if (transition == null && previous == null && current !== routeKey) {
    setCurrent(routeKey);
  }
  const backKeyRef = useRef(backKey);
  backKeyRef.current = backKey;
  const onSwipeBackRef = useRef(onSwipeBack);
  onSwipeBackRef.current = onSwipeBack;
  const widthRef = useRef(width);
  widthRef.current = width;

  useEffect(() => {
    const from = fromRef.current;
    if (routeKey === from) return;
    fromRef.current = routeKey;

    const t = transitionRef.current;
    if (t !== 'push' && t !== 'pop') {
      setPrevious(null);
      setCurrent(routeKey);
      return;
    }
    dir.value = t === 'push' ? 1 : 0;
    transitioning.value = 1;
    setPrevious(from);
    setCurrent(routeKey);
    progress.value = 0;
    progress.value = withTiming(1, { duration: DURATION, easing: EASING }, (finished) => {
      if (finished) {
        transitioning.value = 0;
        runOnJS(setPrevious)(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // Reset the swipe whenever the route settles.
  useEffect(() => {
    swipe.value = 0;
  }, [current, swipe]);

  const finishSwipe = () => onSwipeBackRef.current?.();

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        backKeyRef.current != null &&
        previousRef.current == null &&
        g.x0 < EDGE &&
        g.dx > 6 &&
        Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        swipe.value = clamp(g.dx / widthRef.current, 0, 1);
      },
      onPanResponderRelease: (_, g) => {
        const w = widthRef.current;
        const shouldPop = g.dx > w * 0.4 || g.vx > 0.5;
        if (shouldPop) {
          swipe.value = withTiming(1, { duration: 220, easing: EASING }, (fin) => {
            if (fin) runOnJS(finishSwipe)();
          });
        } else {
          swipe.value = withTiming(0, { duration: 220, easing: EASING });
        }
      },
    })
  ).current;

  // slotA (child 0, behind): the outgoing screen during a transition, or the interactive-back
  // screen at rest. slotB (child 1, front): ALWAYS `current`.
  const slotAStyle = useAnimatedStyle(() => {
    if (transitioning.value === 1) {
      const p = progress.value;
      const push = dir.value === 1;
      return {
        transform: [{ translateX: push ? -width * PARALLAX * p : width * p }],
        zIndex: push ? 0 : 1,
      };
    }
    return { transform: [{ translateX: -width * PARALLAX * (1 - swipe.value) }], zIndex: 0 };
  });
  const slotBStyle = useAnimatedStyle(() => {
    if (transitioning.value === 1) {
      const p = progress.value;
      const push = dir.value === 1;
      return {
        transform: [{ translateX: push ? width * (1 - p) : -width * PARALLAX * (1 - p) }],
        zIndex: push ? 1 : 0,
      };
    }
    return { transform: [{ translateX: swipe.value * width }], zIndex: 1 };
  });
  const slotADim = useAnimatedStyle(() => {
    if (transitioning.value === 1) return { opacity: dir.value === 1 ? DIM * progress.value : 0 };
    return { opacity: DIM * (1 - swipe.value) };
  });
  const slotBDim = useAnimatedStyle(() => {
    if (transitioning.value === 1) return { opacity: dir.value === 0 ? DIM * (1 - progress.value) : 0 };
    return { opacity: 0 };
  });

  return (
    <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.front, slotAStyle]}>
        {previous != null ? render(previous) : backKey != null ? render(backKey) : null}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, slotADim]} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.front, slotBStyle]}>
        {render(current)}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, slotBDim]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: '#000' },
  front: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: -3, height: 0 },
  },
});
