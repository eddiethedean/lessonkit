# Studio visual editor (0.2.0)

The local visual editor MVP lives in **`apps/studio-web`** and is built from:

- **`@lessonkit/studio-builder`** — headless project state, commands, undo/redo, autosave hooks
- **`@lessonkit/studio-ui`** — `StudioEditor` layout (palette, canvas, inspector, preview)
- **`@lessonkit/studio-schema`** / **`@lessonkit/studio-renderer`** — same project model and preview as 0.1

## Run locally

From the monorepo root (after `npm install` and `npm run build:packages`):

```bash
npm run dev -w lessonkit-studio-web
```

Open the URL Vite prints (typically `http://localhost:5173`).

## Persistence (0.2)

- **Autosave:** validated project JSON is written to `localStorage` under `lessonkit-studio:project` (debounced, default 500ms).
- **Export / import:** toolbar buttons download or load `project.json`.
- **Reset:** restores the bundled sample project.

GitHub sync and hosted Studio are planned for 0.4+; do not rely on `localStorage` for production authoring.

## Keyboard shortcuts

| Action | Shortcut |
|--------|----------|
| Undo | `Ctrl+Z` / `Cmd+Z` |
| Redo | `Ctrl+Shift+Z` / `Cmd+Shift+Z` |

## Editing model

- **Pages:** sidebar page list — add, rename, select active page.
- **Blocks:** drag from the palette onto the canvas, or click a palette entry to insert at the page root.
- **Containers:** drop blocks onto a container (or its empty nested zone) to nest; reorder siblings via drag.
- **Properties:** inspector fields come from the Studio block catalog for the selected block.
- **Preview:** lower pane uses `StudioRenderer` with the active page.

Cross-page drag and scenario branching graph editing are out of scope for 0.2.

## Embed in your app

```tsx
import { StudioEditor } from "@lessonkit/studio-ui";
import { loadStudioProject } from "@lessonkit/studio-schema";

const loaded = loadStudioProject(json);
if (!loaded.ok) throw new Error("invalid project");

<StudioEditor
  project={loaded.project}
  onProjectChange={(next) => {
    /* persist next */
  }}
/>
```

See also [Studio project format v1](project-format-v1.md) and [STUDIO_READINESS.md](../../STUDIO_READINESS.md).
