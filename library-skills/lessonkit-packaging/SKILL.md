---
name: lessonkit-packaging
description: >-
  Package LessonKit 1.7.x Vite apps for LMS — lessonkit build, lessonkit package with
  scorm12/scorm2004/standalone/xapi/cmi5. Node 20.19+ for init; 18+ packaging legacy.
  to an LMS or configuring lessonkit.json paths for export.
license: Apache-2.0
metadata:
  lessonkit-version: "1.7.1"
---

# LessonKit packaging / LMS export

LessonKit packages via `@lessonkit/lxpack` (LXPack engine). The CLI wraps build + package.

## Prerequisites

- **Node.js 20.19+** recommended; **18+** minimum for `lessonkit package` on existing courses
- `lessonkit build` succeeded (`dist/` exists)
- `lessonkit.json` with `course.layout: "single-spa"`

## Commands

```bash
lessonkit build
lessonkit package --target TARGET
lessonkit package --target scorm12 --strict   # fail on build warnings (CI parity)
lessonkit export --no-build                 # portable .lkcourse archive
```

| Target | Use when |
|--------|----------|
| `scorm12` | Default for most corporate LMS |
| `scorm2004` | LMS requires SCORM 2004 |
| `standalone` | Host HTML ZIP without SCORM |
| `xapi` | Tin Can + LRS |
| `cmi5` | LMS supports cmi5 |

Read `references/targets.md` for xAPI/cmi5 notes and output paths.

## Output

- Packaged artifacts are written under the LXPack project tree (often `.lxpack/course/.lxpack/out/`, e.g. `course-scorm12.zip`)
- The CLI prints the final artifact path — use `--json` for automation
- Do not commit `.lxpack/` as source — rebuild from `dist/` + `lessonkit.json`

## Workflow

1. Confirm `lessonkit.json` `paths.spaDistDir` points at Vite `dist/`.
2. `lessonkit build`
3. `lessonkit package --target scorm12` (or user’s target)
4. Hand ZIP to LMS admin with: target type, completion threshold, quiz passing scores.

## LXPack-native courses

If the project uses LXPack `course.yaml` instead of React, use [LXPack library skills](https://github.com/eddiethedean/lxpack/tree/main/library-skills) (`lxpack-export`).

## Bridge at runtime

Packaged SCORM/xAPI shells expose `window.parent.lxpackBridge.v1`. React apps use `config.lxpack.bridge` (`auto` | `off`). See **lessonkit-telemetry** skill.

## Do not

- Run `lessonkit package` on Node versions below 18 (engine check fails)
- Use `per-lesson-spa` layout with CLI package in 1.x
- Edit generated ZIP contents manually — fix source and rebuild
