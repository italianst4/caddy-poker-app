import { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useGame } from '../store/gameStore';

const HOW_TO_PLAY = require('../../assets/caddypoker-how-to-play.mp4');

/** Plays the how-to-play video full screen. Closes on the ✕, or auto-returns when it ends. */
export function HowToPlayScreen() {
  const goTo = useGame((s) => s.goTo);
  const close = () => goTo('menu', 'pop');

  const player = useVideoPlayer(HOW_TO_PLAY, (p) => {
    p.loop = false;
    p.play();
  });

  // Return to the menu when the video finishes.
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => goTo('menu', 'pop'));
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
      />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <Pressable
          onPress={close}
          hitSlop={12}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
        >
          <Text style={styles.closeX}>✕</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, alignItems: 'flex-end' },
  closeBtn: {
    margin: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: { color: '#fff', fontSize: 20, fontWeight: '900' },
  pressed: { opacity: 0.7 },
});
