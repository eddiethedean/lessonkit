---
"@lessonkit/lxpack": patch
---

`validatePackageInputs` now rejects `output` paths that resolve outside `outDir` using `isResolvedPathUnderRoot` instead of a no-op try/catch around `relativePathUnderRoot`.
