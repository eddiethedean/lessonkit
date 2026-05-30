# @lessonkit/lxpack

[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![npm](https://img.shields.io/npm/v/@lessonkit/lxpack.svg)](https://www.npmjs.com/package/@lessonkit/lxpack)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

LXPack export adapter for LessonKit — write `lessonkit.json` + `course.yaml`, copy SPA builds, and package to SCORM / standalone / xAPI / cmi5 via [`@lxpack/api`](https://www.npmjs.com/package/@lxpack/api).

Requires **Node.js 18+** (LXPack `@lxpack/api` **0.6.2+**).

**Docs:** [Packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) · [Packaging & CLI guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html) · [Live examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html)

## Install

```bash
npm install @lessonkit/lxpack @lxpack/api
```

## Quick start

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

if (!result.ok) throw new Error("packaging failed");
```

See the [packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) and the [`examples/lxpack-golden`](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden) course.

## Browser bridge

When your React app runs inside an LXPack iframe:

```ts
import { notifyLxpackLessonComplete } from "@lessonkit/lxpack/bridge";
```

`@lessonkit/react` forwards `lesson_completed`, `course_completed`, and `quiz_completed` automatically when `window.parent.lxpackBridge.v1` is present (`config.lxpack.bridge: "off"` to disable).

For interoperability notes, see [LXPack upgrades](https://lessonkit.readthedocs.io/en/latest/reference/lxpack-upgrades.html). LXPack maintainers: [upgrade plan for maintainers](https://github.com/eddiethedean/lessonkit/blob/main/docs/LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md).
