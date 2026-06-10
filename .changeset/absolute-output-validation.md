---
"@lessonkit/lxpack": patch
---

Reject absolute package `output` paths outside `outDir` at validation (fixes late staging failures for absolute `--out`), while still allowing default relative output paths under `projectRoot`.

Fixes #55
