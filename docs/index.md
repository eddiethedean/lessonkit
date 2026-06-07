# LessonKit documentation

```{raw} html
<div class="lk-hero">
  <div class="lk-hero-badges">
    <span class="lk-badge lk-badge--accent">v1.5.0</span>
    <span class="lk-badge">React-first</span>
    <span class="lk-badge">SCORM · xAPI · cmi5</span>
  </div>
  <p class="lk-hero-title">Build learning experiences that ship to your LMS</p>
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

You can map familiar H5P content types to LessonKit components. **`Quiz`** is H5P Multiple Choice; more types are on the roadmap with the same names where possible. Start with **[Coming from H5P?](guides/h5p-for-lessonkit-authors.md)** and the **[H5P capability map](project/h5p-capability-map.md)**.
:::

:::{admonition} New to React?
:class: note

LessonKit courses are React apps. If you want to learn React before the developer guides, start with **[curated free resources](guides/react-developers/index.md#new-to-react)** (react.dev, TypeScript, Vite), then follow [Getting started in 5 minutes](guides/react-developers/getting-started-in-5-minutes.md) or the [quickstart](guides/react-developers/quickstart.md). Prefer to skip React? Use **[vibe coding](guides/vibe-coding/index.md)** instead.
:::

```{raw} html
<div class="lk-callout">
  <strong>Node.js:</strong> <strong>18+</strong> minimum for dev, build, and <code>lessonkit package</code>.
  Use <strong>20.19+</strong> for the CLI scaffold (Vite 8), monorepo CI, and Playwright e2e.
</div>
```

## What you need

| Task | Node.js |
| --- | --- |
| Create a course, run `lessonkit dev`, build, package | **18+** minimum |
| CLI scaffold (Vite 8), monorepo CI, Playwright e2e | **20.19+** recommended |

Release notes: [changelog](project/changelog.md) on this site · [GitHub](https://github.com/eddiethedean/lessonkit).

(documentation-map)=
## Documentation map

```{toctree}
:maxdepth: 1
:caption: Getting started

guides/start-here
```

:::{admonition} Questions?
:class: tip

See the [FAQ](guides/faq.md) or [troubleshooting](guides/react-developers/troubleshooting.md).
:::

```{toctree}
:maxdepth: 1
:caption: FAQ and troubleshooting

guides/faq
guides/react-developers/troubleshooting
guides/vibe-coding/troubleshooting
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
guides/library-skills
```

```{toctree}
:maxdepth: 1
:caption: Guides — H5P authors

guides/h5p-for-lessonkit-authors
H5P_CATALOG_CROSSWALK
```

```{toctree}
:maxdepth: 2
:caption: Guides — React developers

guides/react-developers/index
guides/react-developers/getting-started-in-5-minutes
guides/react-developers/first-lms-export
guides/react-developers/quickstart
guides/react-developers/block-cookbook
guides/react-developers/project-structure
guides/react-developers/components-and-hooks
guides/react-developers/telemetry-and-xapi
guides/react-developers/production-checklist
guides/react-developers/theming-and-accessibility
guides/react-developers/packaging-and-cli
guides/react-developers/deployment-guide
guides/react-developers/export-parity
guides/react-developers/plugin-cookbook
guides/react-developers/contributing-to-the-monorepo
```

```{toctree}
:maxdepth: 1
:caption: Reference

reference/glossary
reference/manifest
reference/api
reference/cli
reference/core
reference/packaging
reference/lms-compatibility
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
:caption: Project and releases

guides/upgrading-lessonkit
MIGRATION-1.4-to-1.5
MIGRATION-1.3-to-1.4
MIGRATION-1.2-to-1.3
MIGRATION-1.1-to-1.2
MIGRATION-1.0-to-1.1
MIGRATION-0.x-to-1.0
project/release-history
guides/enterprise-evaluation
guides/architecture-overview
project/changelog
project/good-first-contributions
project/security
project/accessibility-conformance
project/roadmap
project/h5p-capability-map
```
