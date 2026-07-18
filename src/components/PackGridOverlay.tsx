import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CardArt } from './CardArt';
import { PackCardViewer } from './PackCardViewer';
import { colors, radius, spacing } from '../theme';
import type { Card } from '../data/cards';

type Props = {
  /** Optional heading (e.g. the pack name). */
  title?: string;
  cards: Card[];
  onClose: () => void;
};

/**
 * A full-screen (semi-transparent) overlay showing a pack's cards in a grid. Tapping a card opens
 * the swipeable full-screen viewer. Tap the backdrop or Close to dismiss.
 */
export function PackGridOverlay({ title, cards, onClose }: Props) {
  const { width } = useWindowDimensions();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const cardW = Math.min((width - spacing.lg * 2 - spacing.sm * 2) / 3, 108);

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <SafeAreaView style={styles.safe}>
        {title ? <Text style={styles.title}>{title}</Text> : null}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {cards.map((card, i) => (
            <Animated.View
              key={card.id}
              entering={FadeInDown.delay(i * 40).duration(280).springify()}
              style={[styles.item, { width: cardW }]}
            >
              <Pressable onPress={() => setViewerIndex(i)} style={({ pressed }) => pressed && styles.pressed}>
                <CardArt card={card} style={styles.card} />
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>

        <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </SafeAreaView>

      {viewerIndex !== null ? (
        <PackCardViewer
          cards={cards}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          sparkle={false}
        />
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
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  // Same top offset as the Menu title (ScreenHeader row's marginTop), below the safe-area inset.
  title: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  scroll: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  // Soft shadow behind each card (the card clips its image, so the shadow lives on the wrapper).
  item: {
    borderRadius: radius.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  card: { width: '100%', borderRadius: radius.sm, borderWidth: 2, borderColor: colors.white },
  pressed: { opacity: 0.8 },
  closeBtn: {
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  closeText: { color: colors.text, fontSize: 16, fontWeight: '800' },
});
