import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type DigitProps = {
  digit: number;
  height: number;
  fontSize: number;
  color: string;
  animateDelay: number;
};

/** A single 0–9 column that rolls vertically to the target digit (odometer style). */
function DigitColumn({ digit, height, fontSize, color, animateDelay }: DigitProps) {
  const ty = useSharedValue(-digit * height);

  useEffect(() => {
    ty.value = withDelay(
      animateDelay,
      withTiming(-digit * height, { duration: 380, easing: Easing.out(Easing.cubic) })
    );
  }, [digit, height, ty, animateDelay]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <Animated.View style={style}>
        {Array.from({ length: 10 }, (_, d) => (
          <Text
            key={d}
            style={[styles.digit, { height, lineHeight: height, fontSize, color }]}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

type Props = { value: number; fontSize?: number; color: string; animateDelay?: number };

/** Rolling number (1–2 digits) that animates like an odometer when the value changes. */
export function Odometer({ value, fontSize = 13, color, animateDelay = 0 }: Props) {
  const height = Math.round(fontSize * 1.25);
  const tens = Math.floor(value / 10);
  const ones = value % 10;

  return (
    <View style={styles.row}>
      {value >= 10 ? (
        <DigitColumn digit={tens} height={height} fontSize={fontSize} color={color} animateDelay={animateDelay} />
      ) : null}
      <DigitColumn digit={ones} height={height} fontSize={fontSize} color={color} animateDelay={animateDelay} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  digit: { fontWeight: '800', textAlign: 'center' },
});
