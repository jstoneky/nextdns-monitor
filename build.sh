#!/usr/bin/env bash
# NextDNS Monitor — Build Script
# Produces store-ready zips for Chrome and Firefox
# Usage: ./build.sh [chrome|firefox|all]  (default: all)

set -e

VERSION=$(node -p "require('./manifest.json').version")
TARGET=${1:-all}
DIST="store/dist"

mkdir -p "$DIST"

EXCLUDE=(
  "*.git*"
  "*.DS_Store*"
  "*.sh"
  "manifest.firefox.json"
  "store/dist/*"
  "store/*.zip"
  "node_modules/*"
)

build_exclude_args() {
  local args=()
  for pat in "${EXCLUDE[@]}"; do
    args+=(--exclude "$pat")
  done
  echo "${args[@]}"
}

build_chrome() {
  echo "▶ Building Chrome v${VERSION}..."
  local out="$DIST/nextdns-medic-chrome-v${VERSION}.zip"
  rm -f "$out"
  zip -r "$out" . $(build_exclude_args)
  echo "  ✓ $(du -sh "$out" | cut -f1)  →  $out"
}

build_firefox() {
  echo "▶ Building Firefox v${VERSION}..."
  local out="$DIST/nextdns-medic-firefox-v${VERSION}.zip"
  local tmp="$(mktemp -d)"

  # Copy all extension files to temp dir
  rsync -a --exclude=".git" --exclude=".DS_Store" --exclude="*.sh" \
    --exclude="manifest.firefox.json" --exclude="store/dist" \
    --exclude="store/*.zip" \
    . "$tmp/"

  # Swap manifest
  cp manifest.firefox.json "$tmp/manifest.json"

  rm -f "$out"
  (cd "$tmp" && zip -r - . --exclude "*.DS_Store*") > "$out"
  rm -rf "$tmp"
  echo "  ✓ $(du -sh "$out" | cut -f1)  →  $out"
}

case "$TARGET" in
  chrome)  build_chrome ;;
  firefox) build_firefox ;;
  all)     build_chrome; build_firefox ;;
  *)
    echo "Usage: ./build.sh [chrome|firefox|all]"
    exit 1
    ;;
esac

echo ""
echo "Done. Store packages in $DIST/"
ls -lh "$DIST/"
