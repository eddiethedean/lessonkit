# LessonKit Studio

::::{admonition} Alpha
:class: warning

LessonKit Studio is **Alpha**. Expect breaking changes to the editor UI, exported output, and `StudioProjectV1` format between Studio releases. Pin `@lessonkit/studio-*` versions and review the changelog before upgrading.
::::

:::{admonition} Who this is for
:class: tip

Authors and instructional designers who want a **visual editor** for LessonKit courses—block palette, drag-and-drop layout, live preview, and export to shippable React/Vite projects—without hand-writing every component first.
:::

LessonKit Studio is the authoring surface for **`StudioProjectV1`** JSON: the same project model powers the editor, shared renderer preview, and **`@lessonkit/studio-codegen`** export. LMS packaging still uses **`lessonkit package`** and **@lessonkit/lxpack** after you build the exported app.

## Try it now

**[Open the live Studio app](app.md)** — embedded in this documentation site (refreshed on each Read the Docs build). Edits autosave to your browser `localStorage` for that demo only.

## Studio packages (npm)

| Package | Role |
| --- | --- |
| `@lessonkit/studio-schema` | Project model, validation, block catalog |
| `@lessonkit/studio-renderer` | Preview parity with exported renderer mode |
| `@lessonkit/studio-builder` | Headless editor store, undo/redo, commands |
| `@lessonkit/studio-ui` | `StudioEditor`, `ExportPanel` |
| `@lessonkit/studio-codegen` | React/Vite + LXPack export (0.3+) |

Published on the **`studio-v*`** tag line (separate from core `v*` releases). See [changelog](../../project/changelog.md) for Studio release notes.

## Guide outline

| Topic | Page |
| --- | --- |
| **Live app** | [app.md](app.md) |
| Project format v1 | [project-format-v1.md](project-format-v1.md) |
| Visual editor | [editor.md](editor.md) |
| Codegen & export | [export.md](export.md) |

## Run locally

From the monorepo root:

```bash
npm install
npm run build:packages
npm run dev -w lessonkit-studio-web
```

Source: [`apps/studio-web`](https://github.com/eddiethedean/lessonkit/tree/main/apps/studio-web).

## Related paths

- **Hand-authored React courses** — [React developer guides](../react-developers/index.md)
- **Runnable course demos** — [Live examples](../../examples/index.md) (cybersecurity, privacy, support, LXPack golden)
- **AI-assisted workflow (no Studio)** — [Vibe coding](../vibe-coding/index.md)

## Not in Studio yet

GitHub sync, hosted `lessonkit.app`, `lessonkit-studio` CLI, Tauri desktop, and schema v2 are planned for later Studio releases. See [roadmap](../../project/roadmap.md).
