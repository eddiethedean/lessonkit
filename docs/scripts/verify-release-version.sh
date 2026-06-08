#!/usr/bin/env bash
# Fail when docs/conf.py release does not match packages/core/package.json.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CORE_PKG="$REPO_ROOT/packages/core/package.json"
CONF_PY="$REPO_ROOT/docs/conf.py"

CORE_VERSION="$(node -p "require('$CORE_PKG').version")"
CONF_RELEASE="$(python3 -c "
import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('conf', Path('$CONF_PY'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
print(mod.release)
")"

if [ "$CORE_VERSION" != "$CONF_RELEASE" ]; then
  echo "Release version mismatch:" >&2
  echo "  packages/core/package.json: $CORE_VERSION" >&2
  echo "  docs/conf.py release:       $CONF_RELEASE" >&2
  echo "Bump both together on every release (see RELEASING.md)." >&2
  exit 1
fi

echo "Release version OK: $CORE_VERSION"
