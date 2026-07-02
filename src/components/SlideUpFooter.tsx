import { useEffect, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing } from '../theme';

type Props = {
  visible: boolean;
  children: ReactNode;
};

/** A footer pinned to the bottom that slides up into view when `visible` becomes true. */
export function SlideUpFooter({ visible, children }: Props) {
  const slide = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    slide.value = withSpring(visible ? 1 : 0, { damping: 16, stiffness: 130, mass: 0.8 });
  }, [visible, slide]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - slide.value) * 160 }],
    opacity: slide.value,
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.footer, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
  },
});
