import Constants from 'expo-constants';
import { PostHog } from 'posthog-react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Thin analytics wrapper around PostHog so the whole app has a single `track()` and the
 * platform stays swappable. No PII is ever sent — only avatar indices, card ids, hand
 * names, booleans, and counts.
 *
 * The PostHog project key is a *public write key* (safe to embed). It lives in
 * `app.json` → `expo.extra.posthogKey`. If it's missing, `client` stays null and every
 * `track()` call no-ops, so the app ships and runs fine before a key is set.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
  posthogKey?: string;
  posthogHost?: string;
};

const key = extra.posthogKey?.trim();
const host = extra.posthogHost?.trim() || 'https://us.i.posthog.com';

// Offline-durable config. `persistence: 'file'` writes the event queue to durable storage
// (expo-file-system) so it survives app kills, not just memory. On a network error the SDK
// keeps the queue and retries — so games played with no signal upload once back online.
const client = key
  ? new PostHog(key, {
      host,
      persistence: 'file',
      flushAt: 20,
      flushInterval: 10000,
      maxQueueSize: 5000, // headroom for many back-to-back offline games (~30–100 events each)
      preloadFeatureFlags: false, // we use no flags — skip a network call that just fails offline
    })
  : null;

// Flush the instant connectivity returns (rising edge only), so a queued offline game uploads
// immediately rather than waiting for the periodic timer. Silent — no UI, no logging.
if (client) {
  let wasConnected = true;
  NetInfo.addEventListener((state) => {
    const connected = !!state.isConnected && state.isInternetReachable !== false;
    if (connected && !wasConnected) {
      client.flush().catch(() => {});
    }
    wasConnected = connected;
  });
}

/** Correlates every event within one played game. Bumped by `startGame()`. */
let gameId: string | null = null;
let gameCounter = 0;

/** Begin a new game session — call from `startRound`. Subsequent events carry this id. */
export function startGame(): void {
  gameCounter += 1;
  gameId = `g${gameCounter}-${Date.now()}`;
}

/** JSON-serializable property values accepted by PostHog (no nested objects needed here). */
type PropValue = string | number | boolean | null | undefined;

/** Drop `undefined` values — PostHog's property type only accepts concrete JSON values. */
function clean(props: Record<string, PropValue>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Capture an event with optional properties. The current `game_id` is auto-appended. */
export function track(event: string, props?: Record<string, PropValue>): void {
  client?.capture(event, clean({ ...props, ...(gameId ? { game_id: gameId } : {}) }));
}

/** Register super-properties (the toggle config) sent with every subsequent event. */
export function registerConfig(flags: Record<string, PropValue>): void {
  client?.register(clean(flags));
}
