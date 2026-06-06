# Packaging and CLI

## CLI workflow

```bash
lessonkit init my-course
lessonkit dev
lessonkit build
lessonkit package --target scorm12
```

Requires **Node 18+** for `package` LMS targets.

- **`lessonkit dev`** has no subprocess timeout (long-running Vite dev server).
- **`lessonkit build`** and **`lessonkit package`** subprocesses default to a **30 minute** timeout; override with `LESSONKIT_CMD_TIMEOUT_MS`.

Flags and manifest schema: [CLI reference](../../reference/cli.md).

## React / manifest ID parity

Before packaging, the CLI validates that your React source under `src/` references the same **`courseId`** and assessment **`checkId`** values declared in `lessonkit.json`. Mismatches fail packaging with explicit errors (implemented in `@lessonkit/lxpack` as `validateReactManifestParity`).

Keep React props and manifest entries in sync—see [Keep React IDs in sync with lessonkit.json](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).

## Programmatic packaging

```ts
import { packageLessonkitCourse } from "@lessonkit/lxpack";
import { courseDescriptor } from "./course.descriptor";

const result = await packageLessonkitCourse({
  descriptor: courseDescriptor,
  outDir: ".lxpack/course",
  spaDistDir: "dist",
  projectRoot: process.cwd(),
  target: "scorm12",
  output: ".lxpack/out/course-scorm12.zip",
});

if (!result.ok) {
  console.error(result.issues);
  process.exit(1);
}
```

Pass **`projectRoot`** when packaging from the CLI path so ID parity validation runs.

Golden reference: `examples/lxpack-golden` in the repo.

Full guide: [Packaging reference](../../reference/packaging.md).

## `lessonkit.json` vs interchange file

- **Project root** `lessonkit.json` — `schemaVersion: 1`, used by CLI
- **`.lxpack/course/lessonkit.json`** — LXPack interchange output; not used for CLI discovery

## Layout

Use `single-spa` for CLI packaging (1.0.0). Multi-lesson UX stays inside your React app.

`per-lesson-spa` is supported by `@lessonkit/lxpack` APIs but not `lessonkit package` yet.

## Production

Before shipping packaged courses to learners, complete the [production checklist](production-checklist.md) (LMS bridge, observability hooks, transport timeouts).
