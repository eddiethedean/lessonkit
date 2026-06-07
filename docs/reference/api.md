# API reference

LessonKit publishes **TypeScript declarations** on npm (`dist/*.d.ts`) and documents behavior in the guides below.

## Generated API (TypeDoc)

Browse generated TypeScript API docs (built with the docs site on Read the Docs):

| Package | Generated reference |
| --- | --- |
| `@lessonkit/react` | [TypeDoc — react](../_static/typedoc/modules/react_dist.html) |
| `@lessonkit/core` | [TypeDoc — core](../_static/typedoc/modules/core_dist.html) |
| `@lessonkit/cli` | [TypeDoc — cli](../_static/typedoc/modules/cli_dist.html) |

Full index: [TypeDoc home](../_static/typedoc/index.html).

Monorepo maintainers regenerate locally: `npm run docs:api` (requires `npm run build:packages` first).

Also use:

1. **IDE** — `Go to Definition` on `@lessonkit/react` imports in a scaffolded project
2. **Storybook** — component states and props visually
3. **Narrative guides** — [Components and hooks](../guides/react-developers/components-and-hooks.md) · [Block catalog](block-catalog.md)

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

### Production guardrails

| API | Package | Purpose |
| --- | --- | --- |
| `assertProductionCourseConfig(config)` | `@lessonkit/react` | Throws in production when console telemetry/xAPI sinks, tracking enabled without delivery, or required observability hooks are missing |
| `shouldEnforceProductionGuard()` | `@lessonkit/react` | Returns false in test mode (`import.meta.env.MODE === "test"`) even when `NODE_ENV=production` |
| `onXapiTransportError` | `config.observability` | Required when xAPI delivery is configured; called when transport fails after retries (statement re-queued) |

See the [production checklist](../guides/react-developers/production-checklist.md) for the full observability hook matrix (1–6 hooks depending on tracking/xAPI configuration).

### Framework 1.5 blocks

Export from `@lessonkit/react`: `BranchingScenario`, `BranchNode`, `BranchChoice`, `Embed`, `Chart`, `useBranchingScenario`. See [Block catalog — 1.5](block-catalog.md#catalog-v3-additions-framework-150) and [Migration 1.4 → 1.5](../MIGRATION-1.4-to-1.5.md).

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
