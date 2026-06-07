#!/usr/bin/env bash
# Generate TypeDoc HTML from built package declarations for Sphinx static hosting.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/docs/_static/typedoc"

cd "$ROOT"

echo "==> Building @lessonkit packages (for .d.ts entry points)"
npm run build:packages

echo "==> Generating TypeDoc API reference"
rm -rf "$OUT"
mkdir -p "$OUT"

npx typedoc \
  --entryPoints \
    packages/core/dist/index.d.ts \
    packages/core/dist/testing.d.ts \
    packages/react/dist/index.d.ts \
    packages/react/dist/blocks-entry.d.ts \
    packages/react/dist/testing.d.ts \
    packages/cli/dist/index.d.ts \
    packages/xapi/dist/index.d.ts \
    packages/lxpack/dist/index.d.ts \
    packages/lxpack/dist/bridge.d.ts \
    packages/themes/dist/index.d.ts \
    packages/accessibility/dist/index.d.ts \
  --entryPointStrategy expand \
  --out "$OUT" \
  --name "LessonKit API" \
  --excludePrivate \
  --excludeInternal \
  --readme none \
  --logLevel Warn \
  --skipErrorChecking

echo "==> API docs written to docs/_static/typedoc/"
