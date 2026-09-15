#!/usr/bin/env bash
# Builds careeros.zip for Chrome Web Store submission.
#
# Zips only the files Chrome actually needs to load the extension —
# manifest.json plus the referenced scripts, styles, and icons — into a
# clean staging directory first, rather than zipping this folder directly.
# That keeps internal docs (this script, STORE_SUBMISSION.md) and any
# future dev-only manifest variant out of the uploaded package.
set -euo pipefail

cd "$(dirname "$0")"

OUT="careeros.zip"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

case "${1:-package}" in
  package) ;;
  *)
    echo "Usage: ./build.sh [package]" >&2
    exit 1
    ;;
esac

cp -R manifest.json background content dashboard icons lib options popup welcome "$STAGE/"

rm -f "$OUT"
(cd "$STAGE" && zip -rq - .) > "$OUT"

echo "Built $OUT ($(du -h "$OUT" | cut -f1))"
