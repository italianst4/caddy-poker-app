import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { useGame } from '../store/gameStore';
import { colors } from '../theme';

/** Solid white speaker icon: an X when silent, otherwise 1–2 waves by level. */
function SpeakerIcon({ level, size = 26 }: { level: number; size?: number }) {
  const silent = level <= 0;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 9 H7 L12 4 V20 L7 15 H3 Z" fill="#fff" />
      {silent ? (
        <>
          <Line x1="15.5" y1="9" x2="21" y2="15" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          <Line x1="21" y1="9" x2="15.5" y2="15" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </>
      ) : (
        <>
          <Path d="M15.5 9 A4 4 0 0 1 15.5 15" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
          {level >= 0.5 ? (
            <Path d="M18 6.5 A7.5 7.5 0 0 1 18 17.5" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
          ) : null}
        </>
      )}
    </Svg>
  );
}

const SWIPE_RANGE = 160; // px of vertical swipe for the full 0..1 range
const MOVE_THRESHOLD = 6; // px of movement before a press becomes a volume drag

/**
 * Speaker icon: tap to mute/unmute, or press-and-hold then swipe up/down to set the
 * music volume. A small vertical level bar appears while adjusting.
 */
export function MusicControl() {
  const musicVolume = useGame((s) => s.musicVolume);
  const musicMuted = useGame((s) => s.musicMuted);
  const setMusicVolume = useGame((s) => s.setMusicVolume);
  const setMusicMuted = useGame((s) => s.setMusicMuted);
  const toggleMusicMuted = useGame((s) => s.toggleMusicMuted);

  const [dragging, setDragging] = useState(false);
  const startVol = useRef(0);
  const moved = useRef(false);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVol.current = useGame.getState().musicVolume;
        moved.current = false;
        setDragging(true);
      },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dy) > MOVE_THRESHOLD) moved.current = true;
        if (!moved.current) return;
        // Swipe up (negative dy) raises the volume.
        const next = Math.max(0, Math.min(1, startVol.current - g.dy / SWIPE_RANGE));
        setMusicVolume(next);
        if (next > 0 && useGame.getState().musicMuted) setMusicMuted(false);
      },
      onPanResponderRelease: () => {
        if (!moved.current) toggleMusicMuted(); // a tap (no swipe) toggles mute
        setDragging(false);
      },
      onPanResponderTerminate: () => setDragging(false),
    })
  ).current;

  const effective = musicMuted ? 0 : musicVolume;

  return (
    <View style={styles.wrap}>
      <View {...responder.panHandlers} style={styles.btn}>
        <SpeakerIcon level={effective} />
      </View>

      {dragging ? (
        <View style={styles.sliderWrap} pointerEvents="none">
          <View style={styles.track}>
            <View style={[styles.fill, { height: `${effective * 100}%` }]} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 40, alignItems: 'center' },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderWrap: {
    position: 'absolute',
    top: 46,
    alignItems: 'center',
  },
  track: {
    width: 8,
    height: 120,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
});
