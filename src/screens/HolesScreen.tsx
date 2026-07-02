import { Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { useGame } from '../store/gameStore';
import { colors, radius, spacing } from '../theme';

const OPTIONS: (9 | 18)[] = [9, 18];

export function HolesScreen() {
  const { width } = useWindowDimensions();
  const setHoles = useGame((s) => s.setHoles);
  const goTo = useGame((s) => s.goTo);

  const gap = spacing.md;
  const squareSize = Math.min(width * 0.6, 230);

  const choose = (h: 9 | 18) => {
    setHoles(h);
    goTo('overview');
  };

  return (
    <View style={styles.root}>
      <LandscapeBackground />

      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="How many holes?" onBack={() => goTo('count')} />

        <View style={[styles.row, { gap }]}>
          {OPTIONS.map((h) => (
            <Pressable
              key={h}
              onPress={() => choose(h)}
              style={({ pressed }) => [
                styles.square,
                { width: squareSize, height: squareSize },
                pressed && styles.squarePressed,
              ]}
            >
              <Text style={styles.squareNum}>{h}</Text>
              <Text style={styles.squareLabel}>HOLES</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    paddingTop: spacing.xl,
  },
  square: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squarePressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  squareNum: {
    color: colors.gold,
    fontSize: 72,
    fontWeight: '900',
  },
  squareLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
});
