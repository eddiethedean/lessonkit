# LessonKit documentation

```{raw} html
<div class="lk-hero">
  <div class="lk-hero-badges">
    <span class="lk-badge lk-badge--accent">v1.0.2</span>
    <span class="lk-badge">React-first</span>
    <span class="lk-badge">SCORM · xAPI · cmi5</span>
  </div>
  <p class="lk-hero-title">Build learning experiences that ship to your LMS</p>
  <p class="lk-lead">LessonKit is a framework for accessible, trackable courses—authored in React, packaged for SCORM and modern learning platforms, with built-in telemetry and xAPI.</p>
</div>
```

Pick the path that matches how you work:

::::{grid} 2
:gutter: 3

:::{grid-item-card} Vibe coding
:link: guides/vibe-coding/index
:link-type: doc

**No React required.** Use Cursor, Copilot, or ChatGPT with copy-paste prompts to scaffold a course, edit content, preview locally, and package for your LMS.

+++
**Start vibe coding →**
:::

:::{grid-item-card} React developers
:link: guides/react-developers/index
:link-type: doc

**You know React.** Compose `Course` / `Lesson` / `Quiz`, wire telemetry and xAPI, theme with `ThemeProvider`, and export with the CLI or `@lessonkit/lxpack`.

+++
**Open developer guides →**
:::

:::{grid-item-card} LessonKit Studio
:link: guides/studio/index
:link-type: doc

**Visual authoring.** Drag-and-drop blocks, live preview, export to React/Vite—try the **[live app](guides/studio/app.md)** in the docs.

+++
**Open Studio →**
:::

::::

:::{admonition} New to React?
:class: note

LessonKit courses are React apps. If you want to learn React before the developer guides, start with **[curated free resources](guides/react-developers/index.md#new-to-react)** (react.dev, TypeScript, Vite), then follow the [quickstart](guides/react-developers/quickstart.md). Prefer to skip React? Use **[vibe coding](guides/vibe-coding/index.md)** instead.
:::

```{raw} html
<div class="lk-callout">
  <strong>Node.js:</strong> 18+ for dev, build, and <code>lessonkit package</code> (LMS export).
</div>
```

## What you need

| Task | Node.js |
| --- | --- |
| Create a course, run `lessonkit dev`, build | **18+** |
| Package for LMS (`lessonkit package`) | **18+** |

Release notes: [changelog](project/changelog.md) on this site · [GitHub](https://github.com/eddiethedean/lessonkit).

(documentation-map)=
## Documentation map

```{toctree}
:maxdepth: 1
:caption: Examples

examples/index
```

```{toctree}
:maxdepth: 2
:caption: Guides — vibe coding

guides/vibe-coding/index
guides/vibe-coding/getting-started
guides/vibe-coding/your-first-course
guides/vibe-coding/prompting-and-workflows
guides/vibe-coding/shipping-to-lms
guides/vibe-coding/troubleshooting
guides/library-skills
```

```{toctree}
:maxdepth: 2
:caption: Guides — React developers

guides/react-developers/index
guides/react-developers/quickstart
guides/react-developers/project-structure
guides/react-developers/components-and-hooks
guides/react-developers/telemetry-and-xapi
guides/react-developers/theming-and-accessibility
guides/react-developers/packaging-and-cli
guides/react-developers/export-parity
guides/react-developers/plugin-cookbook
guides/react-developers/contributing-to-the-monorepo
```

```{toctree}
:maxdepth: 2
:caption: LessonKit Studio

guides/studio/index
guides/studio/app
guides/studio/project-format-v1
guides/studio/editor
guides/studio/export
```

```{toctree}
:maxdepth: 1
:caption: Reference

reference/cli
reference/core
reference/packaging
reference/identity
reference/telemetry
reference/xapi
reference/theming
reference/accessibility
reference/block-catalog
reference/plugins
reference/lxpack-bridge
reference/lxpack-upgrades
```

```{toctree}
:maxdepth: 1
:caption: Project

project/changelog
project/security
project/roadmap
project/studio-readiness
project/studio-spec
project/studio-plan
MIGRATION-0.x-to-1.0
```
