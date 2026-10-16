#!/usr/bin/env bash
# CareerOS Interview Prep — packaging.
#
# This extension is intentionally simple: one manifest, one host permission
# (its own backend), no job-site access at all. There's no dev/prod manifest
# split here the way extension/ (Auto Apply) has, because there's no
# model-provider direct-call path to gate — every AI call already goes
# through the CareerOS backend. So there's just one thing to build: the
# store zip.
set -euo pipefail
cd "$(dirname "$0")"

OUT_DIR="dist"
ZIP_NAME="careeros-interview-prep.zip"
EXCLUDE_NAMES=(build.sh .DS_Store "$OUT_DIR" "$ZIP_NAME")

usage() {
  echo "Usage: ./build.sh <package|clean>"
  echo "  package   Build $ZIP_NAME — this is what you upload to the Chrome Web Store."
  echo "  clean     Remove ./$OUT_DIR and $ZIP_NAME."
  exit 1
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

    rm -rf "$OUT_DIR"
    tmp="$(mktemp -d)"
    cp -r . "$tmp/build"
    for name in "${EXCLUDE_NAMES[@]}"; do
      rm -rf "${tmp:?}/build/${name}"
    done
    find "$tmp/build" -name '.DS_Store' -delete
    mv "$tmp/build" "$OUT_DIR"
    rm -rf "$tmp"

    rm -f "$ZIP_NAME"
    ( cd "$OUT_DIR" && zip -qr "../$ZIP_NAME" . )
    rm -rf "$OUT_DIR"
    echo "Built $ZIP_NAME ($(du -h "$ZIP_NAME" | cut -f1)) — upload this file, unmodified, to the Chrome Web Store."
    ;;
  clean)
    rm -rf "$OUT_DIR" "$ZIP_NAME"
    echo "Removed ./$OUT_DIR and $ZIP_NAME."
    ;;
  *)
    usage
    ;;
esac
