import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { GOLFERS, MAX_GOLFER_RATIO } from '../data/golfers';
import { useGame } from '../store/gameStore';
import { playIronHit } from '../sounds';
import { colors, radius, spacing } from '../theme';

export function OverviewScreen() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const avatars = useGame((s) => s.avatars);
  const holes = useGame((s) => s.holes);
  const mode = useGame((s) => s.mode);
  const includeMatchups = useGame((s) => s.includeMatchups);
  const startRound = useGame((s) => s.startRound);
  const goTo = useGame((s) => s.goTo);

  const onStart = () => {
    playIronHit();
    startRound();
  };

  // Same sizing as the setup ("Who's playing?") grid.
  const gap = spacing.md;
  const columnWidth = (width - spacing.lg * 2 - gap) / 2;
  const cellH = Math.min(columnWidth / MAX_GOLFER_RATIO, height * 0.26);

  return (
    <View style={styles.root}>
      <LandscapeBackground />

      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Ready to play?" onBack={() => goTo('holes')} />

        <View style={styles.content}>
          <View style={[styles.golfers, { width: columnWidth * 2 + gap, gap }]}>
            {players.map((name, i) => {
              const g = GOLFERS[avatars[i] ?? i] ?? GOLFERS[0];
              return (
                <View key={i} style={[styles.golfer, { width: columnWidth }]}>
                  <Image
                    source={g.source}
                    resizeMode="contain"
                    style={{ width: cellH * g.ratio, height: cellH }}
                  />
                  <Text style={styles.golferName} numberOfLines={1}>
                    {name.trim() === '' ? `Player ${i + 1}` : name}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.chipsRow}>
            <View style={[styles.chip, styles.holesChip]}>
              <Text style={styles.holesChipText}>⛳ {holes} Holes</Text>
            </View>
            {mode === 'pro' ? (
              <View style={[styles.chip, styles.teesChip]}>
                <Text style={styles.teesChipText}>Black Tees</Text>
              </View>
            ) : null}
            {includeMatchups ? (
              <View style={[styles.chip, styles.matchupChip]}>
                <Text style={styles.matchupChipText}>⚔️ Matchup!</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={onStart}
            style={({ pressed }) => [styles.startBtn, pressed && styles.startPressed]}
          >
            <Text style={styles.startText}>Start Round</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  holesChip: {
    backgroundColor: 'rgba(11,31,23,0.7)',
    borderColor: colors.gold,
  },
  holesChipText: { color: colors.gold, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  teesChip: {
    backgroundColor: colors.blackTee,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  teesChipText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  matchupChip: {
    backgroundColor: '#D9822B',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  matchupChipText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  footer: {
    paddingBottom: spacing.lg,
    alignItems: 'center',
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
