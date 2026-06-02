# Studio live app

This page embeds a **production build** of [`apps/studio-web`](https://github.com/eddiethedean/lessonkit/tree/main/apps/studio-web), compiled when the documentation site is built (CI and [Read the Docs](https://lessonkit.readthedocs.io/)). It is the same app you get from `npm run dev -w lessonkit-studio-web`, without installing Node locally.

## What you can do here

- Edit pages, blocks, and properties in the visual editor
- See **live preview** via `@lessonkit/studio-renderer`
- **Export** a React/Vite zip (renderer or explicit JSX) or copy CLI steps for LMS packaging
- **Import / export** `project.json`; **Reset** restores the bundled sample

Changes autosave to `localStorage` under `lessonkit-studio:project` in this browser only.

:::{admonition} Build the demo locally
:class: tip

From the repo root:

```bash
bash docs/scripts/build-docs-demos.sh
cd docs && make html
```

Open `_build/html/guides/studio/app.html`. The script also builds the [course examples](../../examples/index.md).
:::

```{raw} html
<iframe
  class="lk-demo-frame lk-demo-frame--studio"
  src="../../_static/demos/studio/index.html"
  title="LessonKit Studio editor"
  loading="lazy"
></iframe>
```

<p class="lk-demo-links">
  <a href="../../_static/demos/studio/index.html" target="_blank" rel="noopener noreferrer">Open in full tab</a>
  · <a href="https://github.com/eddiethedean/lessonkit/tree/main/apps/studio-web">Source on GitHub</a>
</p>

## Next steps

- [Visual editor guide](editor.md) — shortcuts, persistence, embedding `StudioEditor`
- [Export guide](export.md) — browser zip vs Node, SCORM/xAPI via LXPack
- [Project format v1](project-format-v1.md) — schema and validation
