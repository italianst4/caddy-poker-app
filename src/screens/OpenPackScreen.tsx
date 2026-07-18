import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { CardArt } from '../components/CardArt';
import { PackFront, PACK_RATIO } from '../components/PackFront';
import { PackCardViewer } from '../components/PackCardViewer';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { useGame } from '../store/gameStore';
import { cardsInPack, packById } from '../data/packs';
import { playGolfHit } from '../sounds';
import { bigPop, shutter, rumble } from '../haptics';
import { colors, radius, spacing } from '../theme';

// The top scroll-edge fade blends into the flat sky blue (#42A7DE) so cards dissolve into the
// sky. The bottom has no fade — instead the grass "ground" is drawn over the cards (see below).
const SKY = '66,167,222';
const FADE_SKY_SOLID = `rgba(${SKY},1)`;
const FADE_SKY_CLEAR = `rgba(${SKY},0)`;

// The grass horizon sits at ~79.8% down cp-landscaping.png; BG_RATIO matches LandscapeBackground
// so a re-drawn copy of the landscape lines up exactly with the real background behind the screen.
const HORIZON_FRAC = 0.798;
const BG_RATIO = 1109 / 1800;
const LANDSCAPE = require('../../assets/cp-landscaping.png');

// Opening a pack is a 3-tap ritual: taps 1–2 give a "shutter" snap + jiggle; the 3rd tap flips
// the pack open with a continuous rumble that lasts until every card is on screen.
const OPEN_TAPS = 3;
const FLIP_MS = 520;
const CARD_STAGGER_MS = 70; // matches the grid's FadeInDown delay (i * 70)
const CARD_ANIM_MS = 360; // matches the grid's FadeInDown duration

