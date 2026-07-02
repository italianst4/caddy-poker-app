import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

/** Inline header: back chevron + title on one row (used across the setup screens). */
export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        onPress={onBack}
        hitSlop={10}
      >
        <Text style={styles.arrow}>‹</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  arrow: { color: colors.white, fontSize: 30, fontWeight: '900', lineHeight: 34, marginRight: 3 },
  title: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
