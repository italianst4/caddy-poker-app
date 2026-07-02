import { Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { useGame } from '../store/gameStore';
import { colors, radius, spacing } from '../theme';

export function ModeScreen() {
  const { width } = useWindowDimensions();
  const setMode = useGame((s) => s.setMode);
  const goTo = useGame((s) => s.goTo);

  const btnWidth = Math.min(width * 0.72, 320);

  const choose = (includeBlack: boolean) => {
    setMode(includeBlack ? 'pro' : 'amateur');
    goTo('overview');
  };

  return (
    <View style={styles.root}>
      <LandscapeBackground />

      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Include black tees?" onBack={() => goTo('holes')} />
        <Text style={styles.note}>Black-tee cards have more difficult challenges.</Text>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => choose(true)}
            style={({ pressed }) => [styles.button, { width: btnWidth }, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Yes</Text>
          </Pressable>
          <Pressable
            onPress={() => choose(false)}
            style={({ pressed }) => [styles.button, { width: btnWidth }, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>No</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  note: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  buttons: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  button: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  buttonText: {
    color: colors.gold,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
