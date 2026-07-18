import { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { ScreenHeader } from '../components/ScreenHeader';
import { PackFront, PACK_RATIO } from '../components/PackFront';
import { PackFan } from '../components/PackFan';
import { Jiggle } from '../components/Jiggle';
import { useGame } from '../store/gameStore';
import { CHALLENGE_PACK_IDS, CADDY_PACK_IDS, cardsInPack, packById, type PackId } from '../data/packs';
import { playGolfHit } from '../sounds';
import { colors, radius, spacing } from '../theme';

// Solid sky blue (sampled from the landscape) — the Card Packs view uses a flat background.
const SKY_BLUE = '#42A7DE';

type Tab = 'challenge' | 'caddy';

export function CardPacksScreen() {
  const { width } = useWindowDimensions();
  const goTo = useGame((s) => s.goTo);
  const ownedPacks = useGame((s) => s.ownedPacks);
  const mode = useGame((s) => s.mode);
  const includeMatchups = useGame((s) => s.includeMatchups);
  const includeWhite = useGame((s) => s.includeWhite);
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
  const isEnabled = (id: PackId): boolean => {
    if (id === 'white-tees') return includeWhite;
    if (id === 'black-tees') return mode === 'pro';
    if (id === 'matchups') return includeMatchups;
    return includeCaddies; // caddy
  };

  // Challenge packs must keep at least one active; the caddy pack has no such rule.
  const activeChallenge = CHALLENGE_PACK_IDS.filter((id) => ownedPacks[id] && isEnabled(id)).length;

  // Renders one pack (sealed+OPEN or fan+toggle). `lockLastActive` guards the last challenge pack.
  const renderPack = (id: PackId, w: number, lockLastActive: boolean) => {
    const pack = packById(id);
    const gridName = pack.gridName ?? pack.name;
    const owned = ownedPacks[id];
    const enabled = isEnabled(id);
    const isLastActive = lockLastActive && enabled && activeChallenge === 1;
    // Fan cards to 90% of the unopened pack's height (PackFront is drawn at 80% of the cell width).
    const unopenedPackH = Math.round(w * 0.8) / PACK_RATIO;
    return (
      <>
        {owned ? (
          <Pressable onPress={() => beginBrowsePack(id)} style={({ pressed }) => pressed && styles.pressed}>
            <PackFan
              name={gridName}
              count={cardsInPack(id).length}
              cards={cardsInPack(id)}
              width={w}
              cardHeight={unopenedPackH * 0.9}
            />
          </Pressable>
        ) : (
          // Unopened decks are shown 20% smaller and jiggle on their own random schedule.
          // Tapping the deck opens it (same as the OPEN button below).
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
        )}

        {owned ? (
          <View style={styles.toggleWrap}>
            <View>
              <Switch
                value={enabled}
                disabled={isLastActive}
                onValueChange={(v) => setPackEnabled(id, v)}
                trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.4)' }}
                thumbColor={colors.white}
              />
              {isLastActive ? <Pressable style={StyleSheet.absoluteFill} onPress={showToast} /> : null}
            </View>
            <Text style={styles.toggleLabel}>{enabled ? 'In play' : 'Off'}</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              playGolfHit();
              beginOpenPack(id);
            }}
            style={({ pressed }) => [styles.openBtn, pressed && styles.pressed]}
          >
            <Text style={styles.openText}>OPEN</Text>
          </Pressable>
        )}
      </>
    );
  };

  return (
    <View style={styles.root}>
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

          {tab === 'challenge' ? (
            <ScrollView
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
            <ScrollView contentContainerStyle={styles.caddyScroll} showsVerticalScrollIndicator={false}>
              {CADDY_PACK_IDS.map((id) => (
                <View key={id} style={styles.caddyCell}>
                  {renderPack(id, caddyW, false)}
                  <Text style={styles.packDesc}>{packById(id).blurb}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <Pressable
            onPress={() => goTo(packsReturn, 'pop')}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
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
    marginBottom: spacing.md,
  },
  segmentBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 999 },
  segmentBtnOn: { backgroundColor: colors.gold },
  segmentText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  segmentTextOn: { color: colors.primaryText },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  cell: { alignItems: 'center', gap: spacing.sm },
  caddyScroll: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.lg },
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
  toggleWrap: { alignItems: 'center', gap: 4 },
  toggleLabel: { color: colors.white, fontSize: 12, fontWeight: '800' },
  openBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  openText: { color: colors.primaryText, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  continueBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
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
