#!/usr/bin/env bash
#
# Generate transparent (HEVC-with-alpha) winning-animation videos from the source clips.
#
# The source .mp4s have a SOLID BLACK background. This keys that black out to real alpha
# transparency and re-encodes to HEVC with an alpha channel (codec hvc1) — the only format
# AVPlayer / expo-video will play back transparently on iOS. The app plays the *-alpha.mov
# outputs; the .mp4 sources are kept only as the master to regenerate from.
#
# macOS ONLY: alpha HEVC is produced by Apple's VideoToolbox encoder (hevc_videotoolbox).
#
# Usage:
#   scripts/make-alpha-videos.sh                 # convert every *.mp4 in the anim folder
#   scripts/make-alpha-videos.sh a.mp4 b.mp4     # convert specific files
#   FORCE=1 scripts/make-alpha-videos.sh         # re-encode even if the output is up to date
#
# Requires: ffmpeg (brew install ffmpeg).

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANIM_DIR="$DIR/assets/golfer-winning-animation"

# ---- Keying / encoding parameters (validated against golfer-blue-a) -----------------------
# The background measured as true black (#000000–#010101), with compression noise lifting some
# pixels to luma ~17/255 while the golfer peaks at 203 — so a small similarity tolerance cleanly
# separates them. blend adds a soft edge so the cutout isn't jagged.
SIMILARITY=0.10   # how close to black counts as background (0 = exact black only)
BLEND=0.08        # soft-edge width around the key
ALPHA_QUALITY=0.5 # alpha-channel quality (0..1); 0.5 keeps files small with clean edges
BITRATE=1500k     # colour-plane bitrate; ~4–5 MB for a 10s 720p clip
# -------------------------------------------------------------------------------------------

command -v ffmpeg >/dev/null || { echo "error: ffmpeg not found (brew install ffmpeg)"; exit 1; }
if ! ffmpeg -hide_banner -encoders 2>/dev/null | grep -q hevc_videotoolbox; then
  echo "error: hevc_videotoolbox encoder unavailable — this script must run on macOS." >&2
  exit 1
fi

# Collect inputs: explicit args, or every .mp4 in the animation folder.
inputs=()
if [ "$#" -gt 0 ]; then
  for a in "$@"; do [ -f "$a" ] && inputs+=("$a") || inputs+=("$ANIM_DIR/$a"); done
else
  while IFS= read -r f; do inputs+=("$f"); done < <(find "$ANIM_DIR" -maxdepth 1 -name '*.mp4' | sort)
fi

[ "${#inputs[@]}" -gt 0 ] || { echo "No .mp4 sources found in $ANIM_DIR"; exit 0; }

for in in "${inputs[@]}"; do
  [ -f "$in" ] || { echo "skip (missing): $in"; continue; }
  out="${in%.mp4}-alpha.mov"

  if [ -z "${FORCE:-}" ] && [ -f "$out" ] && [ "$out" -nt "$in" ]; then
    echo "up to date: $(basename "$out")"
    continue
  fi

  echo "→ keying black + encoding alpha: $(basename "$in") -> $(basename "$out")"
  ffmpeg -y -loglevel error -i "$in" \
    -vf "colorkey=color=black:similarity=${SIMILARITY}:blend=${BLEND},format=yuva420p" \
    -c:v hevc_videotoolbox -alpha_quality "$ALPHA_QUALITY" -b:v "$BITRATE" \
    -allow_sw 1 -tag:v hvc1 -an \
    "$out"

  sz=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out")
  printf "  done: %s (%.1f MB)\n" "$(basename "$out")" "$(echo "$sz/1048576" | bc -l)"
done

echo "All alpha videos generated in $ANIM_DIR"
