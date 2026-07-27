import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { useGame, type GameRecord } from '../store/gameStore';
import { GOLFERS } from '../data/golfers';
import { playGolfHit } from '../sounds';
import { colors, radius, spacing } from '../theme';

/** "Jul 25, 2026 · 4:12 PM" — a compact date + time for each saved game. */
function formatPlayedAt(ms: number): string {
  const d = new Date(ms);
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

const golferFor = (avatar: number) => GOLFERS[avatar] ?? GOLFERS[0];
const nameFor = (name: string, idx: number) => name || `Player ${idx + 1}`;

/** Winner name(s) for a record — joined for a tie, "—" if nobody was dealt in. */
function winnerLabel(record: GameRecord): string {
  const winners = record.players.filter((p) => p.isWinner);
  if (winners.length === 0) return '—';
  return record.players
    .map((p, i) => (p.isWinner ? nameFor(p.name, i) : null))
    .filter((n): n is string => !!n)
    .join(', ');
}

/**
 * On-device history of finished games: a list of past games (newest first), each tappable for a
 * detail view showing every player's earned cards, poker hand, and the winner(s).
 */
export function GameHistoryScreen() {
  const goTo = useGame((s) => s.goTo);
  const history = useGame((s) => s.history);
  const [selected, setSelected] = useState<GameRecord | null>(null);

  // Detail view — one game, every player in add order.
  if (selected) {
    return (
      <ScreenLayout
        title="Game History"
        subtitle={`${formatPlayedAt(selected.playedAt)}  ·  ${selected.holes} holes`}
        onBack={() => setSelected(null)}
        scroll
      >
        {selected.players.map((p, i) => (
          <View key={i} style={[styles.playerRow, p.isWinner && styles.playerRowWin]}>
            <Image source={golferFor(p.avatar).source} resizeMode="contain" style={styles.avatarMed} />
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {nameFor(p.name, i)}
                {p.isWinner ? '  🏆' : ''}
              </Text>
              <Text style={styles.playerHand}>{p.hand ?? '—'}</Text>
            </View>
            <Text style={styles.playerCards}>
              {p.cards} {p.cards === 1 ? 'card' : 'cards'}
            </Text>
          </View>
        ))}
      </ScreenLayout>
    );
  }

  // List view — all games, newest first (already prepended in the store).
  return (
    <ScreenLayout title="Game History" onBack={() => goTo('menu', 'pop')} scroll>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🃏</Text>
          <Text style={styles.emptyTitle}>No games yet</Text>
          <Text style={styles.emptySub}>Play a round to see your history here.</Text>
        </View>
      ) : (
        history.map((record) => (
          <Pressable
            key={record.id}
            onPress={() => {
              playGolfHit();
              setSelected(record);
            }}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardDate}>{formatPlayedAt(record.playedAt)}</Text>
              <Text style={styles.cardHoles}>{record.holes} holes</Text>
            </View>
            <View style={styles.avatarRow}>
              {record.players.map((p, i) => (
                <Image key={i} source={golferFor(p.avatar).source} resizeMode="contain" style={styles.avatarSmall} />
              ))}
            </View>
            <View style={styles.winnerRow}>
              <Text style={styles.trophy}>🏆</Text>
              <Text style={styles.winnerName} numberOfLines={1}>
                {winnerLabel(record)}
                {record.tie ? '  (Tie)' : ''}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  // ---- list ----
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardDate: { color: colors.text, fontSize: 15, fontWeight: '800' },
  cardHoles: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  avatarSmall: { width: 34, height: 34 },
  winnerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trophy: { fontSize: 15 },
  winnerName: { flexShrink: 1, color: colors.gold, fontSize: 15, fontWeight: '900' },

  // ---- detail ----
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  playerRowWin: { borderColor: colors.gold, backgroundColor: colors.bgElevated },
  avatarMed: { width: 48, height: 48 },
  playerInfo: { flex: 1, gap: 2 },
  playerName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  playerHand: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  playerCards: { color: colors.gold, fontSize: 15, fontWeight: '900' },

  // ---- empty state ----
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  emptySub: { color: colors.textMuted, fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
