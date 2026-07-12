import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LandscapeBackground } from '../components/LandscapeBackground';
import { PrimaryButton } from '../components/PrimaryButton';
import { useGame } from '../store/gameStore';
import { devExpireTrial, devResetTrial, purchaseUnlock, restore, useTrialDaysLeft, useUnlockPrice } from '../entitlements';
import { devToolsEnabled } from '../buildEnv';
import { track } from '../analytics';
import { colors, radius, spacing } from '../theme';

const PERKS = [
  'Unlimited rounds — challenges & virtual poker',
  'Caddy cards, matchups & the poker finale',
  'Lock Screen Live Activities',
  'One-time purchase — yours forever, no subscription',
];

export function PaywallScreen() {
  const goTo = useGame((s) => s.goTo);
  const daysLeft = useTrialDaysLeft();
  const price = useUnlockPrice() ?? '$5.99';
  const [busy, setBusy] = useState(false);

  // The paywall is only dismissible while the free trial is still running; after it expires
  // it's a hard gate (the New Round button and any resumed round route back here).
  const dismissible = daysLeft > 0;

  useEffect(() => {
    track('paywall_shown', { trial_days_left: daysLeft });
  }, [daysLeft]);

  const onUnlock = async () => {
    if (busy) return;
    setBusy(true);
    const result = await purchaseUnlock();
    setBusy(false);
    if (result === 'purchased') {
      goTo('home');
    } else if (result === 'unavailable') {
      Alert.alert('Not available yet', 'The unlock isn’t ready in the store yet. Please try again later.');
    } else if (result === 'error') {
      Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
    }
    // 'cancelled' → stay silently on the paywall
  };

  // Hidden dev tools (matches the Menu copyright long-press): reset/expire the trial so the
  // hard-gate state can be tested without waiting.
  const onDevTools = () => {
    Alert.alert('Dev · Trial', undefined, [
      { text: 'Reset trial (full)', onPress: () => devResetTrial() },
      { text: 'Expire trial now', onPress: () => devExpireTrial() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onRestore = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    if (ok) {
      goTo('home');
    } else {
      Alert.alert('Nothing to restore', 'We couldn’t find a previous purchase on this Apple ID.');
    }
  };

  return (
    <View style={styles.root}>
      <LandscapeBackground hideClouds />
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => goTo('menu')}
            hitSlop={10}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
        </View>
        <View style={styles.body}>
          <Image
            source={require('../../assets/caddypoker-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Unlock the Full Game</Text>
          <Text style={styles.subtitle}>
            {dismissible
              ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your free trial`
              : 'Your free trial has ended'}
          </Text>

          <View style={styles.perks}>
            {PERKS.map((p) => (
              <View key={p} style={styles.perkRow}>
                <Text style={styles.check}>✓</Text>
                <Text style={styles.perkText}>{p}</Text>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            {busy ? (
              <View style={styles.busy}>
                <ActivityIndicator color={colors.gold} />
              </View>
            ) : (
              <PrimaryButton label={`Unlock — ${price}`} onPress={onUnlock} />
            )}

            <Pressable
              onPress={onRestore}
              disabled={busy}
              style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
            >
              <Text style={styles.linkText}>Restore Purchase</Text>
            </Pressable>
          </View>
        </View>
        {!dismissible &&
          (devToolsEnabled ? (
            <Pressable onLongPress={onDevTools} delayLongPress={900}>
              <Text style={styles.copyright}>© 2026 - Tangent Thinking LLC</Text>
            </Pressable>
          ) : (
            <Text style={styles.copyright}>© 2026 - Tangent Thinking LLC</Text>
          ))}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  // Matches ScreenHeader's back-button row so the arrow sits exactly where the menu's does.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  arrow: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    marginRight: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  body: { flex: 1, justifyContent: 'flex-start', gap: spacing.lg },
  logo: { width: '55%', height: 120, alignSelf: 'center' },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  perks: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    gap: spacing.sm,
  },
  perkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  check: { color: colors.gold, fontSize: 16, fontWeight: '900', lineHeight: 22 },
  perkText: { color: colors.text, fontSize: 15, fontWeight: '600', flexShrink: 1, lineHeight: 22 },
  footer: { gap: spacing.sm, marginHorizontal: spacing.md },
  busy: { minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { color: colors.gold, fontSize: 16, fontWeight: '800' },
  copyright: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  pressed: { opacity: 0.7 },
});
