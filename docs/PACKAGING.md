# Packaging with LXPack (1.0+)

LessonKit authors courses in React (`@lessonkit/react`). **LXPack** validates and packages them for LMS delivery. **`@lessonkit/lxpack`** is the adapter between the two.

Requires **Node.js 18+** (LXPack `@lxpack/api` **0.6.2+**).

## Workflow

1. **Author** a React app with stable `courseId`, `lessonId`, and `checkId` props.
2. **Describe** the course in a `LessonkitCourseDescriptor` (see [`examples/lxpack-golden/course.descriptor.ts`](../examples/lxpack-golden/course.descriptor.ts)).
3. **Build** the Vite app (`npm run build` → `dist/`).
4. **Package** with `packageLessonkitCourse()` or the golden example scripts.

```ts
import { packageLessonkitCourse } from "@lessonkit/lxpack";
import { goldenCourseDescriptor } from "./course.descriptor";

const result = await packageLessonkitCourse({
  descriptor: goldenCourseDescriptor,
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

## SPA layouts

### `single-spa` (recommended default)

One Vite build, one `type: spa` lesson in the LXPack project. Multi-lesson navigation stays inside your React app (step state, router, etc.).

- Set `layout: "single-spa"` on the descriptor.
- Optional `spaLessonId` (defaults to the first lesson id).
- Copy source from `spaDistDir` (default `dist`) into `{outDir}/dist`.

### `per-lesson-spa`

One build output per lesson (multi-SCO friendly).

- Set `layout: "per-lesson-spa"`.
- Each lesson needs `spaPath` (e.g. `dist/lessons/intro`).
- Pass `lessonSpaDirs: { intro: "/abs/path/to/build" }` to `writeLxpackProject` / `packageLessonkitCourse`.
- **`lessonkit package` does not accept `per-lesson-spa` in 1.0.0** — call `packageLessonkitCourse()` from `@lessonkit/lxpack` (or wire your own script) for multi-SCO exports.

### `spaPath` safety

`spaPath` must be a **relative** path under the LXPack project root: no `..` segments, no leading `/` or drive letters. `validateDescriptor` rejects unsafe values; `writeLxpackProject` also verifies the resolved copy destination stays inside `outDir`.

## Assessments and passing scores

- **Packaged YAML** (`assessments/*.yaml`, when `writeAuthoringFiles: true`): `passingScore` is an **absolute** point threshold (default `1` for a single-question check).
- **Embedded SPA bridge** (`window.parent.lxpackBridge.v1.submitAssessment`): `score` and `passingScore` are **0–1** (scaled). `@lessonkit/react` uses `mapLessonkitTelemetryToBridgeAction` from `@lxpack/tracking-schema` (via `@lessonkit/lxpack/bridge`) with `@lxpack/spa-bridge` score normalizers.

## Packaging failures and stale output

`packageLessonkitCourse` writes to a temporary directory first and atomically swaps it into `outDir` only after validate + build succeed, so a failed run does not overwrite a previously good project. Re-packaging clears prior SPA output under `dist/` (or each lesson `spaPath`) before copying fresh build artifacts.

## Output layout (stable)

| Path | Contents |
|------|----------|
| `{outDir}/course.yaml` | LXPack manifest (lessons, runtime theme, assessments) |
| `{outDir}/lessonkit.json` | LessonKit interchange (merged by `@lxpack/api`) |
| `{outDir}/dist/` | SPA assets (`single-spa`) |
| `{outDir}/.lxpack/out/course-{target}.zip` | Packaged SCORM/xAPI/cmi5 ZIP (default) |
| `{outDir}/.lxpack/out/standalone/` | Unpacked standalone (`dir: true`) |

## Targets

Use any LXPack `ExportTarget`: `scorm12`, `scorm2004`, `standalone`, `xapi`, `cmi5`.

```ts
import { validateLessonkitProject, buildLessonkitProject } from "@lessonkit/lxpack";

await validateLessonkitProject({ courseDir: ".lxpack/course", target: "scorm2004" });
await buildLessonkitProject({
  courseDir: ".lxpack/course",
  target: "standalone",
  dir: true,
  output: ".lxpack/out/standalone",
});
```

## Theme parity

Export the same tokens you use in `ThemeProvider`:

```ts
import { themeToLxpackRuntime } from "@lessonkit/lxpack";

const runtime = themeToLxpackRuntime({ preset: "brand" });
// → { theme: "brand", cssVariables: { "--lk-color-primary": "...", ... } }
```

`descriptorToInterchange()` + LXPack materialization write `runtime.cssVariables` into `course.yaml` so packaged shells match your React preview.

## LMS bridge (iframe)

When the SPA runs inside LXPack, call the parent bridge (or rely on `@lessonkit/react`, which forwards completion events when `window.parent.lxpackBridge.v1` exists):

```ts
import { notifyLxpackLessonComplete } from "@lessonkit/lxpack/bridge";

notifyLxpackLessonComplete("intro");
```

Disable forwarding: `config.lxpack.bridge = "off"` on `LessonkitProvider`.

Direct bridge calls must pass **scaled** `score` (0–1). See `normalizeAssessmentScore` in `@lessonkit/lxpack/bridge`.

## Runtime: changing `courseId`

If you swap courses in one React tree without remounting, `LessonkitProvider` resets progress and emits `course_started` for the new `courseId`. Prefer `<Course key={courseId} …>` when switching courses for predictable unmount behavior.

Configure `config.xapi` before first paint when possible; if xAPI is enabled after mount, `course_started` is sent to the new client when it becomes available.

## Golden example

```bash
npm -w lessonkit-example-lxpack-golden run build
npm -w lessonkit-example-lxpack-golden run package:scorm12
npm -w lessonkit-example-lxpack-golden run package:standalone
```

Import `examples/lxpack-golden/.lxpack/course/.lxpack/out/course-scorm12.zip` into your LMS, or open the standalone folder in a browser.

## ID mapping

LessonKit ids are used as-is in LXPack (`courseId`, `lessonId`, `checkId`). See [`IDENTITY.md`](IDENTITY.md).

## CLI (1.0+)

Use `lessonkit package` as the canonical dual-export entrypoint:

```bash
lessonkit build
lessonkit package --target react-vite
lessonkit package --target scorm12
lessonkit package --target standalone --json
```

See [`docs/CLI.md`](CLI.md) for the full command reference and `lessonkit.json` schema.

## Staged packaging pipeline (1.0)

`packageLessonkitCourse()` delegates to staged helpers you can call directly:

```typescript
import {
  parseLessonkitManifest,
  validatePackageInputs,
  remapArtifactPaths,
  promoteStagingToOutDir,
} from "@lessonkit/lxpack";

const manifest = parseLessonkitManifest(json, "lessonkit.json", projectRoot);
const validation = validatePackageInputs({ descriptor, spaDistDir, projectRoot });
const remappedZip = remapArtifactPaths(stagingRoot, outDir, staged.outputPath);
await promoteStagingToOutDir(stagingDir, outDir);
```

Project manifests (`lessonkit.json` with `schemaVersion: 1`) are parsed by `parseLessonkitManifest` in `@lessonkit/lxpack`; the CLI delegates to the same module.

## Related

- [`LXPACK_UPGRADES_FOR_LESSONKIT.md`](LXPACK_UPGRADES_FOR_LESSONKIT.md)
- [LXPack LessonKit interoperability](https://lxpack.readthedocs.io/en/latest/guides/lessonkit-interoperability/)
