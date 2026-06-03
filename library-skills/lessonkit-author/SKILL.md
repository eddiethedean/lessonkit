---
name: lessonkit-author
description: >-
  Author and fix LessonKit 1.0 React courses — App.tsx, lessonkit.json, Course/Lesson/Quiz
  blocks, ThemeProvider, stable courseId/lessonId/checkId. Run lessonkit dev and build.
  Use when the workspace has lessonkit.json or mentions LessonKit, React training, or LMS courses.
license: Apache-2.0
metadata:
  lessonkit-version: "1.1.0"
  docs: https://lessonkit.readthedocs.io/en/latest/
---

# LessonKit course authoring

You help edit **LessonKit 1.0** projects: Vite + React apps with a root `lessonkit.json` manifest.

## Before you edit

1. Confirm `lessonkit.json` exists (walk up from cwd if needed).
2. Read `src/App.tsx` and the manifest together — IDs must match.
3. After structural changes, run `lessonkit build` (or `bash scripts/validate.sh` from this skill directory when installed globally).
4. CLI commands: `init`, `dev`, `build`, `package` with `--target scorm12|scorm2004|standalone|xapi|cmi5`.

## Project layout

```text
my-course/
  lessonkit.json       # schemaVersion 1 — packaging + descriptor
  package.json
  vite.config.ts
  src/
    main.tsx
    App.tsx            # Course / Lesson / Quiz UI
    styles.css
  dist/                # after lessonkit build
  .lxpack/             # package output — do not hand-edit
```

## Identity rules (required)

- `courseId`, `lessonId`, `checkId` must match `^[a-zA-Z][a-zA-Z0-9_-]{0,63}$` (start with letter).
- React props **must match** `lessonkit.json` for packaging and telemetry:
  - `<Course courseId="…">` ↔ `course.courseId` (always)
  - `<Quiz checkId="…">` ↔ `course.assessments[].checkId` (always)
  - `<Lesson lessonId="…">` ↔ `course.lessons[].id` when each lesson is a separate LMS entry; with `layout: "single-spa"`, only shell lesson ids need manifest entries — extra in-app step ids may live only in React
- Quiz telemetry uses the **enclosing** `<Lesson>` `lessonId`, not only navigation “active” lesson.

Details: `references/identity.md`

## React blocks (use only these)

From `@lessonkit/react`:

- `Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`
- `ThemeProvider` with preset from `lessonkit.json` (`default`, `brand`, etc.)
- `LessonkitProvider` is inside `<Course>` — pass `config` for tracking/xAPI/plugins

Block contract: `@lessonkit/react/block-catalog.v1.json` — do not invent block types.

Details: `references/blocks.md`

## lessonkit.json essentials

- `schemaVersion`: `1`
- `course.layout`: `single-spa` for `lessonkit package` (1.0.0)
- `paths.spaDistDir`: `dist` (Vite output)
- `course.assessments[]`: mirror Quiz props (`checkId`, `question`, `choices`, `answer`, optional `passingScore`)

Deep manifest: `references/manifest.md`

## Workflow you must follow

1. Read `lessonkit.json` and `src/App.tsx`.
2. Make minimal edits; keep IDs stable unless the user asks to rename.
3. Run `lessonkit build`; fix TypeScript/build errors.
4. Tell the user what to verify in the browser (`lessonkit dev`).
5. For LMS ZIP, hand off to **lessonkit-packaging** skill.

## Vibe coding (no React expertise)

Use bounded prompts; see `references/vibe-prompts.md` or the human [vibe coding guide](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html).

## Do not

- Invent CLI subcommands beyond `init`, `dev`, `build`, `package`
- Use removed APIs: `buildTrackEvent`, `defineLessonkitPlugin`, `setLxpackBridgeMode`
- Put `<Quiz>` / `<KnowledgeCheck>` outside `<Lesson>` — throws in development; production shows an alert and skips quiz telemetry
- Change `courseId` in React without resetting quiz state (component handles this; avoid duplicate checkIds across lessons without remounting)
