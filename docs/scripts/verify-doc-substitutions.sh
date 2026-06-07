#!/usr/bin/env bash
# Fail if Sphinx HTML still contains unexpanded MyST substitution tokens.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec python3 "$ROOT/docs/scripts/verify_doc_substitutions.py"
