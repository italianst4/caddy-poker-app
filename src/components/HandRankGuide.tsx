import { SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { PokerCardView } from './PokerCardView';
import { cardId, type PokerCard, type Rank, type Suit } from '../data/pokerDeck';
import { colors, spacing } from '../theme';

const mk = (rank: Rank, suit: Suit): PokerCard => ({ id: cardId(rank, suit), rank, suit });

/**
 * The ten poker hands, best first. `made` = how many of the (leading) cards actually form the
 * hand; the remaining cards are kickers, shown dimmed.
 */
const RANKS: { name: string; made: number; cards: PokerCard[] }[] = [
  { name: 'Royal Flush', made: 5, cards: [mk('10', 'S'), mk('J', 'S'), mk('Q', 'S'), mk('K', 'S'), mk('A', 'S')] },
  { name: 'Straight Flush', made: 5, cards: [mk('5', 'H'), mk('6', 'H'), mk('7', 'H'), mk('8', 'H'), mk('9', 'H')] },
  { name: 'Four of a Kind', made: 4, cards: [mk('9', 'S'), mk('9', 'H'), mk('9', 'D'), mk('9', 'C'), mk('K', 'S')] },
  { name: 'Full House', made: 5, cards: [mk('Q', 'S'), mk('Q', 'H'), mk('Q', 'D'), mk('4', 'C'), mk('4', 'S')] },
  { name: 'Flush', made: 5, cards: [mk('2', 'D'), mk('5', 'D'), mk('9', 'D'), mk('J', 'D'), mk('K', 'D')] },
  { name: 'Straight', made: 5, cards: [mk('5', 'C'), mk('6', 'D'), mk('7', 'H'), mk('8', 'S'), mk('9', 'D')] },
  { name: 'Three of a Kind', made: 3, cards: [mk('8', 'S'), mk('8', 'H'), mk('8', 'D'), mk('K', 'C'), mk('2', 'S')] },
  { name: 'Two Pair', made: 4, cards: [mk('A', 'S'), mk('A', 'H'), mk('7', 'D'), mk('7', 'C'), mk('3', 'S')] },
  { name: 'Pair', made: 2, cards: [mk('10', 'S'), mk('10', 'H'), mk('K', 'D'), mk('5', 'C'), mk('2', 'S')] },
  { name: 'High Card', made: 1, cards: [mk('A', 'S'), mk('K', 'H'), mk('9', 'D'), mk('5', 'C'), mk('2', 'S')] },
];

/** Full-screen reference of all poker hands, ranked high → low, with example cards. */
export function HandRankGuide({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const cardW = Math.min((width - spacing.lg * 2 - 130) / 5, 34);

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Poker Hand Ranks</Text>
          <Text style={styles.subtitle}>Best at top → lowest at bottom</Text>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {RANKS.map((h, i) => (
            <View key={h.name} style={[styles.row, i === RANKS.length - 1 && styles.lastRow]}>
              <Text style={styles.rowRank} numberOfLines={1}>
                {i + 1}
              </Text>
              <Text style={styles.rowName} numberOfLines={2}>
                {h.name}
              </Text>
              <View style={styles.cards}>
                {h.cards.map((c, ci) => (
                  <PokerCardView
                    key={c.id}
                    card={c}
                    width={cardW}
                    style={{ marginLeft: 2, opacity: ci < h.made ? 1 : 0.22 }}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Close" variant="secondary" onPress={onClose} />
        </View>
      </SafeAreaView>
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
    backgroundColor: 'rgba(6,18,12,0.98)',
    zIndex: 30,
  },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  header: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.gold, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  lastRow: { borderBottomWidth: 0 },
  rowRank: { color: colors.textMuted, fontSize: 14, fontWeight: '900', width: 24, textAlign: 'center' },
  rowName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '800' },
  cards: { flexDirection: 'row', alignItems: 'center' },
  footer: { paddingVertical: spacing.md },
});
