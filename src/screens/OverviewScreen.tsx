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
import { useState } from 'react';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { PackGridOverlay } from '../components/PackGridOverlay';
import { GOLFERS, MAX_GOLFER_RATIO } from '../data/golfers';
import { CHALLENGE_PACK_IDS, PACK_THEME, cardsInPack, packById, type PackId } from '../data/packs';
import { useGame } from '../store/gameStore';
import { playIronHit } from '../sounds';
import { colors, radius, spacing } from '../theme';

export function OverviewScreen() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const avatars = useGame((s) => s.avatars);
  const holes = useGame((s) => s.holes);
  const ownedPacks = useGame((s) => s.ownedPacks);
  const packEnabled = useGame((s) => s.packEnabled);
  const startRound = useGame((s) => s.startRound);
  const goTo = useGame((s) => s.goTo);
  const editGolfer = useGame((s) => s.editGolfer);
  const setPackEnabled = useGame((s) => s.setPackEnabled);

  const [browsePack, setBrowsePack] = useState<PackId | null>(null);
  const [changeOpen, setChangeOpen] = useState(false);

  const onStart = () => {
    playIronHit();
    startRound();
  };

  // Same sizing as the setup ("Who's playing?") grid.
  const gap = spacing.md;
  const columnWidth = (width - spacing.lg * 2 - gap) / 2;
  const cellH = Math.min(columnWidth / MAX_GOLFER_RATIO, height * 0.22);

  // The navy horizon sits ~79.8% down the landscape; keep the Start button below it (in the grass).
  const horizonY = Math.round(height * 0.798);

  // Only challenge packs are ever "in play" here — caddies are handled at the poker finale.
  const inPlay = CHALLENGE_PACK_IDS.filter((id) => ownedPacks[id] && packEnabled[id]);
  // In-play packs are shown as color pills, 3 to a row.
  const chipW = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

  // "Change" bottom sheet: owned challenge packs, toggled in/out of play (keep at least one on).
  const ownedChallenge = CHALLENGE_PACK_IDS.filter((id) => ownedPacks[id]);
  const enabledCount = ownedChallenge.filter((id) => packEnabled[id]).length;
  const togglePack = (id: PackId) => {
    const on = packEnabled[id];
    if (on && enabledCount <= 1) return; // keep at least one challenge pack in play
    setPackEnabled(id, !on);
  };

  return (
    <View style={styles.root}>
      <LandscapeBackground />

      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Ready to play?" onBack={() => goTo('holes')} />

        <View style={[styles.content, { paddingBottom: height - horizonY }]}>
          <View style={[styles.golfers, { width: columnWidth * 2 + gap, gap }]}>
            {players.map((name, i) => {
              const g = GOLFERS[avatars[i] ?? i] ?? GOLFERS[0];
              return (
                <Pressable
                  key={i}
                  onPress={() => editGolfer(i)}
                  style={({ pressed }) => [styles.golfer, { width: columnWidth }, pressed && styles.pressed]}
                >
                  <Image
                    source={g.source}
                    resizeMode="contain"
                    style={{ width: cellH * g.ratio, height: cellH }}
                  />
                  <Text style={styles.golferName} numberOfLines={1}>
                    {name.trim() === '' ? `Player ${i + 1}` : name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

        </View>
      </SafeAreaView>

      {/* Challenge cards in play — pinned so the decks sit just above the navy horizon. */}
      <View style={[styles.packsSection, { bottom: height - horizonY + spacing.md }]}>
        <View style={styles.packsHeaderRow}>
          <Text style={styles.packsLabel}>Challenge cards in play</Text>
          <Pressable
            onPress={() => setChangeOpen(true)}
            style={({ pressed }) => [styles.changeBtn, pressed && styles.pressed]}
          >
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>
        <View style={styles.packsRow}>
          {inPlay.map((id) => {
            const p = packById(id);
            const theme = PACK_THEME[id];
            return (
              <Pressable
                key={id}
                onPress={() => setBrowsePack(id)}
                style={({ pressed }) => [styles.packChip, { width: chipW, backgroundColor: theme.band }, pressed && styles.pressed]}
              >
                <Text style={[styles.packChipName, { color: theme.ink }]} numberOfLines={1} adjustsFontSizeToFit>
                  {p.name}
                </Text>
                <View style={styles.packBadge}>
                  <Text style={styles.packBadgeText}>{cardsInPack(id).length}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Start button (with the hole count), pinned just below the navy horizon (in the grass). */}
      <View style={[styles.footer, { top: horizonY + spacing.xl * 1.6 }]}>
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [styles.startBtn, pressed && styles.startPressed]}
        >
          <Text style={styles.startText}>Start Round</Text>
          <Text style={styles.startSub}>{holes} Holes</Text>
        </Pressable>
      </View>

      {browsePack !== null ? (
        <PackGridOverlay
          title={packById(browsePack).openTitle}
          cards={cardsInPack(browsePack)}
          onClose={() => setBrowsePack(null)}
        />
      ) : null}

      {/* "Change" bottom sheet — pick which owned challenge packs are in play. */}
      {changeOpen ? (
        <View style={styles.sheetRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setChangeOpen(false)} />
          <Animated.View entering={SlideInDown.duration(260)} exiting={SlideOutDown.duration(200)} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Challenge cards in play</Text>
            <Text style={styles.sheetHint}>Tap to toggle. At least one stays in play.</Text>
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              {ownedChallenge.map((id) => {
                const on = packEnabled[id];
                return (
                  <Pressable
                    key={id}
                    onPress={() => togglePack(id)}
                    style={({ pressed }) => [styles.sheetRow, pressed && styles.pressed]}
                  >
                    <View style={[styles.check, on && styles.checkOn]}>
                      {on ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.sheetRowName}>{packById(id).name}</Text>
                    <Text style={styles.sheetRowCount}>{cardsInPack(id).length} cards</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              onPress={() => setChangeOpen(false)}
              style={({ pressed }) => [styles.sheetDone, pressed && styles.pressed]}
            >
              <Text style={styles.sheetDoneText}>Done</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.lg,
    paddingTop: spacing.xl, // space between the "Ready to play?" headline and the avatars
  },
  golfers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    alignSelf: 'center',
    rowGap: spacing.md,
  },
  golfer: { alignItems: 'center', gap: spacing.xs },
  pressed: { opacity: 0.7 },
  golferName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    maxWidth: '100%',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Absolute so its bottom (the pills) can be pinned just above the horizon (top set inline).
  packsSection: { position: 'absolute', left: 0, right: 0, paddingHorizontal: spacing.lg, gap: spacing.sm },
  packsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  changeBtn: {
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  changeText: { color: colors.primaryText, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  // "Change" bottom sheet.
  sheetRoot: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    maxHeight: '72%',
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: spacing.md },
  sheetTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  sheetHint: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 2, marginBottom: spacing.sm },
  sheetList: { alignSelf: 'stretch' },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.white, fontSize: 15, fontWeight: '900' },
  sheetRowName: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '800' },
  sheetRowCount: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  sheetDone: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sheetDoneText: { color: colors.primaryText, fontSize: 17, fontWeight: '900' },
  packsLabel: {
    textAlign: 'left',
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Up to 3 pills per row; badges overflow the top-right corner, so leave a little top margin.
  packsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  // Pack pill — background is the pack's brand color (PACK_THEME.band), text is its ink.
  packChip: {
    borderRadius: 999,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  packChipName: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  // Card-count badge pinned to the pill's top-right corner — one consistent color for every pack.
  packBadge: {
    position: 'absolute',
    top: -7,
    right: -7,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.primaryText,
  },
  packBadgeText: { fontSize: 12, fontWeight: '900', color: colors.primaryText },
  // Pinned below the horizon (top set inline); spans the width and centers the button + holes.
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  startBtn: {
    width: '90%',
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  startText: {
    color: colors.primaryText,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  // Hole count as a subtitle inside the button.
  startSub: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '800',
    opacity: 0.8,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
