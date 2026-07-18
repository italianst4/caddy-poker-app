import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useState } from 'react';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { PackFan } from '../components/PackFan';
import { PackGridOverlay } from '../components/PackGridOverlay';
import { GOLFERS, MAX_GOLFER_RATIO } from '../data/golfers';
import { CHALLENGE_PACK_IDS, cardsInPack, packById, type PackId } from '../data/packs';
import { useGame } from '../store/gameStore';
import { playIronHit } from '../sounds';
import { colors, radius, spacing } from '../theme';

export function OverviewScreen() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const avatars = useGame((s) => s.avatars);
  const holes = useGame((s) => s.holes);
  const ownedPacks = useGame((s) => s.ownedPacks);
  const mode = useGame((s) => s.mode);
  const includeMatchups = useGame((s) => s.includeMatchups);
  const includeWhite = useGame((s) => s.includeWhite);
  const startRound = useGame((s) => s.startRound);
  const goTo = useGame((s) => s.goTo);
  const editGolfer = useGame((s) => s.editGolfer);
  const goToCardPacks = useGame((s) => s.goToCardPacks);

  const [browsePack, setBrowsePack] = useState<PackId | null>(null);

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

  const packEnabled = (id: PackId) =>
    id === 'white-tees' ? includeWhite : id === 'black-tees' ? mode === 'pro' : includeMatchups;
  // Only challenge packs are ever "in play" here — caddies are handled at the poker finale.
  const inPlay = CHALLENGE_PACK_IDS.filter((id) => ownedPacks[id] && packEnabled(id));

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
            onPress={() => goToCardPacks('overview')}
            style={({ pressed }) => [styles.changeBtn, pressed && styles.pressed]}
          >
            <Text style={styles.changeText}>+ Add</Text>
          </Pressable>
        </View>
        <View style={styles.packsRow}>
          {inPlay.map((id) => {
            const p = packById(id);
            return (
              <Pressable
                key={id}
                onPress={() => setBrowsePack(id)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <PackFan
                  name={p.gridName ?? p.name}
                  count={cardsInPack(id).length}
                  cards={cardsInPack(id)}
                  width={Math.min(width * 0.26, 96)}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Start + hole count, pinned just below the navy horizon (in the grass). */}
      <View style={[styles.footer, { top: horizonY + spacing.md }]}>
        <Pressable
          onPress={onStart}
          style={({ pressed }) => [styles.startBtn, pressed && styles.startPressed]}
        >
          <Text style={styles.startText}>Start Round</Text>
        </Pressable>
        {/* Hole count below the button — plain emoji + dark green text; tap to change it. */}
        <Pressable onPress={() => goTo('holes')} hitSlop={10} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.holesText}>⛳ {holes} Holes</Text>
        </Pressable>
      </View>

      {browsePack !== null ? (
        <PackGridOverlay
          title={packById(browsePack).openTitle}
          cards={cardsInPack(browsePack)}
          onClose={() => setBrowsePack(null)}
        />
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
  // Absolute so its bottom (the decks) can be pinned just above the horizon (top set inline).
  packsSection: { position: 'absolute', left: 0, right: 0, paddingLeft: spacing.lg, gap: spacing.sm },
  packsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  packsLabel: {
    textAlign: 'left',
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  packsRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  // Solid gold "chip" — distinct from the dark, gold-outlined name pills on the fans.
  changeBtn: {
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  changeText: { color: colors.primaryText, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  // Pinned below the horizon (top set inline); spans the width and centers the button + holes.
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  holesText: {
    color: '#0B3D2E', // dark green
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
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
});
