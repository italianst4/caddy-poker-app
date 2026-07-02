/** Golfer character art, shared by setup / overview / scorecard / carousel screens.
 *  4 colors × 2 variants. All variants are square, so `ratio` is 1 (kept for the grid). */
export const GOLFERS: { source: number; ratio: number; color: string }[] = [
  { source: require('../../assets/golfer-blue-a.png'), ratio: 1, color: 'blue' },
  { source: require('../../assets/golfer-blue-b.png'), ratio: 1, color: 'blue' },
  { source: require('../../assets/golfer-green-a.png'), ratio: 1, color: 'green' },
  { source: require('../../assets/golfer-green-b.png'), ratio: 1, color: 'green' },
  { source: require('../../assets/golfer-red-a.png'), ratio: 1, color: 'red' },
  { source: require('../../assets/golfer-red-b.png'), ratio: 1, color: 'red' },
  { source: require('../../assets/golfer-yellow-a.png'), ratio: 1, color: 'yellow' },
  { source: require('../../assets/golfer-yellow-b.png'), ratio: 1, color: 'yellow' },
];

export const MAX_GOLFER_RATIO = Math.max(...GOLFERS.map((g) => g.ratio));
