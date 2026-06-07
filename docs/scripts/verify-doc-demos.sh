#!/usr/bin/env bash
# Playwright smoke test for docs/_static/demos production bundles.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/e2e"
exec node ../docs/scripts/verify-doc-demos.mjs
