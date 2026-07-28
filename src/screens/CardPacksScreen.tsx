import { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '../components/ScreenHeader';
import { CloudLayer } from '../components/CloudLayer';
import { PackFront } from '../components/PackFront';
import { PackFan } from '../components/PackFan';
import { Jiggle } from '../components/Jiggle';
import { useGame } from '../store/gameStore';
import { CHALLENGE_PACK_IDS, CADDY_PACK_IDS, PACK_THEME, cardsInPack, packById, type PackId } from '../data/packs';
import { playGolfHit } from '../sounds';
import { colors, radius, spacing } from '../theme';

// Solid sky blue (sampled from the landscape) — the Card Packs view uses a flat background.
const SKY_BLUE = '#42A7DE';
const SKY_RGB = '66,167,222';
const SKY_CLEAR = `rgba(${SKY_RGB},0)`;
const SKY_SOLID = `rgba(${SKY_RGB},1)`;

type Tab = 'challenge' | 'caddy';

export function CardPacksScreen() {
  const { width } = useWindowDimensions();
  const goTo = useGame((s) => s.goTo);
  const ownedPacks = useGame((s) => s.ownedPacks);
  const packEnabled = useGame((s) => s.packEnabled);
  const includeCaddies = useGame((s) => s.includeCaddies);
  const setPackEnabled = useGame((s) => s.setPackEnabled);
  const beginOpenPack = useGame((s) => s.beginOpenPack);
  const beginBrowsePack = useGame((s) => s.beginBrowsePack);
  const packsReturn = useGame((s) => s.packsReturn);

  const [tab, setTab] = useState<Tab>('challenge');
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const showToast = () => {
    setToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2200);
  };

  const H_INSET = spacing.lg;
  const COL_GAP = spacing.lg;
  const cellW = Math.floor((width - spacing.lg * 2 - H_INSET * 2 - COL_GAP) / 2);
  const caddyW = Math.min(Math.round(width * 0.5), 220);

  // Whether an owned pack is currently in play (drives its toggle).
  const isEnabled = (id: PackId): boolean => (id === 'caddy' ? includeCaddies : packEnabled[id]);

  // Challenge packs must keep at least one active; the caddy pack has no such rule.
  const activeChallenge = CHALLENGE_PACK_IDS.filter((id) => ownedPacks[id] && isEnabled(id)).length;

  // Renders one pack (sealed+OPEN or fan+toggle). `lockLastActive` guards the last challenge pack.
  const renderPack = (id: PackId, w: number, lockLastActive: boolean) => {
    const pack = packById(id);
    const gridName = pack.gridName ?? pack.name;
    const owned = ownedPacks[id];
    const enabled = isEnabled(id);
    const isLastActive = lockLastActive && enabled && activeChallenge === 1;
    if (owned) {
      return (
        <View style={styles.packWrap}>
          <Pressable onPress={() => beginBrowsePack(id)} style={({ pressed }) => pressed && styles.pressed}>
            <PackFan
              name={gridName}
              count={cardsInPack(id).length}
              cards={cardsInPack(id)}
              width={Math.round(w * 0.8)}
              ripped={pack.ripped}
              ink={PACK_THEME[id].ink}
            />
          </Pressable>
          {/* In-play badge, top-right of the pack: green "In Play" ⇄ gray "Off" on tap. */}
          <Pressable
            onPress={() => {
              if (enabled && isLastActive) return showToast(); // keep at least one challenge pack active
              setPackEnabled(id, !enabled);
            }}
            hitSlop={6}
            style={[styles.playBadge, enabled ? styles.playBadgeOn : styles.playBadgeOff]}
          >
            <Text style={styles.playBadgeText}>{enabled ? 'In Play' : 'Off'}</Text>
          </Pressable>
        </View>
      );
    }
    // Unopened decks jiggle on their own random schedule; tapping the deck opens it.
    return (
      <Pressable
        onPress={() => {
          playGolfHit();
          beginOpenPack(id);
        }}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Jiggle>
          <PackFront pack={pack} width={Math.round(w * 0.8)} name={gridName} />
        </Jiggle>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      {/* Two clouds drifting slowly across the sky-blue background. */}
      <CloudLayer />
      <View style={styles.flex}>
        <SafeAreaView style={styles.safe}>
          <ScreenHeader title="Card Packs" onBack={() => goTo(packsReturn, 'pop')} />

          {/* Challenge / Caddy segmented toggle. */}
          <View style={styles.segment}>
            {(['challenge', 'caddy'] as Tab[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.segmentBtn, tab === t && styles.segmentBtnOn]}
              >
                <Text style={[styles.segmentText, tab === t && styles.segmentTextOn]}>
                  {t === 'challenge' ? 'Challenge Packs' : 'Caddy Packs'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.hint}>Tap any deck to open</Text>

          {/* Scroll fills to the bottom of the view; a soft gradient lets the packs fade under it. */}
          <View style={styles.scrollArea}>
            {tab === 'challenge' ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.grid, { paddingHorizontal: H_INSET }]}
                showsVerticalScrollIndicator={false}
              >
                {CHALLENGE_PACK_IDS.map((id) => (
                  <View key={id} style={[styles.cell, { width: cellW }]}>
                    {renderPack(id, cellW, true)}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <ScrollView style={styles.scroll} contentContainerStyle={styles.caddyScroll} showsVerticalScrollIndicator={false}>
                {CADDY_PACK_IDS.map((id) => (
                  <View key={id} style={styles.caddyCell}>
                    {renderPack(id, caddyW, false)}
                    <Text style={styles.packDesc}>{packById(id).blurb}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            {/* Packs fade under the toggle/subtext above and into the background below. */}
            <LinearGradient pointerEvents="none" colors={[SKY_SOLID, SKY_CLEAR]} style={styles.fadeTop} />
            <LinearGradient pointerEvents="none" colors={[SKY_CLEAR, SKY_SOLID]} style={styles.fadeBottom} />
          </View>

          {/* Continue only appears when Card Packs was opened mid-setup (e.g. from the Ready-to-play
              view), not from the Menu — there the back arrow is the way out. */}
          {packsReturn !== 'menu' ? (
            <Pressable
              onPress={() => goTo(packsReturn, 'pop')}
              style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
            >
              <Text style={styles.continueText}>Continue</Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </View>

      {toast ? (
        <Animated.View
          entering={SlideInDown.duration(280)}
          exiting={SlideOutDown.duration(220)}
          pointerEvents="none"
          style={styles.toast}
        >
          <Text style={styles.toastText}>At least one pack must be active</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_BLUE },
  flex: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  segment: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(11,31,23,0.25)',
    borderRadius: 999,
    padding: 3,
    marginBottom: spacing.sm,
  },
  // Hint under the segmented toggle — replaces the per-deck OPEN buttons.
  hint: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  segmentBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 999 },
  segmentBtnOn: { backgroundColor: colors.gold },
  segmentText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  segmentTextOn: { color: colors.primaryText },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // align pack bottoms in a row (opened torn packs line up with sealed ones)
    rowGap: spacing.lg,
    paddingTop: 34, // clear the top fade so the first row sits fully below it at rest
    paddingBottom: 96, // clear the bottom fade so the last row can scroll fully into view
  },
  cell: { alignItems: 'center', gap: spacing.sm },
  caddyScroll: { alignItems: 'center', paddingTop: 34, paddingBottom: 96 },
  caddyCell: { alignItems: 'center', gap: spacing.md },
  // Short pack blurb shown below an (unopened) pack — same size as the caddy description.
  packDesc: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    lineHeight: 20,
  },
  pressed: { opacity: 0.7 },
  // Relative wrapper so the in-play badge can pin to the pack's top-right corner.
  packWrap: { position: 'relative' },
  playBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    zIndex: 50,
  },
  playBadgeOn: { backgroundColor: colors.primary }, // green = in play
  playBadgeOff: { backgroundColor: '#8A9296' }, // gray = off
  playBadgeText: { color: colors.white, fontSize: 11, fontWeight: '900', textAlign: 'center', letterSpacing: 0.2 },
  // The scroll area fills to the bottom of the view; the fade sits over its bottom edge.
  scrollArea: { flex: 1, position: 'relative' },
  scroll: { flex: 1 },
  // Soft gradients so packs dissolve into the background at the top (under the toggle/subtext) and
  // the bottom. Both bleed past the screen's horizontal padding to span edge-to-edge.
  fadeTop: { position: 'absolute', left: -spacing.lg, right: -spacing.lg, top: 0, height: 40 },
  fadeBottom: { position: 'absolute', left: -spacing.lg, right: -spacing.lg, bottom: 0, height: 104 },
  continueBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  continueText: { color: colors.primaryText, fontSize: 18, fontWeight: '900' },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  toastText: { color: colors.gold, fontSize: 16, fontWeight: '900', textAlign: 'center' },
});
