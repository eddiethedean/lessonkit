# @lessonkit/studio-codegen

Export [LessonKit Studio](https://github.com/eddiethedean/lessonkit) projects to shippable React/Vite and LXPack artifacts.

## Install

```bash
npm install @lessonkit/studio-codegen @lessonkit/studio-schema
```

## Browser-safe API

```ts
import {
  assertExportableProject,
  generateExportFiles,
  generateReactViteFiles,
  generateReactViteJsxFiles,
  studioProjectToDescriptor,
} from "@lessonkit/studio-codegen";

const check = assertExportableProject(project);
if (!check.ok) throw new Error(check.issues.map((i) => i.message).join("\n"));

const files = generateExportFiles(project, {
  exportMode: "renderer", // or "jsx"
  theme: { preset: "default" },
});
```

## Node API

```ts
import { writeReactViteProject, packageStudioProject } from "@lessonkit/studio-codegen/node";

await writeReactViteProject(project, { outDir: "./my-course", exportMode: "renderer" });

const result = await packageStudioProject(project, {
  outDir: "./my-course",
  target: "scorm12",
});
```

## Export modes

| Mode | Output | Preview parity |
|------|--------|----------------|
| `renderer` (default) | `src/project.json` + `StudioRenderer` | Same as Studio preview |
| `jsx` | `src/App.tsx` with explicit `@lessonkit/react` components | Editable React source |

LMS packaging (SCORM, xAPI, standalone) uses `@lessonkit/lxpack` via `lessonkit package` after `npm run build`.
