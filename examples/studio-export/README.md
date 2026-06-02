# Studio export example

Demonstrates exporting a [`StudioProjectV1`](../packages/studio-schema) to a shippable React/Vite project with `@lessonkit/studio-codegen`, then packaging SCORM 1.2 with the LessonKit CLI.

## Prerequisites

From the monorepo root:

```bash
npm install
npm run build:packages
```

## Export from fixture JSON

```bash
node --experimental-strip-types examples/studio-export/export.mjs
cd examples/studio-export/out/studio-export-demo
npm install
npm run build
npx lessonkit package --target scorm12 --no-build
```

The SCORM zip is written under `.lxpack/course/.lxpack/out/`.

## Modes

- **Renderer (default):** `src/project.json` + `StudioRenderer` — same preview as the editor.
- **Explicit JSX:** set `exportMode: "jsx"` in `export.mjs` to generate `src/App.tsx` with `@lessonkit/react` components.

See [Studio export guide](../docs/guides/studio/export.md) for browser vs Node workflows and LMS targets.
