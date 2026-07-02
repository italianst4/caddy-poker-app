import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// Lazily-created persistent players so taps trigger instant, repeatable playback.
let ballInHole: AudioPlayer | null = null;
let ironHit: AudioPlayer | null = null;
let configured = false;

function ensure() {
  if (!configured) {
    configured = true;
    // Play SFX even when the device is on silent.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }
  if (!ballInHole) ballInHole = createAudioPlayer(require('../assets/sound-effects/ball-in-hole.mp3'));
  if (!ironHit) ironHit = createAudioPlayer(require('../assets/sound-effects/iron-hit-ball.mp3'));
}

function restart(player: AudioPlayer | null) {
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // ignore playback errors (e.g. audio session unavailable)
  }
}

/** Ball-dropping-in-the-hole sound — used for "New Round". */
export function playBallInHole() {
  ensure();
  restart(ballInHole);
}

/** Iron striking the ball — used for "Start Round". */
export function playIronHit() {
  ensure();
  restart(ironHit);
}
