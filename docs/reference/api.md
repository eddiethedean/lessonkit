# API reference

LessonKit publishes **TypeScript declarations** on npm (`dist/*.d.ts`) and documents behavior in the guides below. There is no separate TypeDoc site yet—use these entry points:

## Interactive

| Resource | URL |
| --- | --- |
| **Storybook** (component states) | [GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/) · `npm run storybook` in the monorepo |
| **Live course demos** | [Examples](../examples/index.md) |

## Packages

| Package | Types | Narrative docs |
| --- | --- | --- |
| `@lessonkit/react` | `import type { … } from "@lessonkit/react"` | [Components and hooks](../guides/react-developers/components-and-hooks.md) |
| `@lessonkit/react/blocks` | Block components only (tree-shake friendly) | [Block catalog](block-catalog.md) |
| `@lessonkit/react/testing` | Test reset helpers (`resetQuizWarningsForTests`, …) | [Contributing](../guides/react-developers/contributing-to-the-monorepo.md) |
| `@lessonkit/core` | `import type { … } from "@lessonkit/core"` | [Core reference](core.md) |
| `@lessonkit/core/testing` | Headless test reset helpers | [Contributing](../guides/react-developers/contributing-to-the-monorepo.md) |
| `@lessonkit/xapi` | `import type { … } from "@lessonkit/xapi"` | [xAPI reference](xapi.md) |

### Shared assessment and bridge types

Import from `@lessonkit/core` (re-exported by `@lessonkit/react` where relevant):

| Type | Purpose |
| --- | --- |
| `McqAssessmentProps` | Props shape for `Quiz`, `KnowledgeCheck`, and MCQ-style assessments (replaces deprecated `McqAssessmentDescriptor` from lxpack) |
| `LmsBridgeMode` | `"auto"` \| `"off"` — controls forwarding telemetry to the LXPack parent iframe bridge |

## Machine-readable contracts

| Artifact | Package path |
| --- | --- |
| Block catalog v1–v3 | `@lessonkit/react/block-catalog.v3.json` |
| Block contract v1–v3 | `@lessonkit/react/block-contract.v3.json` |
| Telemetry catalog | `@lessonkit/core/telemetry-catalog.v3.json` |
| Identity contract | `@lessonkit/core/identity-contract.v1.json` |

See [Block catalog](block-catalog.md) and [Glossary](glossary.md) for version naming.

## IDE tips

In a scaffolded course, run `npm run dev` and use **Go to Definition** on imports from `@lessonkit/react`. For headless APIs (`createLessonkitRuntime`, plugins), import from `@lessonkit/core` directly. In tests, prefer `@lessonkit/react/testing` and `@lessonkit/core/testing` over deprecated main-entry reset helpers.
