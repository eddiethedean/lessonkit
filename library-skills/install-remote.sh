#!/usr/bin/env bash
# Install LessonKit Library Skills without keeping a full monorepo checkout.
# Usage: curl -fsSL https://raw.githubusercontent.com/eddiethedean/lessonkit/main/library-skills/install-remote.sh | bash
#    or: curl -fsSL ... | bash -s -- --project -C ~/my-course
set -euo pipefail

REPO="${LESSONKIT_SKILLS_REPO:-https://github.com/eddiethedean/lessonkit.git}"
REF="${LESSONKIT_SKILLS_REF:-main}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --depth 1 --branch "$REF" "$REPO" "$TMP/lessonkit"
exec "$TMP/lessonkit/library-skills/install.sh" "$@"
