#!/usr/bin/env bash
# One-shot: import v3 card illustrations + pack box art from the design source into the repo.
# Downscales with `sips` (preserves PNG alpha). Safe to re-run (idempotent overwrite).
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SRC="/Users/amontalbano/Downloads/Caddy Poker"
CH="$SRC/02 Card Artwork/V3 Ilustrations/Challenges"
BOX="$SRC/04 Packaging/Box Design"

ILLU_MAX=1024   # max dimension for card illustrations (source is 2048²)
PACK_MAX=1200   # max dimension for pack box art (source is 995×1555)

# Downloads pack folder -> repo asset folder (packId)
declare -a PACKS=(
  "Standard:standard"
  "The Tips:the-tips"
  "League:league"
  "Etiquette:etiquette"
  "Mulligans:mulligans"
  "Matchups:matchups"
)

echo "== Illustrations =="
for entry in "${PACKS[@]}"; do
  srcName="${entry%%:*}"; dst="${entry##*:}"
  srcDir="$CH/$srcName/Illustrations/no-background"
  dstDir="$REPO/assets/cards/illustrations/$dst"
  mkdir -p "$dstDir"
  count=0
  for f in "$srcDir"/*.png; do
    base="$(basename "$f")"
    cp "$f" "$dstDir/$base"
    sips -Z "$ILLU_MAX" "$dstDir/$base" >/dev/null
    count=$((count+1))
  done
  echo "  $dst: $count illustrations"
done

echo "== Pack box art =="
mkdir -p "$REPO/assets/cards/packs"
for color in Purple Red White Blue Black Yellow Green; do
  for side in Front Back; do
    src="$(ls "$BOX"/*"${color}${side}".png 2>/dev/null | head -1 || true)"
    if [ -z "$src" ]; then echo "  MISSING: ${color}${side}"; continue; fi
    dst="$REPO/assets/cards/packs/packs-${color}${side}.png"
    cp "$src" "$dst"
    sips -Z "$PACK_MAX" "$dst" >/dev/null
    echo "  packs-${color}${side}.png"
  done
done

echo "== CSV =="
# Strip UTF-8 BOM; keep UTF-8 body (em-dashes / curly quotes are fine).
python3 - "$SRC/../v3 Mobile Cards.csv" "$REPO/assets/cards/cards.csv" <<'PY'
import sys
src, dst = sys.argv[1], sys.argv[2]
txt = open(src, 'rb').read().decode('utf-8-sig')
open(dst, 'w', encoding='utf-8', newline='').write(txt)
print("  wrote assets/cards/cards.csv")
PY

echo "Done."
