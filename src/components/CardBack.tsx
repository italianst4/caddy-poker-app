import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CARD_RATIO, colors, radius } from '../theme';

/** Shared challenge card back artwork (same for every card, so a matchup is hidden until flipped). */
const CHALLENGE_BACK: ImageSourcePropType = require('../../assets/cards/challenge-card-back.png');

type Props = {
  onPress?: () => void;
  disabled?: boolean;
  picked?: boolean;
  /** Override the back image (e.g. caddy back); defaults to the challenge back. */
  source?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
};

export function CardBack({ onPress, disabled, picked, source, style }: Props) {
  const back = source ?? CHALLENGE_BACK;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || picked}
      style={({ pressed }) => [
        styles.frame,
        picked && styles.picked,
        pressed && !disabled && !picked && styles.pressed,
        style,
      ]}
    >
      {back ? (
        <Image source={back} style={styles.image} resizeMode="cover" />
      ) : (
        <LinearGradient colors={['#1C5C3E', '#0C3322']} style={styles.placeholder}>
          <View style={styles.inner}>
            <Text style={styles.flag}>⛳</Text>
            <Text style={styles.brand}>CADDY</Text>
          </View>
        </LinearGradient>
      )}

      {picked ? (
        <View style={styles.pickedOverlay}>
          <Text style={styles.pickedCheck}>✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: CARD_RATIO,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.card,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,214,107,0.5)',
    borderRadius: radius.md,
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  flag: { fontSize: 44 },
  brand: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 6,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  picked: { opacity: 0.55 },
  pickedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickedCheck: {
    color: colors.gold,
    fontSize: 54,
    fontWeight: '900',
  },
});
