#!/usr/bin/env bash
# Ensure Sphinx reference wrappers still include their canonical doc sources.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/docs"

check_include() {
  local wrapper="$1"
  local source="$2"
  if ! grep -q "include} ../${source}" "$wrapper" 2>/dev/null && ! grep -q "include} ../../${source}" "$wrapper" 2>/dev/null; then
    echo "MISSING include: $wrapper should include $source"
    return 1
  fi
  if [[ ! -f "$source" ]]; then
    echo "MISSING source: $source (referenced by $wrapper)"
    return 1
  fi
  echo "OK $wrapper -> $source"
}

check_no_wrapper_h1() {
  local wrapper="$1"
  if head -n 3 "$wrapper" | grep -q '^# '; then
    echo "WRAPPER H1: $wrapper should not have its own H1 (canonical file provides title)"
    return 1
  fi
  echo "OK $wrapper (no duplicate H1)"
}

failed=0
for pair in \
  "reference/cli.md:CLI.md" \
  "reference/cli-errors.md:CLI_ERRORS.md" \
  "reference/packaging.md:PACKAGING.md" \
  "reference/lxpack-bridge.md:LXPACK_BRIDGE.md" \
  "reference/core.md:CORE.md" \
  "reference/identity.md:IDENTITY.md" \
  "reference/telemetry.md:TELEMETRY.md" \
  "reference/theming.md:THEMING.md" \
  "reference/accessibility.md:ACCESSIBILITY.md" \
  "reference/block-catalog.md:BLOCK_CATALOG.md" \
  "reference/plugins.md:PLUGINS.md" \
  "reference/manifest.md:MANIFEST.md"; do
  wrapper="${pair%%:*}"
  source="${pair##*:}"
  check_include "$wrapper" "$source" || failed=1
  check_no_wrapper_h1 "$wrapper" || failed=1
done

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Doc include verification passed."
