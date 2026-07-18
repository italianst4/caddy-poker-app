import { useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { ScreenLayout } from '../components/ScreenLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { PackFront } from '../components/PackFront';
import { PackFan } from '../components/PackFan';
import { Jiggle } from '../components/Jiggle';
import { CaddyDeckOverlay } from '../components/CaddyDeckOverlay';
import { GOLFERS, MAX_GOLFER_RATIO } from '../data/golfers';
import { packById, cardsInPack } from '../data/packs';
import { useGame } from '../store/gameStore';
import { colors, spacing } from '../theme';

const CADDY_PACK = packById('caddy');
const CADDY_CARDS = cardsInPack('caddy');

export function ResultsScreen() {
  const { width, height } = useWindowDimensions();
  const players = useGame((s) => s.players);
  const avatars = useGame((s) => s.avatars);
  const pokerCardCount = useGame((s) => s.pokerCardCount);
  const ownedCaddy = useGame((s) => s.ownedPacks['caddy']);
  const includeCaddies = useGame((s) => s.includeCaddies);
  const viewScorecard = useGame((s) => s.viewScorecard);
  const startPokerRound = useGame((s) => s.startPokerRound);
  const grantPack = useGame((s) => s.grantPack);
  const setPackEnabled = useGame((s) => s.setPackEnabled);

  // If the caddy pack hasn't been opened yet, surface the open-pack overlay automatically when
  // this "Let's play poker!" screen appears. If dismissed, the corner affordance reopens it.
  const [caddyOpen, setCaddyOpen] = useState(!ownedCaddy);

  const gap = spacing.lg;
  const columnWidth = (width - spacing.lg * 2 - gap) / 2;
  // 20% smaller than before to make room for the corner caddy affordance.
  const cellH = Math.min(columnWidth / MAX_GOLFER_RATIO, height * 0.16) * 0.8;

  const onOpenChoice = (useCaddies: boolean) => {
    grantPack('caddy');
    if (!useCaddies) setPackEnabled('caddy', false);
    setCaddyOpen(false);
  };

  return (
    <ScreenLayout
      title="Let's play poker!"
      scroll
      overlay={
        <>
          {/* Persistent bottom-right caddy affordance (box-none layer lets the body stay tappable). */}
          {!caddyOpen ? (
            <View style={styles.caddyCorner} pointerEvents="box-none">
              {ownedCaddy ? (
                <View style={styles.caddyOwned}>
                  <PackFan
                    name={CADDY_PACK.name}
                    count={CADDY_CARDS.length}
                    cards={CADDY_CARDS}
                    width={83}
                    showLabel={false}
                  />
                  <View style={styles.caddyToggleCol}>
                    <Switch
                      value={includeCaddies}
                      onValueChange={(v) => setPackEnabled('caddy', v)}
                      trackColor={{ true: colors.primary, false: 'rgba(255,255,255,0.35)' }}
                      thumbColor={colors.white}
                    />
                    <Text style={styles.caddyToggleLabel}>Use caddies to improve poker hands</Text>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => setCaddyOpen(true)} style={({ pressed }) => [styles.caddyDeck, pressed && styles.pressed]}>
                  <Jiggle>
                    <PackFront pack={CADDY_PACK} width={50} />
                  </Jiggle>
                  <Text style={styles.caddyHint}>Caddy cards help improve your poker hand. Open the caddy pack.</Text>
                </Pressable>
              )}
            </View>
          ) : null}

          {caddyOpen ? <CaddyDeckOverlay onOpen={onOpenChoice} onClose={() => setCaddyOpen(false)} /> : null}
        </>
      }
      footer={
        <>
          <PrimaryButton label="Play Poker" onPress={startPokerRound} />
          <Pressable
            onPress={() => viewScorecard('results')}
            style={({ pressed }) => [styles.textBtn, pressed && styles.textBtnPressed]}
          >
            <Text style={styles.textBtnLabel}>View Scorecard</Text>
          </Pressable>
        </>
      }
    >
      <Text style={styles.deal}>
        Each golfer will be dealt the number of earned cards below, best hand wins!
      </Text>

      <View style={[styles.golfers, { width: columnWidth * 2 + gap, gap }]}>
        {players.map((name, i) => {
          const g = GOLFERS[avatars[i] ?? i] ?? GOLFERS[0];
          const count = pokerCardCount(i);
          return (
            <View key={i} style={[styles.golfer, { width: columnWidth }]}>
              <Image source={g.source} resizeMode="contain" style={{ width: cellH * g.ratio, height: cellH }} />
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.count}>
                {count} {count === 1 ? 'card' : 'cards'}
              </Text>
            </View>
          );
        })}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  deal: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    lineHeight: 28,
  },
  golfers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 0,
  },
  golfer: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  name: { color: colors.text, fontSize: 18, fontWeight: '800', maxWidth: '100%' },
  count: { color: colors.gold, fontSize: 20, fontWeight: '900' },
  textBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  textBtnPressed: { opacity: 0.6 },
  textBtnLabel: { color: colors.gold, fontSize: 16, fontWeight: '800' },

  // Caddy affordance, floated just above the "Play Poker" footer with a little padding.
  caddyCorner: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 175 },
  // Unopened: small deck on the left, prompt text to its right.
  caddyDeck: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  caddyHint: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'left' },
  pressed: { opacity: 0.75 },
  // Owned: fan on the left, the on/off toggle stacked to its right, bottom-aligned with the fan.
  caddyOwned: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-start', gap: spacing.md },
  caddyToggleCol: { alignItems: 'center', gap: 2 },
  caddyToggleLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
});
