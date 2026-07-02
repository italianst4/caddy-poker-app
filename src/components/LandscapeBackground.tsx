import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { CloudLayer } from './CloudLayer';

const BG_RATIO = 1109 / 1800; // landscaping image width:height

type Props = {
  /** Extra vertical offset (px) for the drifting clouds. */
  cloudOffset?: number;
};

/** Shared home/setup backdrop: landscaping fit to device height + drifting clouds. */
export function LandscapeBackground({ cloudOffset = 0 }: Props) {
  const { width, height } = useWindowDimensions();
  const bgWidth = height * BG_RATIO;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={require('../../assets/cp-landscaping.png')}
        style={{ position: 'absolute', top: 0, left: (width - bgWidth) / 2, width: bgWidth, height }}
        resizeMode="cover"
      />
      <CloudLayer offset={cloudOffset} />
    </View>
  );
}
