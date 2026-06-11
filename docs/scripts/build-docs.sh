#!/usr/bin/env bash
# Full docs build matching .github/workflows/checks.yml (docs job).
# Usage:
#   npm run docs:build              # full CI-equivalent build
#   npm run docs:build -- --minimal # TypeDoc + Sphinx only (no demo bundles)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

MINIMAL=0
for arg in "$@"; do
  case "$arg" in
    --minimal) MINIMAL=1 ;;
  esac
done

if [[ "$MINIMAL" -eq 0 ]]; then
  echo "==> Building example bundles for docs"
  bash docs/scripts/build-docs-demos.sh

  echo "==> Building component demo bundles for docs"
  bash docs/scripts/build-component-demos.sh

  if command -v npx >/dev/null 2>&1; then
    echo "==> Installing Playwright chromium (e2e workspace)"
    (cd e2e && npx playwright install --with-deps chromium) || true
  fi

  echo "==> Verifying doc demo bundles render"
  bash docs/scripts/verify-doc-demos.sh

  echo "==> Verifying component demo bundles render"
  bash docs/scripts/verify-component-demos.sh
else
  echo "==> Minimal build: skipping demo bundle build and Playwright verification"
fi

echo "==> Generating API docs (TypeDoc)"
npm run docs:api

echo "==> Verifying release version sync"
bash docs/scripts/verify-release-version.sh

echo "==> Verifying doc include wrappers"
bash docs/scripts/verify-doc-includes.sh

echo "==> Generating block prop reference"
node docs/scripts/generate-block-props-doc.mjs

echo "==> Generating H5P component page index"
node docs/scripts/generate-h5p-component-page-index.mjs

if ! command -v sphinx-build >/dev/null 2>&1; then
  echo "==> Installing Python docs dependencies"
  pip install -r docs/requirements.txt
fi

echo "==> Building Sphinx HTML"
sphinx-build -b html docs docs/_build/html -W

echo "==> Verifying doc substitutions expanded"
bash docs/scripts/verify-doc-substitutions.sh

echo "==> Docs build complete: docs/_build/html/index.html"
