# Caddy ⛳

A cross-platform (iOS/Android) **golf challenge card game** companion app, built with
Expo + React Native + TypeScript.

Players draw challenge cards at each hole, attempt them on the course, and mark each one
**Achieved** or **Failed**. At the end, every golfer's Achieved tally is how many cards
they draw from a physical poker deck.

## How a round flows
1. **Players** — choose 2–4 golfers.
2. **Names** — enter a name for each.
3. **Holes** — 9 or 18.
4. **Tees** — Amateur (white-tee cards only) or Pro (white + black-tee cards).
5. **Overview** — review the setup, then **Start Round**.
6. **Each hole:**
   - Face-down card backs are shown (one per player). Players take turns tapping to pick.
   - A pick triggers a full-screen **3D flip** revealing the card front, with sun rays
     shining from behind. Tap **Done** to dismiss.
   - When everyone has picked: *"Challenges are set, head to the Hole #N tee box!"*
   - Back from the tee box, mark each golfer's card **Achieved** / **Failed**.
7. **Results** — each golfer's Achieved count = how many poker cards to draw.

Progress is saved to the device, so closing/reopening the app resumes the round.

## Running it
```bash
npm install
npx expo start
```
Then scan the QR code with **Expo Go** (iOS/Android), or press `i` / `a` for a simulator
if you have Xcode / Android Studio set up.

## Adding the real card art
The app ships with styled placeholder cards so the full flow works immediately. To use
real graphics, see [assets/cards/README.md](assets/cards/README.md). In short:

- Card fronts → `assets/cards/*.png`, registered in [src/data/cards.ts](src/data/cards.ts)
  with a `tee` color (`white` = amateur+pro, `black` = pro only) and an `image: require(...)`.
- Shared card back → `assets/card-back.png`, then set `CARD_BACK_IMAGE` in
  [src/components/CardBack.tsx](src/components/CardBack.tsx).

## Winning animations (transparent / alpha videos)

The winner screen plays a full-screen golfer celebration clip
([src/components/GolferWinAnimation.tsx](src/components/GolferWinAnimation.tsx)), one per golfer
avatar. The source clips have a **solid black background**; the app plays HEVC-with-alpha
versions where that black has been keyed out to real transparency, so the golfer composites
cleanly over the screen.

Files live in `assets/golfer-winning-animation/`:
- `golfer-<color>-<variant>.mp4` — **source** masters (black background). Not bundled by the app;
  kept only to regenerate from.
- `golfer-<color>-<variant>-alpha.mov` — **generated** transparent clips the app plays, wired up
  via `GOLFERS[avatar].winVideo` in [src/data/golfers.ts](src/data/golfers.ts).

### Generating them
Run the generator ([scripts/make-alpha-videos.sh](scripts/make-alpha-videos.sh)):
```bash
npm run assets:alpha                            # convert every .mp4 in the folder
scripts/make-alpha-videos.sh golfer-red-a.mp4   # or just specific files
FORCE=1 npm run assets:alpha                     # re-encode even if outputs look up to date
```
For each `foo.mp4` it writes `foo-alpha.mov` (skips outputs newer than their source unless `FORCE=1`).

**Requirements:** **macOS only** (alpha HEVC comes from Apple's VideoToolbox encoder,
`hevc_videotoolbox`) and **ffmpeg** (`brew install ffmpeg`).

**The recipe** (tuned to this artwork; edit the params at the top of the script):
```
ffmpeg -i in.mp4 \
  -vf "colorkey=color=black:similarity=0.10:blend=0.08,format=yuva420p" \
  -c:v hevc_videotoolbox -alpha_quality 0.5 -b:v 1500k -allow_sw 1 -tag:v hvc1 -an \
  out-alpha.mov
```
- `colorkey black similarity=0.10` keys the background out — it measures as true black
  (`#000000`–`#010101`), with compression noise up to luma ~17/255 while the golfer peaks at 203,
  so a small tolerance separates them cleanly; `blend=0.08` softens the edge.
- `hevc_videotoolbox -alpha_quality 0.5 -tag:v hvc1` encodes HEVC **with an alpha channel** — the
  only format `expo-video`/AVPlayer plays back transparently on iOS. ~3–5 MB per 10s 720p clip.

**Adding a new clip:** drop `golfer-<color>-<variant>.mp4` into the folder, run
`npm run assets:alpha`, then point the matching `winVideo` entry in `src/data/golfers.ts` at the
new `-alpha.mov`.

> Note: `ffprobe` reports `yuv420p` even for valid alpha HEVC (the alpha is a separate layer it
> doesn't surface) — verify with AVFoundation instead (decode a frame; background-corner alpha
> should be `0`, the golfer's center `255`). Because this artwork's black outlines merge into the
> black background, the key also thins those outlines: fine over the app's dark screen
> (`#0B1F17`), but they'd wash out over a light backdrop — inherent to the source, not the script.

## Project structure
```
App.tsx                     root router — renders a screen based on the persisted `step`
src/
  data/cards.ts             card manifest + deck/draw helpers
  store/gameStore.ts        zustand store (persisted to AsyncStorage)
  theme.ts                  colors / spacing / radius tokens
  components/               FlipCard, SunRays, CardArt, CardBack, buttons, layout
  screens/                  Home, PlayerCount, Names, Holes, Mode, Overview, Round, Results
```

## Tech
- **Expo SDK 56** (managed), React Native 0.85, TypeScript
- **zustand** + persist middleware (AsyncStorage) for state + resume
- **react-native-reanimated** for the 3D card flip and sun-ray rotation
- **expo-linear-gradient** for card/glow gradients
- Portrait-only.
