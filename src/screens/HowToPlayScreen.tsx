import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { useGame } from '../store/gameStore';
import { colors, spacing } from '../theme';

export function HowToPlayScreen() {
  const goTo = useGame((s) => s.goTo);

  return (
    <View style={styles.root}>
      <LandscapeBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="How To Play" onBack={() => goTo('menu', 'pop')} />
        <View style={styles.body}>
          <Text style={styles.placeholder}>How to play — coming soon…</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
