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
