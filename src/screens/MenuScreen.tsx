import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';
import * as StoreReview from 'expo-store-review';
import Animated, { SlideInRight } from 'react-native-reanimated';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { WebViewOverlay } from '../components/WebViewOverlay';
import { useGame } from '../store/gameStore';
import { devExpireTrial, devResetTrial, useIsUnlocked, useTrialDaysLeft } from '../entitlements';
import { devToolsEnabled } from '../buildEnv';
import { playGolfHit } from '../sounds';
import { track } from '../analytics';
import { colors, radius, spacing } from '../theme';

/** Record a menu switch flip (no PII — just which toggle and its new value). */
const toggle = (name: string, enabled: boolean) => track('menu_toggle', { toggle: name, enabled });

const PRIVACY_URL = 'https://caddypoker.com/privacy-policy/';
const TERMS_URL = 'https://caddypoker.com/terms-of-service/';
const SHARE_URL = 'https://caddypoker.com';

export function MenuScreen() {
  const showLiveActivity = useGame((s) => s.showLiveActivity);
  const setShowLiveActivity = useGame((s) => s.setShowLiveActivity);
  const goTo = useGame((s) => s.goTo);
  const goToCardPacks = useGame((s) => s.goToCardPacks);
  const isUnlocked = useIsUnlocked();
  const daysLeft = useTrialDaysLeft();
  const devResetPacks = useGame((s) => s.devResetPacks);
  const devNewUserReset = useGame((s) => s.devNewUserReset);

  // Which legal page (if any) is showing in the in-app WebView overlay.
  const [webPage, setWebPage] = useState<{ url: string; title: string } | null>(null);

  // Rate Us → the native iOS in-app rating overlay (falls back to the site if unavailable).
  const onRate = async () => {
    playGolfHit();
    track('menu_link', { link: 'rate_us' });
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
        return;
      }
    } catch {
      // fall through to the web fallback
    }
    Linking.openURL(SHARE_URL).catch(() => {});
  };

  // Invite Your Friends → the native iOS share sheet.
  const onInvite = async () => {
    playGolfHit();
    track('menu_link', { link: 'invite' });
    try {
      await Share.share({
        message: `Play golf and poker at the same time with Caddy Poker! ${SHARE_URL}`,
      });
    } catch {
      // user dismissed / share unavailable — nothing to do
    }
  };

  // Open a legal page (Privacy Policy / Terms of Service) in an in-app WebView overlay so the
  // user never leaves the app.
  const openLegal = (url: string, title: string, link: string) => {
    playGolfHit();
    track('menu_link', { link });
    setWebPage({ url, title });
  };

  // Hidden dev tools: long-press the copyright to force trial expiry / reset and to replay the
  // card-pack onboarding (for testing without a reinstall). Not discoverable in normal use.
  const onDevTools = () => {
    Alert.alert('Dev', undefined, [
      { text: 'Expire trial now', onPress: () => devExpireTrial() },
      { text: 'Reset trial (full)', onPress: () => devResetTrial() },
      { text: 'Reset card packs (replay open)', onPress: () => devResetPacks() },
      {
        text: 'New user reset',
        style: 'destructive',
        onPress: () => {
          devNewUserReset();
          devResetTrial();
          goTo('home');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
            <Pressable
              onPress={() => {
                playGolfHit();
                goToCardPacks('menu');
              }}
              style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
            >
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Card Packs</Text>
                <Text style={styles.settingNote}>Open packs and choose which are in play</Text>
              </View>
              <Text style={styles.navChevron}>›</Text>
            </Pressable>

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

            <Pressable onPress={onRate} style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Rate Us</Text>
                <Text style={styles.settingNote}>Enjoying the app? Leave a rating</Text>
              </View>
              <Text style={styles.navChevron}>›</Text>
            </Pressable>

            <Pressable onPress={onInvite} style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}>
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Invite Your Friends</Text>
                <Text style={styles.settingNote}>Share Caddy Poker with your group</Text>
              </View>
              <Text style={styles.navChevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => openLegal(PRIVACY_URL, 'Privacy Policy', 'privacy')}
              style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
            >
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
                <Text style={styles.settingNote}>How we handle your data</Text>
              </View>
              <Text style={styles.navChevron}>›</Text>
            </Pressable>

            <Pressable
              onPress={() => openLegal(TERMS_URL, 'Terms of Service', 'terms')}
              style={({ pressed }) => [styles.navRow, pressed && styles.pressed]}
            >
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Terms of Service</Text>
                <Text style={styles.settingNote}>The rules for using the app</Text>
              </View>
              <Text style={styles.navChevron}>›</Text>
            </Pressable>
          </View>

          {!isUnlocked && (
            <Pressable
              onPress={() => {
                playGolfHit();
                goTo('paywall', 'push');
              }}
              style={({ pressed }) => [styles.unlockBtn, styles.firstButton, pressed && styles.pressed]}
            >
              <Text style={styles.unlockText}>Unlock Full Game</Text>
              <Text style={styles.unlockSub}>
                {daysLeft > 0
                  ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your free trial`
                  : 'Free trial ended'}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              playGolfHit();
              // Instant (no push) so the video screen mounts exactly once — a slide transition
              // remounts it and restarts the video, doubling the opening audio.
              goTo('howToPlay');
            }}
            style={({ pressed }) => [
              styles.restoreBtn,
              isUnlocked && styles.firstButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.restoreText}>How To Play</Text>
          </Pressable>
        </View>

        {devToolsEnabled ? (
          <Pressable onLongPress={onDevTools} delayLongPress={900}>
            <Text style={styles.copyright}>© 2026 - Tangent Thinking LLC</Text>
          </Pressable>
        ) : (
          <Text style={styles.copyright}>© 2026 - Tangent Thinking LLC</Text>
        )}
        </SafeAreaView>
      </Animated.View>

      {webPage ? (
        <WebViewOverlay url={webPage.url} title={webPage.title} onClose={() => setWebPage(null)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  body: { flex: 1, gap: spacing.lg, paddingTop: spacing.xs },
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
  settingBlock: { gap: spacing.sm, paddingVertical: spacing.xs, marginHorizontal: spacing.lg },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  navChevron: { color: colors.gold, fontSize: 28, fontWeight: '900' },
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
  // Gold-filled to stand out as the primary upsell.
  unlockBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
  },
  unlockText: { color: colors.primaryText, fontSize: 17, fontWeight: '900' },
  unlockSub: { color: colors.primaryText, fontSize: 12, fontWeight: '700', opacity: 0.75, marginTop: 2 },
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
