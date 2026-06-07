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

failed=0
check_include reference/cli.md CLI.md || failed=1
check_include reference/packaging.md PACKAGING.md || failed=1
check_include reference/lxpack-bridge.md LXPACK_BRIDGE.md || failed=1

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Doc include verification passed."
