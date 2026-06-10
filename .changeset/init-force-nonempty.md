---
"@lessonkit/cli": patch
---

`lessonkit init --here --force` now scaffolds in non-empty directories; conflicting template files are backed up under `.lessonkit-init-backup/` and non-conflicting files are kept.
