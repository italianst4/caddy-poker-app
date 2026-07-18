import { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PackFront, PACK_RATIO } from './PackFront';
import { CardArt } from './CardArt';
import { PackCardViewer } from './PackCardViewer';
import { ConfettiBurst } from './ConfettiBurst';
import { packById, cardsInPack } from '../data/packs';
import { playGolfHit } from '../sounds';
import { bigPop, shutter, rumble } from '../haptics';
import { colors, radius, spacing } from '../theme';

// Opening the caddy pack is a 3-tap ritual (mirrors OpenPackScreen): taps 1–2 give a "shutter"
// snap + jiggle; the 3rd tap flips it open with a continuous rumble that lasts until every caddy
// card is on screen. The reveal timing below matches the grid's FadeInDown (delay i*45, dur 320).
const OPEN_TAPS = 3;
const FLIP_MS = 520;
const CARD_STAGGER_MS = 45;
const CARD_ANIM_MS = 320;

type Props = {
  /** Chosen after opening: true = use caddies this + future games, false = skip. */
  onOpen: (useCaddies: boolean) => void;
  /** Dismiss without opening. */
  onClose: () => void;
};

/**
 * Full-screen (semi-transparent) overlay for opening the caddy pack in the poker finale: the
 * sealed pack zooms up, jiggles + tilts with the device, and taps to flip open into a grid of the
 * caddy cards, with "Use Caddies" / "Skip Caddies" buttons below.
 */
