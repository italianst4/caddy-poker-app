/** Golfer character art, shared by setup / overview / scorecard / carousel screens.
 *  4 colors × 2 variants. All variants are square, so `ratio` is 1 (kept for the grid).
 *  `winVideo` is the matching HEVC-with-alpha winning animation (see scripts/make-alpha-videos.sh). */
export const GOLFERS: { source: number; ratio: number; color: string; winVideo: number }[] = [
  { source: require('../../assets/golfers/golfer-blue-a.png'), ratio: 1, color: 'blue', winVideo: require('../../assets/golfers/win-animations/golfer-blue-a-alpha.mov') },
  { source: require('../../assets/golfers/golfer-blue-b.png'), ratio: 1, color: 'blue', winVideo: require('../../assets/golfers/win-animations/golfer-blue-b-alpha.mov') },
  { source: require('../../assets/golfers/golfer-green-a.png'), ratio: 1, color: 'green', winVideo: require('../../assets/golfers/win-animations/golfer-green-a-alpha.mov') },
  { source: require('../../assets/golfers/golfer-green-b.png'), ratio: 1, color: 'green', winVideo: require('../../assets/golfers/win-animations/golfer-green-b-alpha.mov') },
  { source: require('../../assets/golfers/golfer-red-a.png'), ratio: 1, color: 'red', winVideo: require('../../assets/golfers/win-animations/golfer-red-a-alpha.mov') },
  { source: require('../../assets/golfers/golfer-red-b.png'), ratio: 1, color: 'red', winVideo: require('../../assets/golfers/win-animations/golfer-red-b-alpha.mov') },
  { source: require('../../assets/golfers/golfer-yellow-a.png'), ratio: 1, color: 'yellow', winVideo: require('../../assets/golfers/win-animations/golfer-yellow-a-alpha.mov') },
  { source: require('../../assets/golfers/golfer-yellow-b.png'), ratio: 1, color: 'yellow', winVideo: require('../../assets/golfers/win-animations/golfer-yellow-b-alpha.mov') },
];

export const MAX_GOLFER_RATIO = Math.max(...GOLFERS.map((g) => g.ratio));
