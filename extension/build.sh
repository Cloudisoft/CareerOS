#!/usr/bin/env bash
# Package the extension for the Chrome Web Store.
#   ./build.sh package   -> careeros.zip (and careeros-<version>.zip) ready to upload
#   ./build.sh check     -> validate only
set -euo pipefail
cd "$(dirname "$0")"

version=$(node -p "require('./manifest.json').version")

check() {
  # The shipped build may only talk to the production server.
  node -e '
    const m = require("./manifest.json");
    const bad = (m.host_permissions || []).filter((h) => /localhost|127\.0\.0\.1|\.example\b/.test(h));
    if (bad.length) { console.error("manifest host_permissions must not include: " + bad.join(", ")); process.exit(1); }
    if (m.web_accessible_resources) { console.error("web_accessible_resources is not needed and draws review questions"); process.exit(1); }
  '
  grep -rqE "anthropic-dangerous-direct-browser-access|api\.anthropic\.com" --include=*.js . && { echo "the extension must not call a model provider directly"; exit 1; } || true
  find . -name '*.js' -not -path './test/*' -print0 | xargs -0 -n1 node --check
  echo "CareerOS ${version}: checks passed"
}

case "${1:-package}" in
  check) check ;;
  package)
    check
    rm -f careeros.zip "careeros-${version}.zip"
    zip -qr "careeros-${version}.zip" . -x 'test/*' '*.md' 'build.sh' '*.zip' '.DS_Store'
    cp "careeros-${version}.zip" careeros.zip
    echo "Built careeros.zip (version ${version})"
    ;;
  *) echo "usage: ./build.sh [check|package]"; exit 2 ;;
esac
