import { useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { CARD_RATIO, colors, fonts, radius } from '../theme';
import type { Card } from '../data/cards';
import { PACK_THEME, packById } from '../data/packs';

type Props = {
  card: Card;
  style?: StyleProp<ViewStyle>;
  /** Show the "How to win" button + overlay. Only enabled on full-size cards. */
  showHowToWin?: boolean;
};

/**
 * Renders the FRONT of a card.
 *
 * Challenge cards are composed pixel-perfect from data (pack-color bands, name, illustration,
 * CHALLENGE + challenge text) using the per-pack `PACK_THEME` palette. Caddy cards (and any card
 * missing challenge text) keep their full-bleed pre-rendered artwork. When `showHowToWin` is set,
 * a small button reveals the card's "How to win" detail as an on-card overlay.
 */
export function CardArt({ card, style, showHowToWin = false }: Props) {
  const [w, setW] = useState(0);
  const [help, setHelp] = useState(false);

  const composed = card.pack !== 'caddy' && !!card.challenge;

  // Caddy cards and art-only cards: draw the image full-bleed (or a text placeholder).
  if (!composed) {
    return (
      <View style={[styles.frame, style]}>
        {card.image ? (
          <Image source={card.image} style={styles.fill} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderFlag}>⛳</Text>
            <Text style={styles.placeholderName}>{card.name}</Text>
          </View>
        )}
      </View>
    );
  }

  const t = PACK_THEME[card.pack];
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  // Scale every text element to the rendered card width so the face is consistent at any size.
  // Baloo 2 is a tall, rounded face — leave the intrinsic line height (no tight override) so
  // ascenders/caps aren't clipped, and keep sizes modest so 2-line names/challenges fit the bands.
  const nameSize = w * 0.105;
  const challengeSize = w * 0.09;
  const pillSize = w * 0.05;
  const labelSize = w * 0.042;
  const padH = w * 0.06;
  const panelPad = w * 0.02; // tight padding so the illustration fills more of the panel
  const divider = Math.max(1.5, w * 0.008);

  const stop = (e: GestureResponderEvent) => e.stopPropagation?.();

  return (
    <View style={[styles.frame, { backgroundColor: t.band }, style]} onLayout={onLayout}>
      {/* Top band: pack pill (top-left) + centered card name. */}
      <View style={[styles.topBand, { backgroundColor: t.band, borderBottomColor: t.divider, borderBottomWidth: divider, paddingHorizontal: padH }]}>
        <View style={[styles.pill, { backgroundColor: t.pill }]}>
          <Text style={[styles.pillText, { color: t.pillInk, fontSize: pillSize }]} numberOfLines={1}>
            {packById(card.pack).name}
          </Text>
        </View>
        <View style={styles.nameWrap}>
          <Text
            style={[styles.name, { color: t.ink, fontSize: nameSize }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {card.name}
          </Text>
        </View>
      </View>

      {/* Middle: illustration on the white panel. */}
      <View style={[styles.panel, { backgroundColor: t.panel, padding: panelPad }]}>
        {card.image ? (
          <Image source={card.image} style={styles.fill} resizeMode="contain" />
        ) : (
          <Text style={[styles.name, { color: colors.black, fontSize: nameSize }]} numberOfLines={2}>
            {card.name}
          </Text>
        )}
      </View>

      {/* Bottom band: CHALLENGE label + challenge text, with an optional How-to-win button. */}
      <View style={[styles.bottomBand, { backgroundColor: t.band, borderTopColor: t.divider, borderTopWidth: divider, paddingHorizontal: padH }]}>
        <Text style={[styles.challengeLabel, { color: t.ink, fontSize: labelSize }]} numberOfLines={1}>
          CHALLENGE
        </Text>
        <Text
          style={[styles.challenge, { color: t.ink, fontSize: challengeSize, lineHeight: challengeSize * 1.14 }]}
          numberOfLines={3}
        >
          {card.challenge}
        </Text>
        {showHowToWin && !!card.howToWin ? (
          <Pressable
            onPress={(e) => { stop(e); setHelp(true); }}
            hitSlop={8}
            style={({ pressed }) => [styles.howBtn, { borderColor: t.ink }, pressed && styles.pressed]}
          >
            <Text style={[styles.howBtnText, { color: t.ink, fontSize: labelSize }]}>How to win</Text>
          </Pressable>
        ) : null}
      </View>

      {/* On-card overlay with the full "How to win" detail. Tap anywhere to dismiss. */}
      {help ? (
        <Pressable onPress={(e) => { stop(e); setHelp(false); }} style={[styles.helpOverlay, { backgroundColor: t.band, padding: padH }]}>
          <Text style={[styles.helpTitle, { color: t.ink, fontSize: challengeSize }]}>How to Win</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.helpScroll}>
            <Text style={[styles.helpText, { color: t.ink, fontSize: challengeSize * 0.82, lineHeight: challengeSize * 1.2 }]}>
              {card.howToWin}
            </Text>
          </ScrollView>
          <Text style={[styles.helpClose, { color: t.ink, fontSize: labelSize }]}>Tap to close</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: CARD_RATIO,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  fill: { width: '100%', height: '100%' },

  // Bands + panel (heights as % of the card so proportions hold at any size).
  topBand: { height: '26%', paddingTop: '3%' },
  panel: { flex: 1 },
  bottomBand: { height: '33%', paddingTop: '2.5%', justifyContent: 'flex-start' },

  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: '4%', paddingVertical: '1.5%' },
  pillText: { fontFamily: fonts.semibold, letterSpacing: 0.2 },
  nameWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontFamily: fonts.extrabold, textAlign: 'center' },

  challengeLabel: { fontFamily: fonts.bold, textAlign: 'center', letterSpacing: 2, opacity: 0.65 },
  challenge: { fontFamily: fonts.extrabold, textAlign: 'center', marginTop: '2%' },
  howBtn: {
    position: 'absolute',
    right: '5%',
    bottom: '6%',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    opacity: 0.85,
  },
  howBtnText: { fontFamily: fonts.semibold },
  pressed: { opacity: 0.5 },

  helpOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  helpTitle: { fontFamily: fonts.extrabold, marginBottom: '3%' },
  helpScroll: { flexGrow: 1, justifyContent: 'center' },
  helpText: { fontFamily: fonts.medium, textAlign: 'center' },
  helpClose: { fontFamily: fonts.semibold, marginTop: '3%', opacity: 0.7 },

  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: colors.card },
  placeholderFlag: { fontSize: 46, marginBottom: 8 },
  placeholderName: { color: colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
});
