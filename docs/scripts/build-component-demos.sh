#!/usr/bin/env bash
# Build per-component demo bundles into docs/_static/component-demos for Sphinx/RTD.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/docs/_static/component-demos"

cd "$ROOT"

echo "==> Building @lessonkit packages"
npm run build:packages

echo "==> Building component demos (base=./ for static hosting)"
DOCS_DEMO_BUILD=1 npm run build -w lessonkit-docs-component-demos

rm -rf "$OUT"
mkdir -p "$OUT"
cp -R docs/component-demos/dist/. "$OUT/"

echo "==> Component demo bundles ready under docs/_static/component-demos/"

BUILD_STATIC="$ROOT/docs/_build/html/_static"
if [[ -d "$BUILD_STATIC" ]]; then
  rm -rf "$BUILD_STATIC/component-demos"
  cp -R "$OUT" "$BUILD_STATIC/component-demos"
  echo "==> Synced demos into docs/_build/html/_static/component-demos/ (local sphinx preview)"
fi
