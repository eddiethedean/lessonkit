# LessonKit CLI (1.7.x)

The `@lessonkit/cli` package provides the developer workflow for LessonKit projects: scaffold, dev, build, and dual export packaging.

## Install

```bash
npm install -g @lessonkit/cli
# or use without installing:
npx @lessonkit/cli init my-course
```

**Node.js:** use **20.19+** for `lessonkit init` and local dev (Vite 8). Dev, build, and LMS packaging on an existing course work on Node **18+** (see [Packaging reference](reference/packaging.md)).

## Quick start

```bash
lessonkit init my-course
cd my-course
lessonkit dev
lessonkit build
lessonkit package --target scorm12
```

## Project manifest: `lessonkit.json`

Every LessonKit project includes a `lessonkit.json` at the project root. The CLI walks up from `--cwd` to find it. **Full schema:** [Manifest reference](reference/manifest.md).

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

| Field | Description |
|-------|-------------|
| `schemaVersion` | Must be `1` |
| `name` | Project slug (used by `lessonkit init`) |
| `course` | [`LessonkitCourseDescriptor`](https://github.com/eddiethedean/lessonkit/blob/main/packages/lxpack/src/types.ts) passed to `@lessonkit/lxpack` |
| `paths.spaDistDir` | Vite build output (default `dist`) |
| `paths.lxpackOutDir` | LXPack project directory (default `.lxpack/course`) |
| `paths.outputBaseDir` | Packaged artifact base **under** `paths.lxpackOutDir` (default `.lxpack/out`; artifacts are `{outputBaseDir}/course-<target>.zip` or `{outputBaseDir}/standalone`) |

Default artifact layout (paths relative to project root):

```text
my-course/
├── dist/                              ← paths.spaDistDir
└── .lxpack/course/                    ← paths.lxpackOutDir
    └── .lxpack/out/                   ← paths.outputBaseDir
        └── course-scorm12.zip         ← upload to LMS
```

`lessonkit package` prints the resolved zip path on stdout. Trust that path even when your manifest overrides `paths.*`.

Before packaging, keep `courseId`, `course.lessons[].id`, and `course.assessments[].checkId` aligned with your React component props. `lessonkit init` updates `lessonkit.json` (including `tracking.xapi.activityIri`), `src/courseConfig.ts` `courseId`, and patches `src/App.tsx` `courseId` / course title for you. See [Identity reference](reference/identity.md).

The CLI only recognizes project manifests with `schemaVersion: 1` (not the interchange `lessonkit.json` written under `.lxpack/course`). `per-lesson-spa` layout is not supported by `lessonkit package` (1.x) — use `single-spa`. Use `@lessonkit/lxpack` directly if you need `per-lesson-spa`. SPA build output is controlled by `paths.spaDistDir` (not `course.spaDistDir`).

## Commands

### `lessonkit init [name]`

Scaffold a Vite + React project from the bundled template.

```bash
lessonkit init my-course
lessonkit init --here
lessonkit init --here --force  # empty dir or dotfiles only; requires --here
lessonkit init my-course --skip-install
```

| Flag | Description |
|------|-------------|
| `--here` | Initialize in the current directory instead of creating a subdirectory |
| `--skip-install` | Skip `npm install` (CI/automation) |
| `--force` | With `--here` only: initialize when the current directory is empty or contains dotfiles only (e.g. `.git`). Does not overwrite existing project files. |

### `lessonkit dev`

Run the Vite dev server. Extra Vite args pass through after `--`:

```bash
lessonkit dev
lessonkit dev -- --port 3000
lessonkit dev --cwd ./apps/training
```

### `lessonkit build`

Production Vite build to `dist/` (or `paths.spaDistDir` from `lessonkit.json`). The CLI always strips passthrough `--outDir` from Vite args and appends the configured `paths.spaDistDir`.

```bash
lessonkit build
lessonkit build --json
```

### `lessonkit package --target <target>`

Canonical dual-export entrypoint.

| Target | Output |
|--------|--------|
| `react-vite` | Verifies `dist/` exists (runs Vite build unless `--no-build` and `dist/` is present). Does not produce an LMS artifact—use `scorm12`, `standalone`, etc. |
| `scorm12` | SCORM 1.2 ZIP under `.lxpack/course/.lxpack/out/` |
| `scorm2004` | SCORM 2004 ZIP |
| `xapi` | xAPI ZIP |
| `cmi5` | cmi5 ZIP |
| `standalone` | Unpacked standalone directory |

```bash
lessonkit package --target react-vite
lessonkit package --target scorm12
lessonkit package --target standalone --json
lessonkit package --target scorm12 --no-build
lessonkit package --target scorm12 --out .lxpack/out/custom.zip
```

| Flag | Description |
|------|-------------|
| `--target` | **Required.** Export target (see table above) |
| `--cwd` | Project root (default: current directory) |
| `--no-build` | Skip the implicit Vite build; requires an existing `dist/` (fails fast if `dist/` is missing) |
| `--out` | Override output artifact path (must resolve inside the project root) |
| `--strict-parity` | Treat React ↔ `lessonkit.json` ID parity **warnings** as packaging errors (exit code 3). Use in CI when you want zero tolerance for drift. |
| `--json` | Structured JSON result on stdout (CI/codegen) |

Lxpack targets run `packageLessonkitCourse()` from `@lessonkit/lxpack`. Output layout matches [Packaging reference](reference/packaging.md).

### `lessonkit export`

Export a portable `.lkcourse` archive (author manifest + LXPack interchange + `dist/`). For team handoff and tooling — not LMS upload.

```bash
lessonkit export
lessonkit export --out backups/my-course.lkcourse
lessonkit export --no-build --with-block-tree
lessonkit export --json
```

| Flag | Description |
|------|-------------|
| `--cwd` | Project root |
| `--out` | Output path relative to project root (default: `{name}.lkcourse`) |
| `--no-build` | Skip implicit Vite build; requires existing `dist/` |
| `--with-block-tree` | Include optional `block-tree.json` (best-effort JSX scan of `src/`) |
| `--json` | Structured JSON on stdout |

See [Portable interchange](reference/interchange.md).

### `lessonkit blocks list`

List runtime blocks from `block-catalog.v3.json` (block registry for codegen and assistants).

```bash
lessonkit blocks list
lessonkit blocks list --json
lessonkit blocks list --category assessment
lessonkit blocks list --tier B --json
```

| Flag | Description |
|------|-------------|
| `--json` | Emit catalog entries as JSON (`entries[]`, `count`, `schemaVersion`) |
| `--category` | Filter by category (`container`, `assessment`, `content`, `compound`, `chrome`) |
| `--tier` | Filter by tier (`A`, `B`, `C`, `D`, `E`) |

### `lessonkit publish`

Stub — use npm and the tag-based workflow in [RELEASING](https://github.com/eddiethedean/lessonkit/blob/main/RELEASING.md).

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Command/runtime failure (build failed, spawn error) |
| `2` | Invalid or missing project config |
| `3` | Packaging/validation failure |

## JSON output (`--json`)

Successful build:

```json
{ "ok": true, "command": "build", "projectRoot": "/path/to/project" }
```

Successful package:

```json
{
  "ok": true,
  "target": "scorm12",
  "projectRoot": "/path/to/project",
  "outputPath": "/path/to/project/.lxpack/course/.lxpack/out/course-scorm12.zip",
  "fileCount": 42
}
```

Failure:

```json
{
  "ok": false,
  "code": "INVALID_PROJECT",
  "message": "lessonkit.json not found",
  "exitCode": 2
}
```

## Programmatic API

Embed the CLI in Node scripts or tests:

```ts
import { createProgram, run } from "@lessonkit/cli";

// Build a Commander program (same commands as the `lessonkit` binary)
const program = createProgram(console);
await program.parseAsync(["node", "lessonkit", "build", "--cwd", "./my-course"]);

// Or parse process.argv directly
await run(process.argv);
```

Set `LESSONKIT_CMD_TIMEOUT_MS` to override subprocess timeouts for `dev`/`build` (see package README).

## Packaging error catalog

Common failure messages, causes, and fixes: [CLI error catalog](reference/cli-errors.md).

## Related

- [Packaging reference](reference/packaging.md) — LXPack adapter and output layout
- [vite-react template](https://github.com/eddiethedean/lessonkit/tree/main/templates/vite-react/) — starter template
- [lxpack-golden example](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden/) — packaging reference
