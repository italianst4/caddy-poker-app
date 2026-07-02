import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { CardArt } from './CardArt';
import { CardBack } from './CardBack';
import { SunRays } from './SunRays';
import { CARD_RATIO, colors, radius, spacing } from '../theme';
import { isMatchup, type Card } from '../data/cards';

type Props = {
  card: Card;
  playerName: string;
  onDismiss: () => void;
  /** Show a Re-draw button when provided; omit for a single Accept-only reveal. */
  onRedraw?: () => void;
  /** Label for the accept/confirm button (default "Accept"). */
  acceptLabel?: string;
  /** Override the card back image (e.g. caddy back). */
  back?: ImageSourcePropType;
};

/**
 * Full-screen reveal: a face-down card performs a 3D flip to its front, with sun rays
 * shining from behind. Below it the player confirms (and may Re-draw if enabled).
 */
export function FlipCard({ card, playerName, onDismiss, onRedraw, acceptLabel = 'Accept', back }: Props) {
  const { width, height } = useWindowDimensions();
  const cardWidth = Math.min(width * 0.78, height * 0.6 * CARD_RATIO);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      300,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) })
    );
  }, [progress]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  return (
    <View style={styles.overlay}>
      {/* Sun rays only appear for matchup cards — fade in + spin together with the flip. */}
      {isMatchup(card) ? (
        <SunRays size={Math.max(width, height) * 1.2} startDelay={400} fadeDuration={700} />
      ) : null}

      <Text style={styles.player}>{playerName}</Text>

      <View style={[styles.cardArea, { width: cardWidth, height: cardWidth / CARD_RATIO }]}>
        <Animated.View style={[styles.face, backStyle]}>
          <CardBack source={back} style={styles.fill} />
        </Animated.View>
        <Animated.View style={[styles.face, frontStyle]}>
          <CardArt card={card} style={styles.fill} />
        </Animated.View>
      </View>

      <View style={styles.buttonsRow}>
        {onRedraw ? (
          <Pressable
            onPress={onRedraw}
            style={({ pressed }) => [styles.btn, styles.redrawBtn, pressed && styles.pressed]}
          >
            <Text style={styles.redrawIcon}>↻</Text>
            <Text style={styles.redrawLabel}>Re-draw</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [styles.btn, styles.acceptBtn, pressed && styles.pressed]}
        >
          <Text style={styles.acceptIcon}>✓</Text>
          <Text style={styles.acceptLabel}>{acceptLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,18,12,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  player: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.lg,
    letterSpacing: 0.5,
    zIndex: 2,
  },
  cardArea: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2, // always above the sun rays behind it
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    zIndex: 2, // above the rays so it stays tappable
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: 140,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  redrawBtn: {
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.border,
  },
  redrawIcon: { color: colors.text, fontSize: 20, fontWeight: '900' },
  redrawLabel: { color: colors.text, fontSize: 17, fontWeight: '800' },
  acceptBtn: {
    backgroundColor: colors.gold,
  },
  acceptIcon: { color: colors.primaryText, fontSize: 18, fontWeight: '900' },
  acceptLabel: { color: colors.primaryText, fontSize: 17, fontWeight: '900' },
});
