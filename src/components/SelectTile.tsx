import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props = {
  label: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Reduced vertical padding for tighter lists. */
  compact?: boolean;
};

/** A large tappable option tile used across the setup screens. */
export function SelectTile({ label, description, selected, onPress, style, compact }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        compact && styles.tileCompact,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.label, compact && styles.labelCompact, selected && styles.labelSelected]}>
          {label}
        </Text>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  tileCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.bgElevated,
  },
  pressed: { opacity: 0.9 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  labelCompact: { fontSize: 17 },
  labelSelected: { color: colors.primary },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
    lineHeight: 19,
    paddingRight: spacing.lg,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
});
