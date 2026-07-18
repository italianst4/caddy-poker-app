import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Pack } from '../data/packs';

/** w/h of the pack front artwork (995 × 1555) — the box matches it so overlays align to the art. */
export const PACK_RATIO = 995 / 1555;

const LOGO = require('../../assets/caddypoker-logo.png');

type Props = {
  pack: Pack;
  /** Rendered width in px — used to scale the label font (percent widths handle the rest). */
  width: number;
  /** Optional label override for the band (defaults to the pack's name). */
  name?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The front face of a card pack: the pack artwork with the CaddyPoker logo overlaid in the upper
 * white area, and the pack name in white centered on the dark band that's already baked into the
 * art. Everything is positioned in PERCENTAGES so it looks identical whether rendered large
 * (open-pack view) or small (Card Packs grid). Give it a box sized to {width, width / PACK_RATIO}.
 */
export function PackFront({ pack, width, name, style }: Props) {
  return (
    <View style={[{ width, height: width / PACK_RATIO }, style]}>
      <Image source={pack.front} style={styles.art} resizeMode="contain" />
      {/* Logo: 15% margins L/R (→ 70% wide), 20% down from the top, square. */}
      <View style={styles.logoBox}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </View>
      {/* Pack name, white, centered on the dark band baked into the artwork (~76% down). */}
      <View style={styles.labelBand}>
        <Text
          style={[styles.label, { fontSize: Math.round(width * 0.09), color: pack.labelColor ?? '#FFFFFF' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {(name ?? pack.name).toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  art: { width: '100%', height: '100%' },
  logoBox: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    top: '20%',
    aspectRatio: 1,
  },
  logo: { width: '100%', height: '100%' },
  labelBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '70%',
    height: '12%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 2,
    paddingHorizontal: '16%',
    textAlign: 'center',
  },
});
