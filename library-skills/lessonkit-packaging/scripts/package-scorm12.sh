#!/usr/bin/env bash
# Build and package SCORM 1.2 from the current course project.
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
run() {
  if command -v lessonkit >/dev/null 2>&1; then
    lessonkit "$@"
  else
    npx @lessonkit/cli "$@"
  fi
}
[[ -f lessonkit.json ]] || { echo "lessonkit.json not found" >&2; exit 1; }
run build
run package --target scorm12
echo "OK: SCORM 1.2 package complete in $(pwd)"
