#!/usr/bin/env bash
# Install LessonKit Library Skills for Cursor, Claude Code, and ~/.agents/skills (Agent Skills standard).
set -euo pipefail

SKILLS_ROOT="$(cd "$(dirname "$0")" && pwd)"
INSTALL_GLOBAL=false
INSTALL_PROJECT=false
PROJECT_DIR=""

usage() {
  cat <<'EOF'
Usage: ./library-skills/install.sh [--global] [--project] [--directory PATH]

  --global              Install to ~/.cursor/skills, ~/.claude/skills, ~/.agents/skills
  --project             Install to .cursor/skills and .claude/skills under a project dir
  --directory, -C PATH  Project root (default: current directory for --project)

If neither flag is given, installs to global skill paths only (`--global`).

Examples:
  ./library-skills/install.sh --global
  ./library-skills/install.sh --project -C ./my-course
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --global) INSTALL_GLOBAL=true; shift ;;
    --project) INSTALL_PROJECT=true; shift ;;
    -C|--directory)
      PROJECT_DIR="${2:?--directory requires a path}"
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done

if ! $INSTALL_GLOBAL && ! $INSTALL_PROJECT; then
  INSTALL_GLOBAL=true
fi

if $INSTALL_PROJECT && [[ -z "$PROJECT_DIR" ]]; then
  PROJECT_DIR="$(pwd)"
fi

SKILL_NAMES=()
for dir in "$SKILLS_ROOT"/*/; do
  [[ -f "${dir}SKILL.md" ]] || continue
  SKILL_NAMES+=("$(basename "$dir")")
done

if [[ ${#SKILL_NAMES[@]} -eq 0 ]]; then
  echo "No skills found under $SKILLS_ROOT" >&2
  exit 1
fi

install_one() {
  local dest_base="$1"
  local name="$2"
  local src="${SKILLS_ROOT}/${name}"
  local dest="${dest_base}/${name}"
  mkdir -p "$dest_base"
  rm -rf "$dest"
  cp -R "$src" "$dest"
  echo "  installed $name -> $dest"
}

install_set() {
  local label="$1"
  shift
  local bases=("$@")
  echo "$label"
  for base in "${bases[@]}"; do
    mkdir -p "$base"
    for name in "${SKILL_NAMES[@]}"; do
      install_one "$base" "$name"
    done
  done
}

if $INSTALL_GLOBAL; then
  install_set "Global skill paths:" \
    "${HOME}/.cursor/skills" \
    "${HOME}/.claude/skills" \
    "${HOME}/.agents/skills"
fi

if $INSTALL_PROJECT; then
  install_set "Project skill paths (${PROJECT_DIR}):" \
    "${PROJECT_DIR}/.cursor/skills" \
    "${PROJECT_DIR}/.claude/skills"
fi

echo "Done. Skills: ${SKILL_NAMES[*]}"
echo "Ensure @lessonkit/cli is available: npx @lessonkit/cli --version  (or npm install -g @lessonkit/cli)"
