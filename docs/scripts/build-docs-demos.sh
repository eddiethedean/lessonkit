#!/usr/bin/env bash
# Build monorepo examples and copy Vite output into docs/_static/demos for Sphinx/RTD.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEMOS_DIR="$ROOT/docs/_static/demos"

cd "$ROOT"

echo "==> Building @lessonkit packages"
npm run build:packages

build_demo() {
  local workspace="$1"
  local dest="$2"
  echo "==> Building $workspace (base=./ for static hosting)"
  DOCS_DEMO_BUILD=1 npm run build -w "$workspace"
  mkdir -p "$DEMOS_DIR/$dest"
  rm -rf "$DEMOS_DIR/$dest"
  mkdir -p "$DEMOS_DIR/$dest"
}

rm -rf "$DEMOS_DIR"
mkdir -p "$DEMOS_DIR"

build_demo lessonkit-example-react-vite react-vite
cp -R examples/react-vite/dist/. "$DEMOS_DIR/react-vite/"

build_demo lessonkit-example-lxpack-golden lxpack-golden
cp -R examples/lxpack-golden/dist/. "$DEMOS_DIR/lxpack-golden/"

build_demo lessonkit-example-data-privacy data-privacy
cp -R examples/data-privacy/dist/. "$DEMOS_DIR/data-privacy/"

build_demo lessonkit-example-customer-service customer-service
cp -R examples/customer-service/dist/. "$DEMOS_DIR/customer-service/"

build_demo lessonkit-example-framework-11-showcase framework-11-showcase
cp -R examples/framework-11-showcase/dist/. "$DEMOS_DIR/framework-11-showcase/"

build_demo lessonkit-example-framework-12-showcase framework-12-showcase
cp -R examples/framework-12-showcase/dist/. "$DEMOS_DIR/framework-12-showcase/"

build_demo lessonkit-example-interactive-book interactive-book
cp -R examples/interactive-book/dist/. "$DEMOS_DIR/interactive-book/"

build_demo lessonkit-example-slide-deck slide-deck
cp -R examples/slide-deck/dist/. "$DEMOS_DIR/slide-deck/"

build_demo lessonkit-example-assessments-p0 assessments-p0
cp -R examples/assessments-p0/dist/. "$DEMOS_DIR/assessments-p0/"

echo "==> Demo bundles ready under docs/_static/demos/"
