#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/e2e"
exec node ../docs/scripts/verify-component-demos.mjs
