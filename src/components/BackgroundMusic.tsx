import { useEffect, useRef } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useGame, type Step } from '../store/gameStore';

/** Steps during which the lobby music loops (everything before a round is underway). */
const PRE_ROUND_STEPS = new Set<Step>([
  'home',
  'menu',
  'howToPlay',
  'count',
  'names',
  'holes',
  'mode',
  'overview',
]);

const FADE_STEP = 0.06; // volume decrement per tick
const FADE_MS = 45; // tick interval

/**
 * Mounted once at the app root: loops the game music through the setup flow and fades it
 * out when a round starts (Start Round → step 'round'). Volume/mute come from the store.
 */
export function BackgroundMusic() {
  const player = useAudioPlayer(require('../../assets/game-music.mp3'));
  const step = useGame((s) => s.step);
  const musicVolume = useGame((s) => s.musicVolume);
  const musicMuted = useGame((s) => s.musicMuted);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLobby = PRE_ROUND_STEPS.has(step);
  const target = musicMuted ? 0 : musicVolume;

  const clearFade = () => {
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  };

  // Loop forever + allow playback while the ringer is on silent.
  useEffect(() => {
    player.loop = true;
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, [player]);

  // Start looping in the lobby; fade out + pause once a round begins.
  useEffect(() => {
    clearFade();
    if (isLobby) {
      player.volume = target;
      player.play();
    } else {
      let v = player.volume;
      fadeRef.current = setInterval(() => {
        v -= FADE_STEP;
        if (v <= 0) {
          player.volume = 0;
          player.pause();
          clearFade();
        } else {
          player.volume = v;
        }
      }, FADE_MS);
    }
    return clearFade;
    // Only react to entering/leaving the lobby — volume changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLobby]);

  // Live volume/mute updates while the lobby music is playing.
  useEffect(() => {
    if (isLobby && !fadeRef.current) {
      player.volume = target;
    }
  }, [target, isLobby, player]);

  return null;
}
