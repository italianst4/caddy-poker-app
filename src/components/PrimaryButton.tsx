import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  small?: boolean;
  style?: ViewStyle;
};

const VARIANT_BG: Record<NonNullable<Props['variant']>, string> = {
  primary: colors.primary,
  secondary: colors.bgElevated,
  success: colors.success,
  danger: colors.danger,
  ghost: 'transparent',
};

const VARIANT_TEXT: Record<NonNullable<Props['variant']>, string> = {
  primary: colors.primaryText,
  secondary: colors.text,
  success: colors.primaryText,
  danger: colors.white,
  ghost: colors.textMuted,
};

export function PrimaryButton({ label, onPress, disabled, variant = 'primary', small, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        small && styles.baseSmall,
        { backgroundColor: VARIANT_BG[variant] },
        variant === 'ghost' && styles.ghostBorder,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View>
        <Text style={[styles.label, small && styles.labelSmall, { color: VARIANT_TEXT[variant] }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  baseSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 38,
    borderRadius: radius.sm,
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 14,
  },
});
