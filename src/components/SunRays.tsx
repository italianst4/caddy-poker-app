import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  /** Diameter of the ray field. Defaults large to cover most of the screen. */
  size?: number;
  /** Wait this long (ms) before fading the rays in — used to start them after the card flip. */
  startDelay?: number;
  /** Fade-in duration (ms). Spinning begins once the fade completes. */
  fadeDuration?: number;
};

const RAYS = 18; // number of solid wedges (with an equal-width gap between each)
const VB = 100; // svg viewBox units
const CX = VB / 2;
const CY = VB / 2;
const R = 78; // wedge radius in viewBox units (extends past the edges to cover corners)

function polar(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

// Build the combined path of all wedges. Each ray occupies `seg` degrees, followed by a
// `seg`-degree gap, giving evenly spaced rays around the full circle.
const seg = 360 / (RAYS * 2);
const RAY_PATH = Array.from({ length: RAYS }, (_, i) => {
  const a0 = i * 2 * seg;
  const a1 = a0 + seg;
  const p0 = polar(a0);
  const p1 = polar(a1);
  return `M${CX},${CY} L${p0.x.toFixed(3)},${p0.y.toFixed(3)} L${p1.x.toFixed(3)},${p1.y.toFixed(3)} Z`;
}).join(' ');

/**
 * A wedge sunburst drawn with SVG: solid gold rays that fade from transparent at the center
 * out to gold at the edges (radial gradient). It fades in after `startDelay`, then begins a
 * slow continuous spin. Sits behind the revealed card so light shines from behind it.
 */
export function SunRays({ size = 900, startDelay = 0, fadeDuration = 700 }: Props) {
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Fade in and start spinning together, right when the rays mount (card tap).
    opacity.value = withDelay(
      startDelay,
      withTiming(1, { duration: fadeDuration, easing: Easing.out(Easing.quad) })
    );
    rotation.value = withDelay(
      startDelay,
      withRepeat(withTiming(360, { duration: 26000, easing: Easing.linear }), -1, false)
    );
  }, [opacity, rotation, startDelay, fadeDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { width: size, height: size }, animatedStyle]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          <RadialGradient id="rayFade" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.gold} stopOpacity={0} />
            <Stop offset="35%" stopColor={colors.gold} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={colors.gold} stopOpacity={0.5} />
          </RadialGradient>
        </Defs>
        <Path d={RAY_PATH} fill="url(#rayFade)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
});
