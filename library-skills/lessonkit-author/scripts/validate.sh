#!/usr/bin/env bash
# Run lessonkit build in the current course project (or -C PATH).
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
if [[ ! -f lessonkit.json ]]; then
  echo "lessonkit.json not found in $(pwd)" >&2
  exit 1
fi
if command -v lessonkit >/dev/null 2>&1; then
  lessonkit build
elif command -v npx >/dev/null 2>&1; then
  npx @lessonkit/cli build
else
  echo "lessonkit CLI not found; install @lessonkit/cli" >&2
  exit 1
fi
echo "OK: lessonkit build succeeded in $(pwd)"
