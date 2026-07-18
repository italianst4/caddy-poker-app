import type { ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  /** Optional control rendered at the top-right of the header (e.g. an "End" button). */
  headerRight?: ReactNode;
  /** When set, renders a back chevron to the left of the title. */
  onBack?: () => void;
  /** Optional layer rendered above everything, sized to the full screen (e.g. an animation). */
  overlay?: ReactNode;
};

/** Consistent dark, safe-area screen wrapper with a header and a pinned footer. */
export function ScreenLayout({ title, subtitle, children, footer, scroll, headerRight, onBack, overlay }: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.body}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {(title || subtitle || headerRight || onBack) && (
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {onBack ? (
              <Pressable style={({ pressed }) => [styles.back, pressed && styles.backPressed]} onPress={onBack} hitSlop={10}>
                <Text style={styles.backArrow}>‹</Text>
              </Pressable>
            ) : null}
            {title ? <Text style={styles.title}>{title}</Text> : <View style={styles.headerText} />}
            {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
          </View>
          {/* Full-width below the title/actions row so it never gets squeezed onto two lines. */}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      )}
      {body}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {overlay ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {overlay}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    // Pushed to the far right; back chevron + title stay grouped on the left.
    marginLeft: 'auto',
    paddingTop: spacing.xs,
  },
  back: {
    width: 40,
    height: 40,
    marginLeft: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { opacity: 0.6 },
  backArrow: { color: colors.white, fontSize: 30, fontWeight: '900', lineHeight: 34, marginRight: 3 },
  title: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
});
