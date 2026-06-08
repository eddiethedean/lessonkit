```{raw} html
<div class="lk-hero">
  <div class="lk-hero-badges">
    <span class="lk-badge lk-badge--accent">v{{ release }}</span>
    <span class="lk-badge">React-first</span>
    <span class="lk-badge">SCORM · xAPI · cmi5</span>
  </div>
  <p class="lk-hero-kicker">LessonKit documentation</p>
  <h1 class="lk-hero-title">Build learning experiences that ship to your LMS</h1>
  <p class="lk-lead">LessonKit is a framework for accessible, trackable courses—authored in React, packaged for SCORM and modern learning platforms, with built-in telemetry and xAPI.</p>
  <p>
    <a class="lk-hero-cta" href="guides/react-developers/getting-started-in-5-minutes.html">Build with React →</a>
    <a class="lk-hero-cta" href="guides/vibe-coding/index.html" style="margin-left:0.75rem">Build with AI →</a>
  </p>
  <p style="margin-top:0.75rem"><a href="guides/start-here.html">Not sure? Start here</a></p>
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

::::

:::{admonition} Coming from H5P?
:class: tip

You can map familiar H5P content types to LessonKit components and **rebuild** them as native React blocks—LessonKit does **not** import `.h5p` files or integrate with H5P Hub. Start with **[Coming from H5P?](guides/h5p-for-lessonkit-authors.md)** and the **[H5P capability map](project/h5p-capability-map.md)**.
:::

:::{admonition} New to React?
:class: note

LessonKit courses are React apps. If you want to learn React before the developer guides, start with **[curated free resources](guides/react-developers/index.md#new-to-react)** (react.dev, TypeScript, Vite), then follow [Getting started in 5 minutes](guides/react-developers/getting-started-in-5-minutes.md) or the [quickstart](guides/react-developers/quickstart.md). Prefer to skip React? Use **[vibe coding](guides/vibe-coding/index.md)** instead.
:::

```{raw} html
<div class="lk-callout">
  <strong>Node.js:</strong> Use <strong>{{ node_new_projects }}</strong> for all new projects (<code>lessonkit init</code>, Vite 8).
  Node {{ node_minimum }} may work for packaging-only agents on an existing course — not supported for scaffold.
</div>
```

## What you need

| Task | Node.js |
| --- | --- |
| **`npx @lessonkit/cli init`** (Vite 8 scaffold) | **{{ node_new_projects }}** required |
| Dev, build, package in an existing course | **{{ node_new_projects }}** recommended; {{ node_minimum }} minimum (packaging-only legacy) |
| Monorepo CI and Playwright e2e | **{{ node_recommended }}** (CI runs Node 20 only) |

See [Prerequisites](guides/prerequisites.md) for details.

Release notes: [changelog](project/changelog.md) on this site · [GitHub](https://github.com/eddiethedean/lessonkit).

(documentation-map)=
## Documentation map

```{toctree}
:maxdepth: 1
:caption: Getting started

guides/start-here
guides/prerequisites
guides/design-philosophy
```

:::{admonition} Questions?
:class: tip

See the [FAQ](guides/faq.md) or [troubleshooting hub](guides/troubleshooting.md).
:::

```{toctree}
:maxdepth: 1
:caption: FAQ and troubleshooting

guides/faq
guides/troubleshooting
```

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
:maxdepth: 1
:caption: Guides — H5P authors

guides/h5p-for-lessonkit-authors
```

```{toctree}
:maxdepth: 2
:caption: Guides — React developers

guides/react-developers/index
guides/react-developers/getting-started-in-5-minutes
guides/react-developers/lms-go-live
guides/react-developers/first-lms-export
guides/react-developers/ship-to-lms
guides/react-developers/troubleshooting
guides/react-developers/quickstart
guides/react-developers/block-cookbook
guides/react-developers/project-structure
guides/react-developers/components-and-hooks
guides/react-developers/telemetry-and-xapi
guides/react-developers/theming-and-accessibility
guides/react-developers/packaging-and-cli
guides/react-developers/deployment-guide
guides/react-developers/lrs-operations
guides/react-developers/multi-course-patterns
guides/react-developers/performance
guides/react-developers/plugin-cookbook
guides/react-developers/contributing-to-the-monorepo
guides/react-developers/adding-a-framework-block
guides/plugin-marketplace-research
```

```{toctree}
:maxdepth: 1
:caption: Reference

reference/glossary
reference/manifest
reference/interchange
reference/api
reference/cli
reference/cli-errors
reference/core
reference/packaging
reference/lms-compatibility
reference/identity
reference/telemetry
reference/xapi
reference/theming
reference/accessibility
reference/block-catalog
reference/components/index
reference/storybook-gallery
reference/plugins
reference/lxpack-bridge
reference/lxpack-upgrades
```

```{toctree}
:maxdepth: 1
:caption: Evaluators

guides/enterprise-evaluation
guides/architecture-overview
guides/react-developers/production-checklist
guides/react-developers/export-parity
project/security
project/accessibility-conformance
```

```{toctree}
:maxdepth: 1
:caption: Project and releases

guides/upgrading-lessonkit
project/release-history
project/changelog
project/good-first-contributions
project/roadmap
project/h5p-capability-map
```
