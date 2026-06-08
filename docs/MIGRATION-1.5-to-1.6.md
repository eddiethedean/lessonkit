# Migrating from LessonKit 1.5.x to 1.6.0

## Summary

| Area | 1.5.x | 1.6.0 |
| --- | --- | --- |
| Portable archive | — | `.lkcourse` via `lessonkit export` |
| Block registry CLI | — | `lessonkit blocks list` (catalog v3) |
| `@lessonkit/lxpack` | LMS packaging | + `exportLkcourse`, `validateLkcourse`, `importLkcourse` |
| Breaking API changes | — | **None** (additive minor) |

## New commands

```bash
# Archive a built course for handoff or tooling
lessonkit build
lessonkit export --out my-course.lkcourse

# Optional static block inventory for AI/codegen
lessonkit export --with-block-tree

# Discover runtime blocks
lessonkit blocks list --json
```

## Programmatic interchange

```ts
import { exportLkcourse, importLkcourse, validateLkcourse } from "@lessonkit/lxpack";
```

See [Portable interchange reference](reference/interchange.md).

## Import expectations

`.lkcourse` import restores **`lessonkit.json` + `dist/`** only. React `src/` is not bundled in the archive — keep source in git or copy separately.

## Upgrade checklist

1. Bump all `@lessonkit/*` packages to **1.6.0**.
2. Run `npm install`.
3. `lessonkit build` and `lessonkit package --target scorm12` (unchanged workflow).
4. Optionally try `lessonkit export` on a golden path course.

## LMS delivery unchanged

`lessonkit package` targets (`scorm12`, `xapi`, `cmi5`, `standalone`) are unchanged. `.lkcourse` is for archival and team interchange, not LMS upload.
