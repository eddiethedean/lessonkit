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
    packages/react/dist/index.d.ts \
    packages/cli/dist/index.d.ts \
  --entryPointStrategy expand \
  --out "$OUT" \
  --name "LessonKit API" \
  --excludePrivate \
  --excludeInternal \
  --readme none \
  --logLevel Warn

echo "==> API docs written to docs/_static/typedoc/"
