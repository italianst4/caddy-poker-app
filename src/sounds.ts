import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// Lazily-created persistent players so taps trigger instant, repeatable playback.
let ballInHole: AudioPlayer | null = null;
let ironHit: AudioPlayer | null = null;
let golfHit: AudioPlayer | null = null;
let golfCrowd: AudioPlayer | null = null;
let cardFlip: AudioPlayer | null = null;
let configured = false;

function ensure() {
  if (!configured) {
    configured = true;
    // Play SFX even when the device is on silent.
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }
  if (!ballInHole) ballInHole = createAudioPlayer(require('../assets/sound-effects/ball-in-hole.mp3'));
  if (!ironHit) ironHit = createAudioPlayer(require('../assets/sound-effects/iron-hit-ball.mp3'));
  if (!golfHit) golfHit = createAudioPlayer(require('../assets/sound-effects/golf-hit.mp3'));
  if (!golfCrowd) golfCrowd = createAudioPlayer(require('../assets/sound-effects/golf-crowd.mp3'));
  if (!cardFlip) cardFlip = createAudioPlayer(require('../assets/sound-effects/card-flip.mp3'));
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

/** Golf swing hit — used for holes count (9/18) and "How To Play" taps. */
export function playGolfHit() {
  ensure();
  restart(golfHit);
}

/** Golf crowd cheer — used when a player wins the poker finale. */
export function playGolfCrowd() {
  ensure();
  restart(golfCrowd);
}

/** Card flip whoosh — used when a challenge or caddy card is flipped. */
export function playCardFlip() {
  ensure();
  restart(cardFlip);
}
