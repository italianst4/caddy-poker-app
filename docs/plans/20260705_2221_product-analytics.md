# 0001 — Product Analytics (PostHog)

**Status:** Implemented · **Shipped:** commit `91324a3`

## Context

CaddyPoker collected no usage data. We want simple, aggregate analytics to understand how the game is played — how many games, how many players/holes, which menu toggles people use, which challenge/caddy cards get picked / achieved / used, matchups played, re-draws, and winning poker hands. Every one of these is naturally an **event with properties** (per-card, per-avatar, per-hand), so we use event-based product analytics rather than a pageview tool.

It's a pass-and-play game often played on a golf course with **no signal**, so capture must work fully offline and upload later — with **no offline state ever shown in the UI**. And **no PII** is ever transmitted (player names are never sent).

**Platform: PostHog** — free 1M events/month, flexible event properties, JS-based Expo SDK (low native friction on this CNG project), durable offline queue out of the box.

## Design

### Wrapper — `src/analytics.ts`
A thin, swappable layer so the whole app has one `track()`:
- Singleton `new PostHog(key, {...})`; **null-safe** — if the key is missing, `client` is null and every `track()` no-ops (app ships fine before a key is set).
- `track(event, props?)` — captures with the current `game_id` auto-appended; strips `undefined` values (PostHog rejects them).
- `startGame()` — mints a module-level `game_id` so per-game events correlate.
- `registerConfig(flags)` — registers the toggle config as super-properties sent with every subsequent event.

### Key config — `app.json` → `expo.extra`
```json
"extra": { "posthogKey": "phc_…", "posthogHost": "https://us.i.posthog.com" }
```
The PostHog project key is a **public write key** — safe to embed. Read via `expo-constants`.

### Offline-durable capture
PostHog RN is configured for guaranteed offline capture + immediate upload on reconnect:
- `persistence: 'file'` — event queue written to durable storage (expo-file-system), survives app kill (not just memory).
- On a network error the SDK **retains** the queue and retries (verified: it only drops events on non-network errors).
- `maxQueueSize: 5000` — headroom for many back-to-back offline games (~30–100 events each).
- `preloadFeatureFlags: false` — we use no flags; avoids a network call that just fails offline.
- A `@react-native-community/netinfo` listener calls `client.flush()` on the rising edge of connectivity, so a queued game uploads the instant signal returns.
- **Zero offline UI** — the app never renders connectivity state and never subscribes to PostHog's `error` event.

### Privacy
Never send player names — only `avatar_index`, card ids/names, hand names, booleans, counts. PostHog auto-generates an anonymous device `distinct_id`; no login. RN SDK does not use IDFA → no App Tracking Transparency prompt required.

## Event catalog

| Event | Properties (no PII) | Fired from |
|---|---|---|
| `menu_toggle` | `toggle` (`black_tees`/`matchups`/`caddies`/`challenges_only`/`virtual_deck`/`live_activity`), `enabled` | `MenuScreen` — each of 6 switches |
| `game_started` | `players`, `holes`, `mode`, `matchups`, `caddies`, `virtual_deck`, `no_poker_deck`, `live_activity` | store `startRound` (+ `startGame()` + `registerConfig`) |
| `game_ended` | `holes_selected`, `holes_played` | store `reset` (snapshot before clearing; skipped if already home) |
| `avatar_selected` | `avatar_index` | store `setPlayers` (one per avatar) |
| `challenge_selected` | `card_id`, `card_name`, `tee` | store `pickCard` |
| `challenge_scored` | `card_id`, `card_name`, `achieved` (bool) | store `markResult` |
| `card_redraw` | `from_card_id/name`, `to_card_id/name` | store `redrawCard` |
| `matchup_played` | `card_id`, `card_name` | store `triggerMatchup` |
| `caddy_selected` | `card_id`, `card_name`, `context` (`physical`/`virtual`) | store `pickCaddy` + `pickPokerCaddy` |
| `caddy_used` | `card_id`, `card_name` | `PokerRoundScreen` RevealPhase (per participant whose caddy helped) |
| `poker_winner` | `hand_name`, `tie` (bool) | `PokerRoundScreen` RevealPhase (per winner) |

Every event also carries `game_id` + the toggle config (super-properties). Derived in PostHog with no extra events: **# games** = count of `game_started`; per-card/avatar/hand counts = breakdown of each event by its property.

## Files
- **New:** `src/analytics.ts` (wrapper + offline config + NetInfo flush).
- **Modified:** `app.json` (`extra.posthogKey/Host`), `src/store/gameStore.ts` (8 fire points), `src/screens/MenuScreen.tsx` (6 toggle events), `src/screens/PokerRoundScreen.tsx` (RevealPhase winner + caddy_used).
- **Deps:** `posthog-react-native`, `expo-file-system`, `expo-application`, `expo-device`, `expo-localization`, `@react-native-community/netinfo`.

## Viewing the data in PostHog

- **Live stream:** Activity → Events. Click an event to expand properties (confirm no player names).
- **Counts / breakdowns:** Product analytics → New insight → **Trends**, pick the event, set **Breakdown by** the property (e.g. `challenge_selected` broken down by `card_name`). Switch aggregation to **Property value → Average** for `players` / `holes_played`.
- **Precise numbers:** the SQL editor. Numeric props are stored as strings — wrap in `toInt`/`toFloat`. Examples:

```sql
-- Games played, avg players, avg holes selected
SELECT count() AS games,
       avg(toInt(properties.players)) AS avg_players,
       avg(toInt(properties.holes))   AS avg_holes_selected
FROM events WHERE event = 'game_started';

-- Winning poker hands
SELECT properties.hand_name, count()
FROM events WHERE event = 'poker_winner'
GROUP BY properties.hand_name ORDER BY 2 DESC;

-- Re-draws per game
SELECT properties.game_id, count() AS redraws
FROM events WHERE event = 'card_redraw'
GROUP BY properties.game_id ORDER BY redraws DESC;
```

Save useful insights to a **CaddyPoker** dashboard for at-a-glance review.

## Verification (device)
1. `npx tsc --noEmit`; `npx expo run:ios --device "…" --configuration Release`.
2. **Offline capture:** Airplane Mode ON → play a full game → app plays normally, no offline UI, nothing in PostHog yet.
3. **Reconnect upload:** Airplane Mode OFF → within ~1s the game's events appear in PostHog → Activity.
4. **Durability:** play offline, force-quit, reopen (still offline), then reconnect → events still upload.
5. **Privacy:** inspect event payloads — only indices/ids/names/booleans/counts, no player names.

## Notes / follow-ups
- If a clean iOS prebuild regenerates `ios/`, `pod install` can fail with `object version 70`; fix: `sed -i '' 's/objectVersion = 70;/objectVersion = 77;/' ios/CaddyPoker.xcodeproj/project.pbxproj`.
- `captureAppLifecycleEvents` is left at its default `true` — adds app open/background events (harmless, and the foreground event re-arms a flush as a reconnect safety net).
- Optional future: a menu "Share anonymous analytics" toggle wired to `client.optIn()/optOut()`.
