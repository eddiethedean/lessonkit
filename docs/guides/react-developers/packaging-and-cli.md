# Packaging and CLI

## CLI workflow

```bash
lessonkit init my-course
lessonkit dev
lessonkit build
lessonkit package --target scorm12
```

Requires **Node 20+** for `package` LMS targets.

Flags and manifest schema: [CLI reference](../../reference/cli.md).

## Programmatic packaging

```ts
import { packageLessonkitCourse } from "@lessonkit/lxpack";
import { courseDescriptor } from "./course.descriptor";

const result = await packageLessonkitCourse({
  descriptor: courseDescriptor,
  outDir: ".lxpack/course",
  spaDistDir: "dist",
  target: "scorm12",
  output: ".lxpack/out/course-scorm12.zip",
});

if (!result.ok) {
  console.error(result.issues);
  process.exit(1);
}
```

Golden reference: `examples/lxpack-golden` in the repo.

Full guide: [Packaging reference](../../reference/packaging.md).

## `lessonkit.json` vs interchange file

- **Project root** `lessonkit.json` — `schemaVersion: 1`, used by CLI
- **`.lxpack/course/lessonkit.json`** — LXPack interchange output; not used for CLI discovery

## Layout

Use `single-spa` for CLI packaging (0.8.1). Multi-lesson UX stays inside your React app.

`per-lesson-spa` is supported by `@lessonkit/lxpack` APIs but not `lessonkit package` yet.
