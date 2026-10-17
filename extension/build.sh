#!/usr/bin/env bash
# CareerOS extension — packaging.
#
# Two manifests exist on purpose. manifest.json (production) requests only
# the extension's own backend at install; every job site is an optional
# permission granted at runtime (see lib/permissions.js and
# STORE_SUBMISSION.md for why that split is the difference between an easy
# review and a hard one). manifest.dev.json additionally allows a
# model-provider host so the "call Anthropic directly from the browser" path
# in background/service-worker.js can be exercised locally — that path is
# refused at runtime in a build using the production manifest, and this
# script never lets manifest.dev.json anywhere near the store package.
set -euo pipefail
cd "$(dirname "$0")"

OUT_DIR="dist"
ZIP_NAME="careeros.zip"
EXCLUDE_NAMES=(build.sh manifest.dev.json STORE_SUBMISSION.md test .DS_Store "$OUT_DIR" "$ZIP_NAME")

usage() {
  echo "Usage: ./build.sh <package|dev|clean>"
  echo "  package   Build $ZIP_NAME from manifest.json — this is what you upload to the Chrome Web Store."
  echo "  dev       Build ./$OUT_DIR from manifest.dev.json for 'Load unpacked' local testing."
  echo "  clean     Remove ./$OUT_DIR and $ZIP_NAME."
  exit 1
}

stage() {
  rm -rf "$OUT_DIR"
  # Copy to a temp dir outside this one first — `cp -r . ./dist` refuses to
  # run ("cannot copy a directory into itself") since the destination would
  # be created inside the very tree being copied.
  local tmp
  tmp="$(mktemp -d)"
  cp -r . "$tmp/build"
  for name in "${EXCLUDE_NAMES[@]}"; do
    rm -rf "${tmp:?}/build/${name}"
  done
  find "$tmp/build" -name '.DS_Store' -delete
  mv "$tmp/build" "$OUT_DIR"
  rm -rf "$tmp"
}

validate_manifest() {
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$1" \
    || { echo "error: $1 is not valid JSON" >&2; exit 1; }
}

case "${1:-}" in
  package)
    validate_manifest manifest.json
    if grep -q 'careeros\.example' manifest.json; then
      echo "warning: manifest.json still references the placeholder careeros.example host — fix host_permissions before uploading." >&2
    fi
    stage
    cp manifest.json "$OUT_DIR/manifest.json"
    rm -f "$ZIP_NAME"
    ( cd "$OUT_DIR" && zip -qr "../$ZIP_NAME" . )
    if unzip -l "$ZIP_NAME" | grep -qE '(^|/)(test|node_modules|\.git)/'; then
      echo "error: $ZIP_NAME contains a test/node_modules/.git path — a new dev-only folder isn't in EXCLUDE_NAMES yet." >&2
      exit 1
    fi
    rm -rf "$OUT_DIR"
    echo "Built $ZIP_NAME ($(du -h "$ZIP_NAME" | cut -f1)) from manifest.json — upload this file, unmodified, to the Chrome Web Store."
    ;;
  dev)
    validate_manifest manifest.dev.json
    stage
    cp manifest.dev.json "$OUT_DIR/manifest.json"
    echo "Built ./$OUT_DIR from manifest.dev.json."
    echo "In Chrome: chrome://extensions -> enable Developer mode -> Load unpacked -> select ./$OUT_DIR"
    ;;
  clean)
    rm -rf "$OUT_DIR" "$ZIP_NAME"
    echo "Removed ./$OUT_DIR and $ZIP_NAME."
    ;;
  *)
    usage
    ;;
esac
