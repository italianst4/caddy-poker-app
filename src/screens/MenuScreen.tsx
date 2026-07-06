import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { useGame } from '../store/gameStore';
import { playGolfHit } from '../sounds';
import { track } from '../analytics';
import { colors, radius, spacing } from '../theme';

/** Record a menu switch flip (no PII — just which toggle and its new value). */
const toggle = (name: string, enabled: boolean) => track('menu_toggle', { toggle: name, enabled });

export function MenuScreen() {
  const mode = useGame((s) => s.mode);
  const setMode = useGame((s) => s.setMode);
  const includeMatchups = useGame((s) => s.includeMatchups);
  const setIncludeMatchups = useGame((s) => s.setIncludeMatchups);
  const includeCaddies = useGame((s) => s.includeCaddies);
  const setIncludeCaddies = useGame((s) => s.setIncludeCaddies);
  const noPokerDeck = useGame((s) => s.noPokerDeck);
  const setNoPokerDeck = useGame((s) => s.setNoPokerDeck);
  const useVirtualPokerDeck = useGame((s) => s.useVirtualPokerDeck);
  const setUseVirtualPokerDeck = useGame((s) => s.setUseVirtualPokerDeck);
  const showLiveActivity = useGame((s) => s.showLiveActivity);
  const setShowLiveActivity = useGame((s) => s.setShowLiveActivity);
  const goTo = useGame((s) => s.goTo);

  const includeBlackTees = mode === 'pro';

  const onRestore = () => {
    // TODO: hook up to Apple Payments; on success, show the restored purchase details.
    Alert.alert('Coming Soon', 'Restore Purchase is coming soon.', [{ text: 'OK' }]);
  };

  return (
    <View style={styles.root}>
      {/* Opaque backdrop covering the Home screen underneath. The Home→Menu step swap is
          instant (no sliding container), so the background stays put; only the content below
          slides in. */}
      <LandscapeBackground hideClouds />
      <Animated.View style={styles.flex} entering={SlideInRight.duration(320)}>
        <SafeAreaView style={styles.safe}>
          <ScreenHeader title="Menu" onBack={() => goTo('home')} />

        <View style={styles.body}>
          <View style={styles.toggles}>
            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Include Black Tee Cards</Text>
                <Text style={styles.settingNote}>Add hard challenges to the deck</Text>
              </View>
              <Switch
                value={includeBlackTees}
                onValueChange={(v) => {
                  toggle('black_tees', v);
                  setMode(v ? 'pro' : 'amateur');
                }}
                trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.25)' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Include Matchup Cards</Text>
                <Text style={styles.settingNote}>Add head-to-head golfer challenges</Text>
              </View>
              <Switch
                value={includeMatchups}
                onValueChange={(v) => {
                  toggle('matchups', v);
                  setIncludeMatchups(v);
                }}
                trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.25)' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Include Caddy Cards</Text>
                <Text style={styles.settingNote}>Draw caddy cards for the poker finale</Text>
              </View>
              <Switch
                value={includeCaddies}
                onValueChange={(v) => {
                  toggle('caddies', v);
                  setIncludeCaddies(v);
                }}
                trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.25)' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Challenges Only</Text>
                <Text style={styles.settingNote}>Play challenges only, no poker hand finale</Text>
              </View>
              <Switch
                value={noPokerDeck}
                onValueChange={(v) => {
                  toggle('challenges_only', v);
                  setNoPokerDeck(v);
                }}
                trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.25)' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={[styles.settingRow, noPokerDeck && styles.settingDisabled]}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Use Virtual Poker Deck</Text>
                <Text style={styles.settingNote}>Play poker with a virtual deck</Text>
              </View>
              <Switch
                value={useVirtualPokerDeck}
                onValueChange={(v) => {
                  toggle('virtual_deck', v);
                  setUseVirtualPokerDeck(v);
                }}
                disabled={noPokerDeck}
                trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.25)' }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Show Live Activity</Text>
                <Text style={styles.settingNote}>Show challenges on your Lock Screen</Text>
              </View>
              <Switch
                value={showLiveActivity}
                onValueChange={(v) => {
                  toggle('live_activity', v);
                  setShowLiveActivity(v);
                }}
                trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.25)' }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          <Pressable
            onPress={() => {
              playGolfHit();
              // Instant (no push) so the video screen mounts exactly once — a slide transition
              // remounts it and restarts the video, doubling the opening audio.
              goTo('howToPlay');
            }}
            style={({ pressed }) => [styles.restoreBtn, styles.firstButton, pressed && styles.pressed]}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  body: { flex: 1, gap: spacing.lg, paddingTop: spacing.lg },
  // Toggles grouped with one consistent, tight gap between each row.
  toggles: { gap: spacing.sm },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.lg,
  },
  settingDisabled: { opacity: 0.4 },
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
  // Extra breathing room between the toggles and the first button.
  firstButton: { marginTop: spacing.md * 2 },
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
