# Graph Report - .  (2026-06-28)

## Corpus Check
- Large corpus: 80 files · ~609,901 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 261 nodes · 489 edges · 19 communities (16 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 83,999 output

## Community Hubs (Navigation)
- [[_COMMUNITY_App Root & Scenic Layout|App Root & Scenic Layout]]
- [[_COMMUNITY_Card Animations & Overlays|Card Animations & Overlays]]
- [[_COMMUNITY_UI Components & Celebrations|UI Components & Celebrations]]
- [[_COMMUNITY_Package Dependencies|Package Dependencies]]
- [[_COMMUNITY_Round Screen & Scorecard|Round Screen & Scorecard]]
- [[_COMMUNITY_Expo App Manifest|Expo App Manifest]]
- [[_COMMUNITY_Flip Card & Card Back|Flip Card & Card Back]]
- [[_COMMUNITY_Game Store & Card Data|Game Store & Card Data]]
- [[_COMMUNITY_Project Docs & Design Rationale|Project Docs & Design Rationale]]
- [[_COMMUNITY_Hole Message Templates|Hole Message Templates]]
- [[_COMMUNITY_White Cards (Hazard Avoidance)|White Cards (Hazard Avoidance)]]
- [[_COMMUNITY_White Cards (No-Disaster)|White Cards (No-Disaster)]]
- [[_COMMUNITY_Black Tier Cards|Black Tier Cards]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_State Persistence Architecture|State Persistence Architecture]]
- [[_COMMUNITY_Matchup Cards|Matchup Cards]]
- [[_COMMUNITY_Short-Grass Cards|Short-Grass Cards]]
- [[_COMMUNITY_Not the Goat Card|Not the Goat Card]]

## God Nodes (most connected - your core abstractions)
1. `useGame` - 26 edges
2. `colors` - 24 edges
3. `spacing` - 21 edges
4. `radius` - 15 edges
5. `expo` - 10 edges
6. `PrimaryButton()` - 10 edges
7. `Card` - 9 edges
8. `CardArt()` - 8 edges
9. `LandscapeBackground()` - 6 edges
10. `cardById()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Shared Card Back Image` --semantically_similar_to--> `Styled Placeholder Cards`  [INFERRED] [semantically similar]
  assets/cards/README.md → README.md
- `App()` --calls--> `useGame`  [INFERRED]
  App.tsx → src/store/gameStore.ts
- `Tee Color Set in Manifest Not Filename` --conceptually_related_to--> `Tee Mode (Amateur/Pro)`  [INFERRED]
  assets/cards/README.md → README.md
- `Caddy Golf Challenge Card Game App` --references--> `Expo SDK 56`  [EXTRACTED]
  README.md → AGENTS.md
- `Project Instructions (CLAUDE.md)` --references--> `Read Versioned Expo Docs Before Coding`  [EXTRACTED]
  CLAUDE.md → AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Caddy Round Lifecycle** — readme_round_flow, readme_tee_mode, readme_3d_flip_card, readme_achieved_poker_draw [EXTRACTED 0.85]
- **Card Art Manifest Pipeline** — assets_cards_readme_card_art, readme_card_manifest, assets_cards_readme_card_back, readme_placeholder_cards [INFERRED 0.85]
- **Black Tier Challenge Cards** — assets_cards_black_birdie_hunter_card, assets_cards_black_drain_the_bomb_card, assets_cards_black_go_for_it_card, assets_cards_black_nuke_it_card [INFERRED 0.95]
- **White Tee No-Disaster Challenges** — assets_cards_white_bogey_train_card, assets_cards_white_cap_the_damage_card, assets_cards_white_find_it_card, assets_cards_white_lag_it_close_card, assets_cards_white_no_snowman_card [INFERRED 0.85]
- **White No-Disaster Hazard-Avoidance Cards** — assets_cards_white_no_three_jacks_card, assets_cards_white_skip_the_beach_card, assets_cards_white_stay_dry_card, assets_cards_white_tree_free_card [INFERRED 0.85]

## Communities (19 total, 3 thin omitted)