export function OpenPackScreen() {
  const { width, height } = useWindowDimensions();
  const openingPackId = useGame((s) => s.openingPackId);
  const packBrowse = useGame((s) => s.packBrowse);
  const packOnboarding = useGame((s) => s.packOnboarding);
  const grantPack = useGame((s) => s.grantPack);
  const goTo = useGame((s) => s.goTo);

  // Fall back to the starter pack if we somehow arrived without a target (defensive).
  const packId = openingPackId ?? 'white-tees';
  const pack = packById(packId);
  const cards = cardsInPack(packId);
  // Onboarding = the required first open reached from the New Round flow (hole-count step) — NOT
  // opening the same pack from the Card Packs screen, which routes back to Card Packs instead.
  const isOnboarding = packOnboarding && !packBrowse;

  // Browsing an owned pack skips the sealed flip and lands straight on the card grid.
  const [revealed, setRevealed] = useState(packBrowse);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Keep the revealed state in sync if the screen is reused for a different pack/mode.
  useEffect(() => {
    setRevealed(packBrowse);
  }, [packBrowse, packId]);

  // 0 = front facing us, 1 = flipped to the back; drives the pack flip.
  const flip = useSharedValue(0);
  // Periodic wiggle to entice a tap — mirrors the "New Round" button on Home.
  const wiggle = useSharedValue(0);
  // One-shot shake applied on each tap (composited with the ambient wiggle).
  const shake = useSharedValue(0);

  // How many times the sealed pack has been tapped, and a handle to stop the open rumble.
  const taps = useRef(0);
  const stopRumble = useRef<null | (() => void)>(null);
  useEffect(() => () => stopRumble.current?.(), []);

  useEffect(() => {
    wiggle.value = withDelay(
      1200,
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
  }, [wiggle]);

  // Runs on the JS thread when the flip completes: the pack "explodes" open.
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

  const openPack = () => {
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

    // Third tap: flip open with a continuous rumble that runs until every card is revealed.
    playGolfHit();
    wiggle.value = withTiming(0, { duration: 100 }); // stop the ambient entice wiggle
    const revealMs = FLIP_MS + (cards.length - 1) * CARD_STAGGER_MS + CARD_ANIM_MS;
    stopRumble.current = rumble(revealMs);
    flip.value = withTiming(1, { duration: FLIP_MS, easing: Easing.inOut(Easing.cubic) }, (fin) => {
      if (fin) runOnJS(onOpened)();
    });
  };

  const onContinue = () => {
    if (packBrowse) {
      // Just browsing an owned pack — nothing to grant; go back to Card Packs.
      goTo('packs', 'pop');
      return;
    }
    grantPack(packId);
    if (isOnboarding) {
      // Onboarding now happens right after the hole count — continue to the ready-to-play Overview.
      goTo('overview');
    } else {
      // Opened from the Card Packs screen — return there.
      goTo('packs', 'pop');
    }
  };

  // Back returns to the hole-count step on the required first open, or to Card Packs otherwise.
  const onBack = () => goTo(isOnboarding ? 'holes' : 'packs', 'pop');

  const packW = Math.min(width * 0.6, 260);
  const packH = packW / PACK_RATIO; // match the art so the logo/label overlay stays aligned

  // Grass "ground" geometry: a clipped copy of the landscape drawn over the cards from the horizon
  // down, aligned to the real background so cards disappear behind the horizon as they scroll.
  const horizonY = Math.round(height * HORIZON_FRAC);
  const bgWidth = height * BG_RATIO;
  const bgLeft = (width - bgWidth) / 2;
  const groundCover = height - horizonY; // how much of the grid the ground hides at the bottom

  const frontStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 1 : 0,
    transform: [{ perspective: 900 }, { rotateY: `${flip.value * 180}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value < 0.5 ? 0 : 1,
    transform: [{ perspective: 900 }, { rotateY: `${flip.value * 180 + 180}deg` }],
  }));
  // Sealed-pack transform: just the entice wiggle + per-tap jiggle (rotateZ). No device tilt.
  const packStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${wiggle.value + shake.value}deg` }],
  }));

  // The tappable sealed pack (tilts + wiggles); shared by the onboarding and open-a-pack layouts.
  const sealedPack = (
    <Pressable onPress={openPack} style={({ pressed }) => pressed && styles.pressed}>
      <Animated.View style={[{ width: packW, height: packH }, packStyle]}>
        <Animated.View style={[styles.packFace, frontStyle]}>
          <PackFront pack={pack} width={packW} style={styles.fill} />
        </Animated.View>
        <Animated.Image source={pack.packBack} resizeMode="contain" style={[styles.packFace, backStyle]} />
      </Animated.View>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <LandscapeBackground hideClouds />

      <SafeAreaView style={styles.safe}>
        {/* Elevated so the back button stays on top of (and tappable over) the shifted-up content. */}
        <View style={styles.headerLayer}>
          <ScreenHeader title="" onBack={onBack} />
        </View>

        {/* box-none so the shifted-up title area doesn't swallow taps meant for the back button. */}
        <View pointerEvents="box-none" style={[styles.content, !revealed && !isOnboarding && styles.contentShiftUp]}>
          {/* On first-time onboarding we drop the title so the pack + invitation are the focus. */}
          {revealed || !isOnboarding ? <Text style={styles.title}>{pack.openTitle}</Text> : null}
          {/* When opening a pack, the prompt sits right below the pack name. */}
          {!revealed && !isOnboarding ? (
            <Text style={styles.intro}>Open the {pack.name} pack.</Text>
          ) : null}

          {/* Open-a-pack (non-onboarding) sealed layout: prompt above, pack then blurb below. */}
          {!revealed && !isOnboarding ? (
            <View style={styles.center}>
              {sealedPack}
              <Text style={styles.blurb}>{pack.blurb}</Text>
            </View>
          ) : null}

          {revealed ? (
          // Cards fan into a grid; a sky fade hides the top edge, and the grass ground (drawn
          // below, over the grid) hides the bottom so cards vanish behind the horizon.
          <View style={styles.gridWrap}>
            <ScrollView
              contentContainerStyle={[styles.grid, { paddingBottom: groundCover + spacing.lg }]}
              showsVerticalScrollIndicator={false}
            >
              {cards.map((card, i) => (
                <Animated.View
                  key={card.id}
                  entering={FadeInDown.delay(i * 70).duration(360).springify()}
                  style={styles.gridItem}
                >
                  <Pressable
                    onPress={() => setViewerIndex(i)}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <CardArt card={card} style={styles.gridCard} />
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
            <LinearGradient
              pointerEvents="none"
              colors={[FADE_SKY_SOLID, FADE_SKY_CLEAR]}
              style={styles.fadeTop}
            />
          </View>
        ) : null}
        </View>
      </SafeAreaView>

      {/* Onboarding sealed pack, anchored 15% from the top of the SCREEN (not the header). */}
      {!revealed && isOnboarding ? (
        <View style={[styles.onboardBlock, { top: height * 0.15 }]} pointerEvents="box-none">
          {sealedPack}
          <Text style={[styles.intro, styles.introLarge]}>
            Before we play, let's open your first set of challenges!
          </Text>
        </View>
      ) : null}

      {/* Grass "ground": a clipped copy of the landscape, aligned to the real background, drawn
          OVER the cards so they slide behind the horizon line as the grid scrolls. */}
      {revealed ? (
        <View style={[styles.ground, { top: horizonY }]}>
          <Image
            source={LANDSCAPE}
            resizeMode="cover"
            style={{ position: 'absolute', top: -horizonY, left: bgLeft, width: bgWidth, height }}
          />
        </View>
      ) : null}

      {/* Footer sits above the grass ground so the button stays tappable on the green. */}
      {revealed ? (
        <Animated.View entering={FadeIn.delay(cards.length * 70 + 200)} style={styles.footerAbs}>
          <Pressable
            onPress={onContinue}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
          >
            <Text style={styles.continueText}>
              {packBrowse ? 'Done' : isOnboarding ? 'Play these challenges' : 'Continue'}
            </Text>
          </Pressable>
          {!packBrowse ? <Text style={styles.callout}>Get more packs from the Menu.</Text> : null}
        </Animated.View>
      ) : null}

      {/* One-shot celebration when a pack is freshly opened (not when just browsing). */}
      {revealed && !packBrowse ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <ConfettiBurst originX={width / 2} originY={height * 0.32} count={46} />
        </View>
      ) : null}

      {viewerIndex !== null ? (
        <PackCardViewer
          cards={cards}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          sparkle={!packBrowse}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  headerLayer: { zIndex: 10 },
  content: { flex: 1 },
  // Non-onboarding open: pull the whole block up so the pack name's top lines up with the back
  // button (which sits to its left). Offset = back-button height (40) + header row bottom margin.
  contentShiftUp: { marginTop: -(40 + spacing.md) },
  title: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  intro: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 23,
    paddingHorizontal: spacing.sm,
  },
  // Pack blurb, shown below the pack on the open view (1.3× the previous 18px).
  blurb: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  // Onboarding hero text for "Before we play…" (25% smaller than the prior 34px).
  introLarge: { fontSize: 26, lineHeight: 32, fontWeight: '800', marginTop: 0 },
  // Onboarding pack + invitation, screen-anchored near the top (see the `top` set inline).
  onboardBlock: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: spacing.lg },
  // Non-onboarding open: pack below the prompt, with clear breathing room between them.
  center: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: spacing.lg, paddingTop: spacing.xl },
  packFace: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', backfaceVisibility: 'hidden' },
  fill: { width: '100%', height: '100%' },
  pressed: { opacity: 0.75 },
  gridWrap: { flex: 1 },
  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 36 },
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  // Soft shadow behind each grid card (the card itself clips its image, so the shadow lives here).
  gridItem: {
    width: '30%',
    borderRadius: radius.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  // Thin white border + tighter corners than the default CardArt frame.
  gridCard: { width: '100%', borderRadius: radius.sm, borderWidth: 2, borderColor: colors.white },
  footerAbs: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    gap: spacing.sm,
  },
  continueBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueText: { color: colors.primaryText, fontSize: 18, fontWeight: '900' },
  // Horizon navy sampled from the landscape (#102445).
  callout: { color: '#102445', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
