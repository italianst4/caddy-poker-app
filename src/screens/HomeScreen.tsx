import { useEffect } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { MusicControl } from '../components/MusicControl';
import { useGame } from '../store/gameStore';
import { playBallInHole } from '../sounds';
import { colors, spacing } from '../theme';

export function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const goTo = useGame((s) => s.goTo);
  const reset = useGame((s) => s.reset);

  // Entrance: logo bounces in → tagline fades → button fades. `exit` runs on New Round.
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const exit = useSharedValue(0);
  const wiggle = useSharedValue(0); // degrees; periodic wiggle to entice taps

  useEffect(() => {
    logoOpacity.value = withDelay(150, withTiming(1, { duration: 220 }));
    // Bouncy spring: overshoots slightly oversize, then settles to its resting size.
    logoScale.value = withDelay(150, withSpring(1, { damping: 6.5, stiffness: 130, mass: 0.9 }));
    taglineOpacity.value = withDelay(950, withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }));
    buttonOpacity.value = withDelay(1400, withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }));

    // After it appears, wiggle "New Round" briefly every few seconds.
    wiggle.value = withDelay(
      2200,
      withRepeat(
        withSequence(
          withTiming(-9, { duration: 70 }),
          withTiming(9, { duration: 70 }),
          withTiming(-7, { duration: 70 }),
          withTiming(7, { duration: 70 }),
          withTiming(0, { duration: 70 }),
          withDelay(2800, withTiming(0, { duration: 0 })) // rest between wiggles
        ),
        -1
      )
    );
  }, [logoOpacity, logoScale, taglineOpacity, buttonOpacity, wiggle]);

  const start = () => {
    playBallInHole();
    exit.value = withTiming(1, { duration: 300, easing: Easing.in(Easing.cubic) }, (fin) => {
      if (fin) {
        runOnJS(reset)();
        runOnJS(goTo)('count');
      }
    });
  };

  const logoSize = Math.round(width * 0.62);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value * (1 - exit.value),
    transform: [{ scale: logoScale.value * (1 - exit.value * 0.12) }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value * (1 - exit.value),
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value * (1 - exit.value),
  }));
  const wiggleStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${wiggle.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      <LandscapeBackground />

      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => goTo('menu')}
            hitSlop={10}
            style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
          >
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
          </Pressable>

          <MusicControl />
        </View>

        <View style={[styles.center, { paddingTop: height * 0.08 }]}>
          <Animated.Image
            source={require('../../assets/cards/cp-logo.png')}
            style={[styles.logo, { width: logoSize, height: logoSize }, logoStyle]}
            resizeMode="contain"
          />
          <Animated.Text style={[styles.tagline, taglineStyle]}>
            Play Golf. Play Poker. Play Both.
          </Animated.Text>
          <Animated.View style={[styles.newRoundWrap, buttonStyle, wiggleStyle]}>
            <Pressable onPress={start} hitSlop={12} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.newRoundText}>New Round</Text>
            </Pressable>
          </Animated.View>
        </View>
        <Animated.View style={[styles.footer, buttonStyle]}>
          <Text style={styles.credit}>a montalbano amusement</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuBar: {
    width: 18,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    alignSelf: 'center',
  },
  tagline: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: spacing.md,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  newRoundWrap: {
    marginTop: spacing.xl * 2 + spacing.lg,
    alignItems: 'center',
  },
  newRoundText: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  footer: {
    paddingBottom: 0,
    alignItems: 'center',
  },
  credit: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
