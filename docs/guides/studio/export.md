# Exporting from Studio (0.3.2)

::::{admonition} Alpha
:class: warning

LessonKit Studio is **Alpha**. Expect breaking changes to the editor UI, exported output, and `StudioProjectV1` format between Studio releases.
::::

Studio 0.3 adds **`@lessonkit/studio-codegen`**: turn a validated `StudioProjectV1` into a React/Vite project authors can build and ship. LMS packaging (SCORM, xAPI, cmi5, standalone) uses **@lessonkit/lxpack** via the **`lessonkit package`** CLI — the same path as hand-authored courses.

## Export modes

| Mode | Output | When to use |
|------|--------|-------------|
| **Renderer** (default) | `src/project.json` + `StudioRenderer` in `main.tsx` | Preview parity with the editor; data-driven updates |
| **Explicit JSX** | `src/App.tsx` with `@lessonkit/react` components | Teams that want editable React source |

Both modes include `lessonkit.json`, Vite config, and pinned `@lessonkit/*` dependencies.

## Browser (studio-web)

The [Studio live app](app.md) and `apps/studio-web` include an **Export** panel:

1. Choose export mode and optional theme / xAPI activity IRI.
2. **Download React/Vite zip** — in-memory codegen + JSZip (no local asset copy).
3. **Copy CLI snippet** — Node steps for full LMS packaging.

Browser export cannot run LXPack or copy local asset files unless they are embedded in the project JSON (use HTTPS URLs or export from Node with `assetsDir`).

## Node API

```ts
import { generateExportFiles } from "@lessonkit/studio-codegen";
import {
  writeReactViteProject,
  writeLxpackProjectFromStudio,
  packageStudioProject,
} from "@lessonkit/studio-codegen/node";

// In-memory file list (zip, upload, etc.)
const files = generateExportFiles(project, { exportMode: "renderer" });

// Write Vite tree to disk (optional assetsDir copies assets/*)
await writeReactViteProject(project, { outDir: "./my-course", exportMode: "renderer" });

// LXPack metadata only (requires built SPA dist)
await writeLxpackProjectFromStudio(project, {
  outDir: "./.lxpack/course",
  spaDistDir: "./dist",
});

// Full pipeline: write → npm install → vite build → packageLessonkitCourse
const result = await packageStudioProject(project, {
  outDir: "./my-course",
  target: "scorm12",
});
```

## Packaging matrix

| Target | Browser zip | Node codegen + `lessonkit package` |
|--------|-------------|-------------------------------------|
| React/Vite source | Yes | Yes |
| standalone | No | Yes |
| scorm12 / scorm2004 | No | Yes |
| xapi / cmi5 | No | Yes |

Typical CLI workflow after export:

```bash
cd my-course
npm install
npm run build
npx lessonkit package --target scorm12 --no-build
```

## Validation

Export refuses invalid projects (`validateStudioProject`, at least one page, unique quiz `checkId`s, non-empty block fields). Fix issues in the editor validation banner before exporting.

**Multi-page projects:** LXPack `single-spa` descriptors include only the **first page** in `lessonkit.json`. Additional pages remain in `project.json` and as extra `<Lesson>` entries in exported React apps. The export panel shows a warning when `pages.length > 1`.

## Examples and tests

- [examples/studio-export](https://github.com/eddiethedean/lessonkit/tree/main/examples/studio-export) — script + README
- Integration test: `integration/test/studio-export-package.test.ts` (codegen → build → SCORM 1.2)

See also [Studio overview](index.md), [Live app](app.md), [Studio editor guide](editor.md), and [Studio readiness](../../project/studio-readiness.md).
