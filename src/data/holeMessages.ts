/**
 * End-of-hole messages shown once every golfer's card is cleared.
 *
 * Outcomes:
 *  - allWin  — every golfer achieved their challenge.
 *  - allLose — every golfer failed.
 *  - mixed   — some achieved, some failed (uses {winners} / {losers}).
 *
 * Placeholders: {winners}, {losers}, {all} are replaced with formatted name lists.
 */
export type HoleOutcome = 'allWin' | 'allLose' | 'mixed';

type Template = { emoji: string; text: string };

export const HOLE_MESSAGES: Record<HoleOutcome, Template[]> = {
  allWin: [
    { emoji: '🎉', text: 'Clean sweep! Everyone cashed in — the course never stood a chance.' },
    { emoji: '🎉', text: 'A perfect hole! {all} all delivered.' },
    { emoji: '🎉', text: 'Full house of winners. Beautiful, beautiful golf.' },
    { emoji: '🎉', text: 'Everybody eats! Cards for the whole crew.' },
    { emoji: '🎉', text: 'Flawless. Somebody check if this course is too easy.' },
    { emoji: '🎉', text: 'All winners, no whiners. Onward, champions.' },
    { emoji: '🎊', text: 'Sweep city! {all} each grab a card.' },
    { emoji: '🎉', text: 'Nobody left behind — everyone earns this one.' },
    { emoji: '🥳', text: 'Pure birdie energy from the entire group.' },
    { emoji: '🎉', text: 'The whole squad delivered. Tee-box bragging unlocked.' },
    { emoji: '🎊', text: "Everyone's a winner — the vibes are immaculate." },
    { emoji: '🎉', text: 'Clean card across the board. The golf gods are pleased.' },
    { emoji: '🥳', text: 'All green checks! Total group domination.' },
    { emoji: '🎉', text: 'Textbook hole for the whole foursome.' },
    { emoji: '🎊', text: '{all} went perfect. Frame this hole.' },
    { emoji: '🎉', text: 'Group win! Hug it out, then keep grinding.' },
  ],
  allLose: [
    { emoji: '😞', text: "Brutal hole. Shake it off — the next one's yours." },
    { emoji: '😩', text: 'Nobody got it. The course wins this round… for now.' },
    { emoji: '😬', text: 'Ouch. Collective face-plant. Regroup at the next tee.' },
    { emoji: '😞', text: "Zero cards, infinite excuses. You'll bounce back." },
    { emoji: '🙃', text: 'Everyone whiffed — at least you’re consistent.' },
    { emoji: '😔', text: 'The whole group got humbled. Happens to the best.' },
    { emoji: '😞', text: 'No takers this hole. Deep breath, fresh start.' },
    { emoji: '😣', text: 'Goose eggs all around. The comeback starts now.' },
    { emoji: '😞', text: 'Collective L. The next hole owes you one.' },
    { emoji: '🌬️', text: 'Nobody delivered — blame the wind, not yourselves.' },
    { emoji: '😅', text: 'Swing and a miss, party of four. Onward.' },
    { emoji: '😞', text: 'The course flexed. Time to flex back.' },
    { emoji: '💪', text: 'Empty-handed but not empty-hearted. Go get the next one.' },
    { emoji: '😩', text: 'Total wipeout. Champions are forged on holes like this.' },
    { emoji: '😔', text: 'Rough patch for the squad. Stay loose, keep swinging.' },
    { emoji: '😞', text: 'A humbling hole for everyone. Reset and reload.' },
  ],
  mixed: [
    { emoji: '👏', text: 'Nice one, {winners}! Better luck next time, {losers}.' },
    { emoji: '🏌️', text: '{winners} cashed in while {losers} watched. Redemption awaits.' },
    { emoji: '🎯', text: 'Hats off to {winners}. {losers}, the next hole has your name on it.' },
    { emoji: '😏', text: '{winners} ate good. {losers}, grab a snack and try again.' },
    { emoji: '👏', text: 'Big moves from {winners}. Chin up, {losers}.' },
    { emoji: '⛳', text: '{winners} flexed; {losers} took notes. Your turn next.' },
    { emoji: '🃏', text: 'Cards for {winners}! {losers}, shake it off.' },
    { emoji: '🏌️', text: '{winners} delivered. {losers}, consider it the setup for your comeback.' },
    { emoji: '😅', text: 'Respect to {winners}. {losers}, the course is just being dramatic.' },
    { emoji: '🎯', text: '{winners} on top this hole. {losers}, regroup and reload.' },
    { emoji: '👏', text: 'Clutch play, {winners}! {losers}, breathe — long round ahead.' },
    { emoji: '😏', text: '{winners} get the glory. {losers} get the motivation.' },
    { emoji: '🦹', text: 'Standing O for {winners}. {losers}, your villain arc starts now.' },
    { emoji: '⛳', text: '{winners} made it look easy. {losers}, make it look better next time.' },
    { emoji: '🥂', text: 'Winner winner: {winners}. {losers}, dust off and drive on.' },
    { emoji: '🏌️', text: '{winners} took the hole. {losers}, the rematch is one tee box away.' },
    { emoji: '👏', text: 'Sweet swings, {winners}. Tough break, {losers} — keep grinding.' },
    { emoji: '🎯', text: '{winners} cashed the check. {losers}, the bank’s open next hole.' },
  ],
};

/** Format a list of names: "Alice", "Alice & Bob", "Alice, Bob & Carol". */
export function formatNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

export function getHoleOutcome(winnerCount: number, loserCount: number): HoleOutcome {
  if (loserCount === 0) return 'allWin';
  if (winnerCount === 0) return 'allLose';
  return 'mixed';
}

/** Pick + fill a random message for the hole's outcome. */
export function buildHoleMessage(
  winners: string[],
  losers: string[],
  all: string[]
): { emoji: string; text: string } {
  const outcome = getHoleOutcome(winners.length, losers.length);
  const pool = HOLE_MESSAGES[outcome];
  const tpl = pool[Math.floor(Math.random() * pool.length)];
  const text = tpl.text
    .replace(/\{winners\}/g, formatNames(winners))
    .replace(/\{losers\}/g, formatNames(losers))
    .replace(/\{all\}/g, formatNames(all));
  return { emoji: tpl.emoji, text };
}
