#!/usr/bin/env bash
# Validate a LessonKit course project: build + basic manifest/App ID checks.
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

if [[ -f src/App.tsx ]]; then
  COURSE_ID=$(node -e "const m=require('./lessonkit.json'); console.log(m.course?.courseId||'')")
  if [[ -n "$COURSE_ID" ]] && ! grep -q "$COURSE_ID" src/App.tsx; then
    echo "WARN: course.courseId '$COURSE_ID' not found in src/App.tsx" >&2
  fi
  while IFS= read -r check; do
    [[ -z "$check" ]] && continue
    if ! grep -q "$check" src/App.tsx; then
      echo "WARN: assessment checkId '$check' not found in src/App.tsx" >&2
    fi
  done < <(node -e "const m=require('./lessonkit.json'); (m.course?.assessments||[]).forEach(a=>console.log(a.checkId||''))")
fi

echo "OK: lessonkit build succeeded in $(pwd)"