### Community 0 - "App Root & Scenic Layout"
Cohesion: 0.08
Nodes (26): App(), renderStep(), styles, CloudLayer(), CloudProps, LandscapeBackground(), Props, SlideUpFooter() (+18 more)

### Community 1 - "Card Animations & Overlays"
Cohesion: 0.07
Nodes (26): AchievementOverlay(), Props, Rect, styles, CardArt(), Props, styles, CardBurst() (+18 more)

### Community 2 - "UI Components & Celebrations"
Cohesion: 0.12
Nodes (24): Celebration(), CONFETTI_COLORS, PieceProps, Props, styles, FailedCardView(), Props, styles (+16 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, expo, expo-linear-gradient, expo-status-bar, react, react-native, @react-native-async-storage/async-storage, react-native-reanimated (+16 more)

### Community 4 - "Round Screen & Scorecard"
Cohesion: 0.16
Nodes (16): DigitProps, Odometer(), Props, styles, ChipsProps, Scorecard(), ScoreChips(), styles (+8 more)

### Community 5 - "Expo App Manifest"
Cohesion: 0.10
Nodes (20): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, predictiveBackGestureEnabled, expo (+12 more)

### Community 6 - "Flip Card & Card Back"
Cohesion: 0.15
Nodes (12): CARD_BACK_IMAGE, CardBack(), Props, styles, FlipCard(), Props, styles, Props (+4 more)

### Community 7 - "Game Store & Card Data"
Cohesion: 0.18
Nodes (12): buildDrawPool(), CARDS, CardType, drawDistinct(), GameMode, DEFAULT_NAMES, drawCardsFor(), GameState (+4 more)

### Community 8 - "Project Docs & Design Rationale"
Cohesion: 0.18
Nodes (14): Expo SDK 56, Read Versioned Expo Docs Before Coding, Card Art Wiring Guide, Shared Card Back Image, Tee Color Set in Manifest Not Filename, Project Instructions (CLAUDE.md), 3D Flip Card Reveal, Achieved Tally to Poker Draw (+6 more)

### Community 9 - "Hole Message Templates"
Cohesion: 0.38
Nodes (6): buildHoleMessage(), formatNames(), getHoleOutcome(), HOLE_MESSAGES, HoleOutcome, Template

### Community 10 - "White Cards (Hazard Avoidance)"
Cohesion: 0.40
Nodes (6): No Three-Jacks, One and Done, Skip the Beach, Split the Fairway, Stay Dry, Tree-Free

### Community 11 - "White Cards (No-Disaster)"
Cohesion: 0.40
Nodes (5): Bogey Train, Cap the Damage, Find It, Make Par, No Snowman

### Community 12 - "Black Tier Cards"
Cohesion: 0.50
Nodes (4): Birdie Hunter, Drain the Bomb, Go For It, Nuke It

### Community 13 - "TypeScript Config"
Cohesion: 0.50
Nodes (3): compilerOptions, strict, extends

### Community 14 - "State Persistence Architecture"
Cohesion: 0.67
Nodes (3): App.tsx Step-Based Router, Persisted Round Resume, Zustand Store with AsyncStorage Persist

## Knowledge Gaps
- **120 isolated node(s):** `styles`, `name`, `slug`, `version`, `orientation` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `colors` connect `UI Components & Celebrations` to `App Root & Scenic Layout`, `Card Animations & Overlays`, `Round Screen & Scorecard`, `Flip Card & Card Back`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `useGame` connect `Round Screen & Scorecard` to `App Root & Scenic Layout`, `UI Components & Celebrations`, `Game Store & Card Data`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `spacing` connect `UI Components & Celebrations` to `App Root & Scenic Layout`, `Card Animations & Overlays`, `Round Screen & Scorecard`, `Flip Card & Card Back`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `styles`, `name`, `slug` to the rest of the system?**
  _121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Root & Scenic Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.0782051282051282 - nodes in this community are weakly interconnected._
- **Should `Card Animations & Overlays` be split into smaller, more focused modules?**
  _Cohesion score 0.06923076923076923 - nodes in this community are weakly interconnected._
- **Should `UI Components & Celebrations` be split into smaller, more focused modules?**
  _Cohesion score 0.11553030303030302 - nodes in this community are weakly interconnected._