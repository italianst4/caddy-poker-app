import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, spacing } from '../theme';

// The winning clip is an HEVC-with-alpha video (the original's solid-black background was keyed
// out to real transparency — see scripts/make-alpha-videos.sh), so it composites over the screen
// with no blend-mode tricks. Source is 1280×720 (16:9); keep that ratio when stretched to full
// width. The specific clip (color/variant) is passed in to match the winning golfer's avatar.

/** Video is 1280×720 (16:9); its on-screen height is screenWidth × this. */
export const WIN_ANIM_ASPECT = 720 / 1280;

type Props = {
  /** The winning golfer's HEVC-with-alpha clip (from GOLFERS[avatar].winVideo). */
  source: number;
  /** Name of the sole winner, shown in a pill directly below the animation. */
  winnerName: string;
};

/**
 * Full-bleed golfer winning animation with a large centered pill beneath it naming the winner.
 * Rendered inline (in the normal flow, directly under the title) and non-interactive. Only shown
 * for a single winner — ties are handled by the caller not mounting this at all.
 */
export function GolferWinAnimation({ source, winnerName }: Props) {
  const { width } = useWindowDimensions();

  const player = useVideoPlayer(source, (p) => {
    // Play through exactly once and freeze on the final frame (no loop).
    p.loop = false;
    p.muted = true;
    p.play();
  });

  return (
    <View pointerEvents="none" style={styles.container}>
      <VideoView
        player={player}
        style={{ width, height: width * WIN_ANIM_ASPECT, backgroundColor: 'transparent' }}
        contentFit="contain"
        nativeControls={false}
      />
      {/* Full-width gold bar naming the winner. */}
      <View style={styles.bar}>
        <Text style={styles.barText} numberOfLines={1}>
          {winnerName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Negative horizontal margin cancels the screen's body padding so the video/bar run edge to edge.
  container: {
    alignItems: 'center',
    marginHorizontal: -spacing.lg,
  },
  bar: {
    width: '100%',
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  barText: {
    color: colors.bg,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
