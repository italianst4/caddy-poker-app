import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius, spacing } from '../theme';

type Props = {
  /** Page to load. */
  url: string;
  /** Header title (e.g. "Privacy Policy"). */
  title: string;
  /** Dismiss the overlay. */
  onClose: () => void;
};

/**
 * Full-screen in-app browser overlay: a themed header (title + ✕) over a WebView, so external
 * links (Privacy Policy, Terms of Service) open without leaving the app. Mounted only while open.
 */
export function WebViewOverlay({ url, title, onClose }: Props) {
  const [loading, setLoading] = useState(true);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <Text style={styles.closeX}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.webWrap}>
          <WebView
            source={{ uri: url }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            startInLoadingState={false}
            style={styles.web}
          />
          {loading ? (
            <View style={styles.loading} pointerEvents="none">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  closeX: { color: colors.text, fontSize: 18, fontWeight: '900' },
  pressed: { opacity: 0.6 },
  webWrap: { flex: 1, backgroundColor: colors.bg },
  web: { flex: 1, backgroundColor: colors.bg },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