export function CaddyDeckOverlay({ onOpen, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const pack = packById('caddy');
  const cards = cardsInPack('caddy');
  const [revealed, setRevealed] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const flip = useSharedValue(0);
  const wiggle = useSharedValue(0);
  // One-shot shake applied on each tap (composited with the ambient wiggle).
  const shake = useSharedValue(0);

  // How many times the sealed pack has been tapped, and a handle to stop the open rumble.
  const taps = useRef(0);
  const stopRumble = useRef<null | (() => void)>(null);
  useEffect(() => () => stopRumble.current?.(), []);

  useEffect(() => {
    wiggle.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 70 }),
          withTiming(8, { duration: 70 }),
          withTiming(-6, { duration: 70 }),
          withTiming(6, { duration: 70 }),
          withTiming(0, { duration: 70 }),
          withDelay(2600, withTiming(0, { duration: 0 }))
        ),
        -1
      )
    );
  }, [wiggle]);

  const onOpened = () => {
    bigPop();
    setRevealed(true);
  };

  // A quick one-shot jiggle of the sealed pack (fired on every tap).
  const jigglePack = () => {
    shake.value = withSequence(
      withTiming(-11, { duration: 45 }),
      withTiming(11, { duration: 45 }),
      withTiming(-7, { duration: 45 }),
      withTiming(7, { duration: 45 }),
      withTiming(0, { duration: 50 })
    );
  };

  const open = () => {
    // Ignore taps once the flip has been triggered (revealed only flips true after the flip
    // completes ~FLIP_MS later, so guard on the tap count too — otherwise a tap during the flip
    // starts a second rumble and orphans the first one's timers).
    if (revealed || taps.current >= OPEN_TAPS) return;
    jigglePack(); // every tap gives the pack a jiggle

    taps.current += 1;

    // Taps 1–2: a crisp "shutter" snap; wait for more taps.
    if (taps.current < OPEN_TAPS) {
      shutter();
      return;
    }

    // Third tap: flip open with a continuous rumble that runs until every caddy card is revealed.
    playGolfHit();
    wiggle.value = withTiming(0, { duration: 100 }); // stop the ambient entice wiggle
    const revealMs = FLIP_MS + (cards.length - 1) * CARD_STAGGER_MS + CARD_ANIM_MS;
    stopRumble.current = rumble(revealMs);
    flip.value = withTiming(1, { duration: FLIP_MS, easing: Easing.inOut(Easing.cubic) }, (fin) => {
      if (fin) runOnJS(onOpened)();
    });
  };

  const packW = Math.min(width * 0.55, 240);
  const packH = packW / PACK_RATIO;
  const cardW = Math.min((width - spacing.lg * 2 - spacing.sm * 2) / 3, 108);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateY: `${flip.value * 180}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 0 : 1,
    transform: [{ perspective: 900 }, { rotateY: `${flip.value * 180 + 180}deg` }],
  }));
  const packStyle = useAnimatedStyle(() => ({
    // Just the entice wiggle + per-tap jiggle (rotateZ). No device tilt.
    transform: [{ rotateZ: `${wiggle.value + shake.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      {/* Tap outside (unopened) to dismiss — sits behind the content. */}
      {!revealed ? <Pressable style={StyleSheet.absoluteFill} onPress={onClose} /> : null}

      <SafeAreaView pointerEvents="box-none" style={styles.content}>
        {!revealed ? (
          <>
            <Text style={styles.title}>Caddies</Text>
            <Text style={styles.sub}>Stack the deck in your favor. Caddy cards add wild cards and boost your poker hand. Tap to play one.</Text>
            <Pressable onPress={open} style={({ pressed }) => pressed && styles.pressed}>
              <Animated.View style={[{ width: packW, height: packH }, packStyle]}>
                <Animated.View style={[styles.face, frontStyle]}>
                  <PackFront pack={pack} width={packW} style={styles.fill} />
                </Animated.View>
                <Animated.Image source={pack.packBack} resizeMode="contain" style={[styles.face, backStyle]} />
              </Animated.View>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Your Caddies</Text>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
              {cards.map((card, i) => (
                <Animated.View
                  key={card.id}
                  entering={FadeInDown.delay(i * 45).duration(320).springify()}
                  style={[styles.gridItem, { width: cardW }]}
                >
                  <Pressable onPress={() => setViewerIndex(i)} style={({ pressed }) => pressed && styles.pressed}>
                    <CardArt card={card} style={styles.gridCard} />
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
            <Animated.View entering={FadeIn.delay(cards.length * 45 + 150)} style={styles.footer}>
              <Pressable onPress={() => onOpen(true)} style={({ pressed }) => [styles.useBtn, pressed && styles.pressed]}>
                <Text style={styles.useText}>Use Caddies</Text>
              </Pressable>
              <Pressable onPress={() => onOpen(false)} style={({ pressed }) => [styles.skipLink, pressed && styles.pressed]}>
                <Text style={styles.skipText}>Skip Caddies</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </SafeAreaView>

      {revealed ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <ConfettiBurst originX={width / 2} originY={height * 0.3} count={40} />
        </View>
      ) : null}

      {viewerIndex !== null ? (
        <PackCardViewer cards={cards} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,18,12,0.9)',
    zIndex: 60,
  },
  // Content top-aligned (below the safe area) so the "Caddies" headline lands at the same
  // height as the Menu screen's title, with everything stacked toward the top.
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  scroll: { flex: 1, alignSelf: 'stretch' },
  title: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sub: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  face: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', backfaceVisibility: 'hidden' },
  fill: { width: '100%', height: '100%' },
  pressed: { opacity: 0.8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  gridItem: {
    borderRadius: radius.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  gridCard: { width: '100%', borderRadius: radius.sm, borderWidth: 2, borderColor: colors.white },
  footer: { alignSelf: 'stretch', gap: spacing.sm, paddingTop: spacing.md, marginBottom: spacing.xl },
  useBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  useText: { color: colors.primaryText, fontSize: 18, fontWeight: '900' },
  // "Skip Caddies" as a plain text link (no button chrome), still a full-width tap target.
  skipLink: { alignItems: 'center', paddingVertical: spacing.sm },
  skipText: { color: colors.textMuted, fontSize: 16, fontWeight: '800' },
});
