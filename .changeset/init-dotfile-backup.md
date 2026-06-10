---
"@lessonkit/cli": patch
---

`lessonkit init --here` now refuses to overwrite conflicting files (such as a custom `.gitignore`) unless `--force` is passed; with `--force`, originals are backed up under `.lessonkit-init-backup/` before promote.
