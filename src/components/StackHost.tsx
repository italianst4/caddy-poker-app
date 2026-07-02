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
 * iOS-style push/pop between two route keys. The incoming view slides full-width; the
 * outgoing view parallaxes at 1/3 speed and dims; the top card casts a leading shadow.
 * When `backKey` is set, the back screen stays mounted underneath and a left-edge pan
 * drives an interactive (finger-following) pop, just like UINavigationController.
 */
export function StackHost({ routeKey, transition, render, backKey = null, onSwipeBack }: Props) {
  const { width } = useWindowDimensions();

  const [current, setCurrent] = useState(routeKey);
  const [previous, setPrevious] = useState<string | null>(null);
  const fromRef = useRef(routeKey);
  const isPushRef = useRef(true);

  // Timed transitions (push/pop via button).
  const progress = useSharedValue(0);
  const dir = useSharedValue(1); // 1 = push, 0 = pop
  // Interactive edge-swipe (0 = current shown, 1 = popped).
  const swipe = useSharedValue(0);

  const transitionRef = useRef(transition);
  transitionRef.current = transition;
  const previousRef = useRef(previous);
  previousRef.current = previous;
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
    const push = t === 'push';
    isPushRef.current = push;
    dir.value = push ? 1 : 0;
    setPrevious(from);
    setCurrent(routeKey);
    progress.value = 0;
    progress.value = withTiming(1, { duration: DURATION, easing: EASING }, (finished) => {
      if (finished) runOnJS(setPrevious)(null);
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

  // ----- timed transition transforms -----
  const frontStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const tx = dir.value === 1 ? width * (1 - p) : width * p;
    return { transform: [{ translateX: tx }] };
  });
  const backStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const tx = dir.value === 1 ? -width * PARALLAX * p : -width * PARALLAX * (1 - p);
    return { transform: [{ translateX: tx }] };
  });
  const dimStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return { opacity: dir.value === 1 ? DIM * p : DIM * (1 - p) };
  });

  // ----- interactive edge-swipe transforms -----
  const swipeFrontStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipe.value * width }],
  }));
  const swipeBackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -width * PARALLAX * (1 - swipe.value) }],
  }));
  const swipeDimStyle = useAnimatedStyle(() => ({ opacity: DIM * (1 - swipe.value) }));

  // Timed push/pop in progress.
  if (previous != null) {
    const front = isPushRef.current ? current : previous;
    const back = isPushRef.current ? previous : current;
    return (
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
          {render(back)}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.front, frontStyle]}>
          {render(front)}
        </Animated.View>
      </View>
    );
  }

  // At rest on a route that supports interactive back: keep the back screen mounted.
  if (backKey != null) {
    return (
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers}>
        <Animated.View style={[StyleSheet.absoluteFill, swipeBackStyle]}>
          {render(backKey)}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, swipeDimStyle]} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.front, swipeFrontStyle]}>
          {render(current)}
        </Animated.View>
      </View>
    );
  }

  return <View style={StyleSheet.absoluteFill}>{render(current)}</View>;
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
