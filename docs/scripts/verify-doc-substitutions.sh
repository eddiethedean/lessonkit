#!/usr/bin/env bash
# Fail if Sphinx HTML still contains unexpanded MyST substitution tokens.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUILD="${ROOT}/docs/_build/html"

if [[ ! -d "$BUILD" ]]; then
  echo "Missing docs build output: $BUILD (run sphinx-build first)"
  exit 1
fi

TOKENS=(
  "{{ release }}"
  "{{ scorm_zip_path }}"
  "{{ node_recommended }}"
  "{{ node_minimum }}"
)

failed=0
for token in "${TOKENS[@]}"; do
  if rg -q --fixed-strings "$token" "$BUILD" --glob '*.html'; then
    echo "UNEXPANDED substitution token in HTML: $token"
    rg --fixed-strings "$token" "$BUILD" --glob '*.html' -n | head -5
    failed=1
  fi
done

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "Doc substitution verification passed."
