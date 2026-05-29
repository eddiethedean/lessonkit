# LessonKit CLI (0.7+)

The `@lessonkit/cli` package provides the developer workflow for LessonKit projects: scaffold, dev, build, and dual export packaging.

## Install

```bash
npm install -g @lessonkit/cli
# or use without installing:
npx @lessonkit/cli init my-course
```

**Node.js:** dev/build work on Node 18+. LMS packaging targets (`scorm12`, `scorm2004`, `xapi`, `cmi5`, `standalone`) require **Node.js 20+** (see [`PACKAGING.md`](PACKAGING.md)).

## Quick start

```bash
lessonkit init my-course
cd my-course
lessonkit dev
lessonkit build
lessonkit package --target scorm12
```

## Project manifest: `lessonkit.json`

Every LessonKit project includes a `lessonkit.json` at the project root. The CLI walks up from `--cwd` to find it.

```json
{
  "schemaVersion": 1,
  "name": "my-course",
  "course": {
    "courseId": "my-course",
    "title": "My LessonKit Course",
    "layout": "single-spa",
    "lessons": [{ "id": "lesson-1", "title": "My first lesson" }],
    "assessments": [],
    "theme": { "preset": "default" }
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
| `course` | [`LessonkitCourseDescriptor`](../packages/lxpack/src/types.ts) passed to `@lessonkit/lxpack` |
| `paths.spaDistDir` | Vite build output (default `dist`) |
| `paths.lxpackOutDir` | LXPack project directory (default `.lxpack/course`) |
| `paths.outputBaseDir` | Packaged artifact base under the LXPack project dir (default `.lxpack/out`; artifacts are `{outputBaseDir}/course-<target>.zip` or `{outputBaseDir}/standalone`) |

Keep `course.courseId`, `course.lessons[].id`, and `course.assessments[].checkId` aligned with your React component props. `lessonkit init` updates `lessonkit.json` and patches `src/App.tsx` `courseId` / course title for you. See [`IDENTITY.md`](IDENTITY.md).

The CLI only recognizes project manifests with `schemaVersion: 1` (not the interchange `lessonkit.json` written under `.lxpack/course`). `per-lesson-spa` layout is not supported by `lessonkit package` (0.9.2) — use `single-spa`. SPA build output is controlled by `paths.spaDistDir` (not `course.spaDistDir`).

## Commands

### `lessonkit init [name]`

Scaffold a Vite + React project from the bundled template.

```bash
lessonkit init my-course
lessonkit init --here          # init in current directory
lessonkit init my-course --skip-install
lessonkit init my-course --force
```

| Flag | Description |
|------|-------------|
| `--here` | Initialize in the current directory instead of creating a subdirectory |
| `--skip-install` | Skip `npm install` (CI/automation) |
| `--force` | With `--here` only: initialize when the current directory is empty or contains dotfiles only (merges template files; does not delete existing files) |

### `lessonkit dev`

Run the Vite dev server. Extra Vite args pass through after `--`:

```bash
lessonkit dev
lessonkit dev -- --port 3000
lessonkit dev --cwd ./apps/training
```

### `lessonkit build`

Production Vite build to `dist/` (or `paths.spaDistDir` from `lessonkit.json`; the CLI passes `--outDir` when it differs from `dist`).

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
| `--no-build` | Skip implicit Vite build when `dist/` already exists (`react-vite` and lxpack targets) |
| `--out` | Override output artifact path (must resolve inside the project root) |
| `--json` | Structured JSON result on stdout (CI/codegen) |

Lxpack targets run `packageLessonkitCourse()` from `@lessonkit/lxpack`. Output layout matches [`PACKAGING.md`](PACKAGING.md).

### `lessonkit publish`

Stub — use npm and the tag-based workflow in [`RELEASING.md`](../RELEASING.md).

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

## Related

- [`PACKAGING.md`](PACKAGING.md) — LXPack adapter and output layout
- [`templates/vite-react/`](../templates/vite-react/) — starter template
- [`examples/lxpack-golden/`](../examples/lxpack-golden/) — packaging reference
