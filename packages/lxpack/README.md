# @lessonkit/lxpack

LXPack export adapter for LessonKit — write `lessonkit.json` + `course.yaml`, copy SPA builds, and package to SCORM / standalone / xAPI / cmi5 via [`@lxpack/api`](https://www.npmjs.com/package/@lxpack/api).

Requires **Node.js 20+**.

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

See [`docs/PACKAGING.md`](../../docs/PACKAGING.md) and [`examples/lxpack-golden`](../../examples/lxpack-golden).

## Browser bridge

When your React app runs inside an LXPack iframe:

```ts
import { notifyLxpackLessonComplete } from "@lessonkit/lxpack/bridge";
```

`@lessonkit/react` forwards `lesson_completed`, `course_completed`, and `quiz_completed` automatically when `window.parent.lxpackBridge.v1` is present (`config.lxpack.bridge: "off"` to disable).
