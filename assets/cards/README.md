# Card images

Drop the card graphics here.

## Card fronts
Put each challenge card front in this folder (`assets/cards/`).

- Format: **PNG** (transparent or solid), portrait, standard playing-card ratio
  **2.5 : 3.5** (e.g. 1000×1400 px). High-res is fine — they're scaled down.
- Suggested naming so tee color is obvious at a glance:
  - White-tee (amateur) cards: `white-01.png`, `white-02.png`, …
  - Black-tee (pro) cards: `black-01.png`, `black-02.png`, …

You don't have to follow the naming exactly — the tee color is set in the manifest
(`src/data/cards.ts`), not inferred from the filename. Naming just keeps things tidy.

## Card back
Put the single shared card back at:

    assets/card-back.png   (one level up, in assets/)

Then open `src/components/CardBack.tsx` and set:

    const CARD_BACK_IMAGE = require('../../assets/card-back.png');

## Wiring a front image into the deck
In `src/data/cards.ts`, each card entry can take an `image`:

    { id: 'w01', name: 'Fairway Finder', tee: 'white',
      image: require('../../assets/cards/white-01.png') },

- `tee: 'white'`  → drawn in BOTH amateur and pro modes.
- `tee: 'black'`  → drawn ONLY in pro mode.

Until an `image` is set, the app renders a styled placeholder card so the flow still runs.

## What I need from you
For each front image, tell me: **filename → tee color (white or black) → optional name**.
I'll wire them into the manifest.
