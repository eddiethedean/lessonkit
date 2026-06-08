# @lessonkit/lxpack

[![npm](https://img.shields.io/npm/v/@lessonkit/lxpack.svg)](https://www.npmjs.com/package/@lessonkit/lxpack)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Package Vite SPAs for LMS delivery — SCORM 1.2/2004, standalone, xAPI, and cmi5. Bundles [`@lxpack/*`](https://www.npmjs.com/org/lxpack) as direct dependencies.

## When to install

- Custom packaging pipelines without the CLI
- Validating `lessonkit.json` / course descriptors in CI
- Programmatic LMS export from your own build tools

Most authors use `lessonkit package` (CLI) which calls this package internally.

## Install

```bash
npm install @lessonkit/lxpack
```

Requires Node.js **18+** minimum; **20.19+** recommended for CLI scaffold workflows.

## Usage

```typescript
import { packageLessonkitCourse, parseLessonkitManifest } from "@lessonkit/lxpack";

const manifest = parseLessonkitManifest(await readFile("lessonkit.json", "utf8"));
if (!manifest.ok) throw manifest.error;

const result = await packageLessonkitCourse({
  descriptor: manifest.value,
  outDir: ".lxpack/course",
  spaDistDir: "dist",
  target: "scorm12",
  output: ".lxpack/out/course-scorm12.zip",
});

if (!result.ok) throw new Error("packaging failed");
```

Prefer the CLI: `lessonkit package --target scorm12` reads `lessonkit.json` and runs the same staged pipeline.

## Layouts

| Layout | Use case |
| --- | --- |
| `single-spa` | One Vite SPA for the whole course (CLI default) |
| `per-lesson-spa` | One dist per lesson (advanced; see packaging reference) |

## Portable interchange (1.6.0)

Export a `.lkcourse` archive for team handoff (not LMS upload):

```typescript
import { exportLkcourse, validateLkcourse, importLkcourse } from "@lessonkit/lxpack";

await exportLkcourse({ projectRoot, manifest, includeBlockTree: true });
validateLkcourse("course.lkcourse");
await importLkcourse({ archivePath: "course.lkcourse", targetDir: "./restored" });
```

Schemas: `@lessonkit/lxpack/lkcourse-format.v1.json`, `@lessonkit/lxpack/block-tree.v1.json`. See [Portable interchange](https://lessonkit.readthedocs.io/en/latest/reference/interchange.html).

## Browser bridge

When embedded in an LXPack iframe, `@lessonkit/react` forwards completion events to `window.parent.lxpackBridge.v1`:

```typescript
import { forwardTelemetryToBridge } from "@lessonkit/lxpack/bridge";
```

Production builds require `allowedParentOrigins` when `bridge: "auto"`.

## Common issues

| Symptom | Fix |
| --- | --- |
| React/manifest ID mismatch | Run strict parity validation; align IDs in `App.tsx` and `lessonkit.json` |
| xAPI/cmi5 validation failure | Set HTTPS `activityIri` in manifest |
| Empty `dist/` | Run `lessonkit build` before `package` (or omit `--no-build`) |

## Docs

[Packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) · [LXPack bridge](https://lessonkit.readthedocs.io/en/latest/reference/lxpack-bridge.html) · [Manifest](https://lessonkit.readthedocs.io/en/latest/reference/manifest.html) · [Golden example](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden) · [TypeDoc API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0
