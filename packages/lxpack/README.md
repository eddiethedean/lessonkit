# @lessonkit/lxpack

[![npm](https://img.shields.io/npm/v/@lessonkit/lxpack.svg)](https://www.npmjs.com/package/@lessonkit/lxpack)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Package Vite SPAs for LMS delivery — SCORM 1.2/2004, standalone, xAPI, and cmi5. `@lessonkit/lxpack` bundles [`@lxpack/*`](https://www.npmjs.com/org/lxpack) as direct dependencies (no separate `@lxpack/api` install).

Requires Node.js **18+** minimum; **20.19+** recommended for CLI scaffold workflows (Vite 8).

## Install

```bash
npm install @lessonkit/lxpack
```

## Usage

```typescript
import { packageLessonkitCourse } from "@lessonkit/lxpack";

const result = await packageLessonkitCourse({
  descriptor: courseDescriptor,
  outDir: ".lxpack/course",
  spaDistDir: "dist",
  target: "scorm12",
  output: ".lxpack/out/course-scorm12.zip",
});

if (!result.ok) throw new Error("packaging failed");
```

Prefer the CLI: `lessonkit package --target scorm12` reads `lessonkit.json` and runs the same pipeline.

## Browser bridge

When embedded in an LXPack iframe, `@lessonkit/react` forwards completion events to `window.parent.lxpackBridge.v1`. Direct API:

```typescript
import { forwardTelemetryToBridge } from "@lessonkit/lxpack/bridge";
```

## Docs

[Packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) · [LXPack bridge](https://lessonkit.readthedocs.io/en/latest/reference/lxpack-bridge.html) · [Golden example](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden) · [TypeDoc API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0
