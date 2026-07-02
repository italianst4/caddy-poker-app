import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { useGame } from '../store/gameStore';
import { colors, radius, spacing } from '../theme';

export function MenuScreen() {
  const mode = useGame((s) => s.mode);
  const setMode = useGame((s) => s.setMode);
  const noPokerDeck = useGame((s) => s.noPokerDeck);
  const setNoPokerDeck = useGame((s) => s.setNoPokerDeck);
  const goTo = useGame((s) => s.goTo);
  const { height } = useWindowDimensions();

  const includeBlackTees = mode === 'pro';

  const onRestore = () => {
    // TODO: hook up to Apple Payments; on success, show the restored purchase details.
    Alert.alert('Restore Purchase', 'TODO — this will be hooked up to Apple Payments.');
  };

  return (
    <View style={styles.root}>
      <LandscapeBackground cloudOffset={height * 0.28} />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Menu" onBack={() => goTo('home', 'pop')} />

        <View style={styles.body}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Include Black Tee Cards</Text>
              <Text style={styles.settingNote}>Add hard challenges to the deck</Text>
            </View>
            <Switch
              value={includeBlackTees}
              onValueChange={(v) => setMode(v ? 'pro' : 'amateur')}
              trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.25)' }}
              thumbColor={colors.white}
            />
          </View>

          <View style={[styles.settingRow, styles.lastSettingRow]}>
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Play Without Poker Deck</Text>
              <Text style={styles.settingNote}>Play challenges only, no poker hand finale</Text>
            </View>
            <Switch
              value={noPokerDeck}
              onValueChange={setNoPokerDeck}
              trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.25)' }}
              thumbColor={colors.white}
            />
          </View>

          <Pressable
            onPress={() => goTo('howToPlay', 'push')}
            style={({ pressed }) => [styles.restoreBtn, pressed && styles.pressed]}
          >
            <Text style={styles.restoreText}>How To Play</Text>
          </Pressable>

          <Pressable
            onPress={onRestore}
            style={({ pressed }) => [styles.restoreBtn, pressed && styles.pressed]}
          >
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </Pressable>
        </View>

        <Text style={styles.copyright}>© 2026 - Tangent Thinking LLC</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  body: { flex: 1, gap: spacing.lg, paddingTop: spacing.lg },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
  },
  lastSettingRow: { marginBottom: spacing.xl * 2 },
  settingText: { flexShrink: 1, gap: 2 },
  settingLabel: { color: colors.text, fontSize: 17, fontWeight: '800' },
  settingNote: { color: colors.black, fontSize: 13, fontWeight: '500' },
  restoreBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gold,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
  },
  restoreText: { color: colors.gold, fontSize: 17, fontWeight: '800' },
  pressed: { opacity: 0.7 },
  copyright: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingBottom: 0,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
