# Studio project format (v1)

LessonKit Studio uses a JSON authoring document stored at `src/project.json`, separate from the packaging manifest `lessonkit.json` used by `@lessonkit/cli` and `@lessonkit/lxpack`. Format **v1** shipped in Studio **0.1.0**; the visual editor shipped in **0.2.0** ([editor guide](editor.md)).

## On-disk layout

```text
my-course/
├── lessonkit.json      # Packaging manifest (schemaVersion 1)
├── src/
│   └── project.json    # Studio authoring document
├── assets/             # Media referenced by blocks
└── themes/             # Optional theme overrides
```

## Authoring document

```json
{
  "schemaVersion": 1,
  "course": { "courseId": "my-course", "title": "My course" },
  "pages": [
    {
      "id": "lesson-1",
      "title": "Lesson one",
      "blocks": []
    }
  ]
}
```

- **`schemaVersion`**: Must be `1` (string `"1"` is migrated to number on load).
- **`course`**: Top-level course metadata (`courseId`, `title`).
- **`pages`**: One page per lesson in 0.1.0 (`page.id` → `lessonId`, `page.title` → lesson title).

## Block types

| Type | Renderer (0.2.0) | Notes |
|------|------------------|-------|
| `text` | Implemented | Paragraph |
| `heading` | Implemented | `level` 1–3 |
| `image` | Implemented | `src`, `alt` |
| `button` | Implemented | Optional `href` |
| `input` | Implemented | Optional `inputType`, `placeholder` |
| `container` | Implemented | Nested `blocks` (max depth 8) |
| `quiz` | `@lessonkit/react` `Quiz` | Requires `checkId`, `question`, `choices`, `answer` |
| `scenario` | `@lessonkit/react` `Scenario` | Optional `blockId`; nested content |
| `checklist` | Implemented | Read-only checkbox preview |
| `video` | Implemented | HTML5 `<video>` preview |

Machine-readable catalogs:

- `@lessonkit/studio-schema/studio-block-catalog.v1.json`
- `@lessonkit/studio-schema/studio-project.v1.json` (JSON Schema)

## TypeScript API

```ts
import {
  loadStudioProject,
  parseStudioProject,
  validateStudioProject,
  normalizeStudioProject,
  migrateStudioProject,
} from "@lessonkit/studio-schema";

const result = loadStudioProject(rawJson);
if (!result.ok) {
  console.error(result.issues);
} else {
  console.log(result.project, result.migrationsApplied);
}
```

## React renderer

```tsx
import { StudioRenderer } from "@lessonkit/studio-renderer";

<StudioRenderer
  project={project}
  config={{ tracking: { sink: console.log } }}
  theme={{ preset: "default", mode: "light" }}
  activePageId="lesson-1"
/>
```

The renderer wraps `ThemeProvider`, `Course`, and `Lesson` from `@lessonkit/react` so preview and future export share the same runtime as hand-authored apps.

## Example

See [`examples/studio-minimal`](../../../examples/studio-minimal) — run `npm run dev -w lessonkit-example-studio-minimal` after `npm run build:packages`.

## Related docs

- [LessonKit Studio spec](../../LessonKit_Studio_SPEC.md)
- [Runtime block catalog](../../BLOCK_CATALOG.md) — framework primitives used by `quiz` and `scenario`
- [Studio editor (0.2)](editor.md) — run `apps/studio-web`, autosave, shortcuts
- [STUDIO_READINESS.md](../../STUDIO_READINESS.md) — Studio readiness checklists
