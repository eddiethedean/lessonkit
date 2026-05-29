# React developer guides

:::{admonition} Who this is for
:class: tip

Developers comfortable with **React, TypeScript, and npm** who want full control of components, telemetry, theming, and LMS export.
:::

These guides assume you are comfortable with **React, TypeScript, and npm**. You will integrate LessonKit into apps you own or scaffold with the CLI.

## What LessonKit gives you

- **Components** — `Course`, `Lesson`, `Scenario`, `Quiz`, `Reflection`, `ProgressTracker`
- **Runtime** — `LessonkitProvider` with progress, telemetry batching, xAPI client lifecycle
- **Packages** — `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/themes`, `@lessonkit/accessibility`, `@lessonkit/lxpack`
- **Tooling** — `@lessonkit/cli` for init/dev/build/package and `lessonkit.json` as the packaging manifest

## Guide outline

| Topic | Page |
| --- | --- |
| Quickstart | [quickstart.md](quickstart.md) |
| Project structure | [project-structure.md](project-structure.md) |
| Components & hooks | [components-and-hooks.md](components-and-hooks.md) |
| Telemetry & xAPI | [telemetry-and-xapi.md](telemetry-and-xapi.md) |
| Theming & a11y | [theming-and-accessibility.md](theming-and-accessibility.md) |
| Packaging & CLI | [packaging-and-cli.md](packaging-and-cli.md) |
| Monorepo | [contributing-to-the-monorepo.md](contributing-to-the-monorepo.md) |

## Identity requirements (0.5+)

- `courseId` required on `Course` / `LessonkitProvider`
- `lessonId` required on `Lesson`
- `checkId` required on `Quiz` / `KnowledgeCheck`

Align IDs with `lessonkit.json` and your LXPack descriptor. See [Identity reference](../../reference/identity.md).

## Other audience

Instructional designers using AI assistants should start with [Vibe coding guides](../vibe-coding/index.md).
