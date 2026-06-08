# lessonkit.json manifest reference (1.6.x)

Every LessonKit course includes a root **`lessonkit.json`** manifest (`schemaVersion: 1`). The CLI discovers it by walking up from `--cwd`. Packaging validates the manifest against your React props and Vite build output.

## Minimal example

```json
{
  "schemaVersion": 1,
  "name": "my-course",
  "course": {
    "courseId": "my-course",
    "title": "My LessonKit Course",
    "layout": "single-spa",
    "lessons": [{ "id": "lesson-1", "title": "My first lesson" }],
    "assessments": [
      {
        "checkId": "ready-to-build",
        "question": "Ready to build?",
        "choices": ["Not yet", "Yes"],
        "answer": "Yes",
        "passingScore": 1
      }
    ],
    "theme": { "preset": "default" },
    "tracking": {
      "xapi": {
        "activityIri": "https://example.com/courses/my-course"
      }
    }
  },
  "paths": {
    "spaDistDir": "dist",
    "lxpackOutDir": ".lxpack/course",
    "outputBaseDir": ".lxpack/out"
  }
}
```

## Top-level fields

| Field | Required | Description |
| --- | --- | --- |
| `schemaVersion` | Yes | Must be `1` (number) or `"1"` (string — coerced to `1` at parse time). Other values are rejected. |
| `name` | Yes | Project slug (directory name from `lessonkit init`). |
| `course` | Yes | [`LessonkitCourseDescriptor`](#course-object) — packaging descriptor and LMS metadata. |
| `paths` | No | Build and output directories (defaults below). |

When `paths` is omitted, the CLI uses `spaDistDir: "dist"`, `lxpackOutDir: ".lxpack/course"`, and `outputBaseDir: ".lxpack/out"`. Partial `paths` objects merge with those defaults. Machine-readable schema: `@lessonkit/lxpack/lessonkit-manifest.v1.json`.

## `course` object

| Field | Required | Description |
| --- | --- | --- |
| `courseId` | Yes | Stable course identifier. Must match `<Course courseId="…">` in React. Pattern: `^[a-zA-Z][a-zA-Z0-9_-]{0,63}$`. |
| `title` | Yes | Human-readable course title (LMS shell and exports). |
| `layout` | Yes | `"single-spa"` for standard `lessonkit package` (1.x). `"per-lesson-spa"` is not supported by the CLI — use `@lessonkit/lxpack` directly. |
| `lessons` | Yes | Array of `{ "id", "title" }`. With `single-spa`, typically one shell lesson; in-app `<Lesson lessonId>` values may differ for navigation/telemetry. See [Identity reference](reference/identity.md#single-spa-manifest-vs-in-app-steps). |
| `assessments` | No | Assessment descriptors mirrored from React `checkId` props. Required for packaging parity when quizzes exist in the SPA. |
| `theme` | No | `{ "preset": "default" \| "brand" \| … }` — aligns with `ThemeProvider` in React. |
| `tracking` | No | Completion threshold and xAPI `activityIri` for xAPI/cmi5 export targets. |
| `version` | No | Optional semver string for the course content (not the framework version). |
| `spaDistDir` | No | Deprecated on `course` — use `paths.spaDistDir` instead. |
| `spaLessonId` | No | LXPack SPA lesson id for `single-spa` (default: first lesson id or `main`). |

### Assessment entries

Each `course.assessments[]` entry must match a React assessment `checkId`. MCQ-style entries (default when `kind` is omitted):

| Field | Required | Description |
| --- | --- | --- |
| `checkId` | Yes | Matches `<Quiz checkId="…">` or `<KnowledgeCheck checkId="…">`. |
| `question` | Yes | Prompt text. |
| `choices` | Yes | Array of choice strings (MCQ). |
| `answer` | Yes | Correct choice string (MCQ). |
| `passingScore` | No | Minimum score to pass (default packaging behavior uses assessment completion). |
| `kind` | No | Omit for MCQ. Other kinds: `trueFalse`, `fillInBlanks`, `findHotspot`, `findMultipleHotspots`. |

Discriminated assessment types are validated at packaging time. See [Block catalog](reference/block-catalog.md) for React block ↔ manifest mapping.

### `tracking` object

| Field | Description |
| --- | --- |
| `tracking.completion.threshold` | Optional completion threshold for LMS scoring (0–1). |
| `tracking.xapi.activityIri` | **Required** for `xapi` and `cmi5` package targets. Stable IRI for the course activity. `lessonkit init` sets a placeholder you should replace. |

## `paths` object

| Field | Default | Description |
| --- | --- | --- |
| `paths.spaDistDir` | `dist` | Vite production output. `lessonkit build` writes here. |
| `paths.lxpackOutDir` | `.lxpack/course` | LXPack project root (descriptor staging). |
| `paths.outputBaseDir` | `.lxpack/out` | Resolved **inside** `lxpackOutDir`, not at the project root. Packaged zips: `{outputBaseDir}/course-<target>.zip`. |

Default artifact layout (relative to project root):

```text
my-course/
├── lessonkit.json
├── dist/                              ← paths.spaDistDir
└── .lxpack/course/                    ← paths.lxpackOutDir
    └── .lxpack/out/                   ← paths.outputBaseDir
        ├── course-scorm12.zip
        ├── course-xapi.zip
        └── standalone/
```

Trust the path **`lessonkit package` prints** on stdout if you override `paths.*`.

## React parity rules

Packaging fails when React and the manifest disagree:

1. `course.courseId` ↔ `<Course courseId="…">`
2. Every `checkId` in React ↔ `course.assessments[].checkId`
3. Shell lesson ids ↔ `course.lessons[].id` when they represent the packaged SPA lesson

See [Keep React IDs in sync](../guides/react-developers/quickstart.md#keep-react-ids-in-sync-with-lessonkitjson) and [Identity reference](reference/identity.md).

## Common validation errors

| Error / symptom | Fix |
| --- | --- |
| `schemaVersion must be 1` | Set `"schemaVersion": 1` at the root. |
| `per-lesson-spa is not supported by lessonkit package` | Use `"layout": "single-spa"` or package via `@lessonkit/lxpack` programmatically. |
| Unknown `checkId` / React manifest mismatch | Add or update `course.assessments[]` to mirror every quiz `checkId` in `App.tsx`. |
| Missing `activityIri` for xAPI/cmi5 | Set `course.tracking.xapi.activityIri` before `lessonkit package --target xapi` or `cmi5`. |
| `dist/` not found | Run `lessonkit build` first; confirm `paths.spaDistDir` matches Vite `outDir`. |

## Three manifest layers

| Layer | File | When |
| --- | --- | --- |
| **Author manifest** | Root `lessonkit.json` | You edit this; CLI discovers it (`schemaVersion: 1`). This reference describes that file. |
| **LXPack interchange** | `.lxpack/course/lessonkit.json` | Generated during `lessonkit package`. Do not hand-edit; fix the root manifest and rebuild. |
| **Portable archive** | `.lkcourse` → `manifest.json` + `interchange.json` | Created by `lessonkit export` for archival and team handoff (not LMS upload). |

See [Portable interchange](reference/interchange.md) for `.lkcourse` layout and import scope.

## See also

- [CLI reference](reference/cli.md) — commands and flags
- [Packaging reference](reference/packaging.md) — targets and programmatic API
- [Project structure](../guides/react-developers/project-structure.md) — generated folder layout
- [Portable interchange](reference/interchange.md) — `.lkcourse` archive
- [Glossary — lessonkit.json](reference/glossary.md)
