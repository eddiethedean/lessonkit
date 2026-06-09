# API reference

LessonKit publishes **TypeScript declarations** on npm (`dist/*.d.ts`) and documents behavior in the guides below.

:::{admonition} Guides vs reference
:class: note

| Read this when… | Start here |
| --- | --- |
| Learning workflows (first course, LMS export, theming) | [React developer guides](../guides/react-developers/index.md) |
| Validating props, IDs, manifest fields, CLI flags | Reference pages on this site (below) + [Block catalog](block-catalog.md) |
| TypeScript signatures only | [TypeDoc](#generated-api-typedoc) (built on Read the Docs; regenerate locally with `npm run docs:api`) |

TypeDoc lists **signatures** — parameter descriptions and examples expand release over release. For behavior, prefer narrative guides first, then reference contracts.

**Before opening a GitHub issue for API usage:** Check [Components and hooks](../guides/react-developers/components-and-hooks.md), the relevant [component page](components/index.md), and narrative references below. TypeDoc signatures alone are not the supported learning path for runtime behavior.
:::

## Generated API (TypeDoc)

Browse generated TypeScript API docs (built with the docs site on Read the Docs):

| Package | Generated reference |
| --- | --- |
| `@lessonkit/react` | [TypeDoc — react](../_static/typedoc/modules/react_dist.html) |
| `@lessonkit/react/blocks` | [TypeDoc — react/blocks](../_static/typedoc/modules/react_dist_blocks-entry.html) |
| `@lessonkit/react/testing` | [TypeDoc — react/testing](../_static/typedoc/modules/react_dist_testing.html) |
| `@lessonkit/core` | [TypeDoc — core](../_static/typedoc/modules/core_dist.html) |
| `@lessonkit/core/testing` | [TypeDoc — core/testing](../_static/typedoc/modules/core_dist_testing.html) |
| `@lessonkit/cli` | [TypeDoc — cli](../_static/typedoc/modules/cli_dist.html) |
| `@lessonkit/xapi` | [TypeDoc — xapi](../_static/typedoc/modules/xapi_dist.html) |
| `@lessonkit/lxpack` | [TypeDoc — lxpack](../_static/typedoc/modules/lxpack_dist.html) |
| `@lessonkit/lxpack/bridge` | [TypeDoc — lxpack/bridge](../_static/typedoc/modules/lxpack_dist_bridge.html) |
| `@lessonkit/themes` | [TypeDoc — themes](../_static/typedoc/modules/themes_dist.html) |
| `@lessonkit/accessibility` | [TypeDoc — accessibility](../_static/typedoc/modules/accessibility_dist.html) |

Full index: [TypeDoc home](../_static/typedoc/index.html).

Monorepo maintainers regenerate locally: `npm run build:packages && npm run docs:api`. TypeDoc output lives under `docs/_static/typedoc/` and is **generated on Read the Docs** — local Sphinx builds show broken TypeDoc links until you run `docs:api`. See [Contributing — TypeDoc generation](../guides/react-developers/contributing-to-the-monorepo.md#typedoc-api-docs).

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
| `@lessonkit/react/testing` | Test reset helpers (see table below) | [Contributing](../guides/react-developers/contributing-to-the-monorepo.md) |
| `@lessonkit/core` | `import type { … } from "@lessonkit/core"` | [Core reference](core.md) |
| `@lessonkit/core/testing` | Headless test reset helpers (see table below) | [Contributing](../guides/react-developers/contributing-to-the-monorepo.md) |
| `@lessonkit/xapi` | `import type { … } from "@lessonkit/xapi"` | [xAPI reference](xapi.md) |
| `@lessonkit/lxpack` | Packaging API | [Packaging reference](packaging.md) |
| `@lessonkit/themes` | Theme presets and tokens | [Theming reference](theming.md) |
| `@lessonkit/accessibility` | Focus and motion utilities | [Accessibility reference](accessibility.md) |

### `@lessonkit/react/testing` exports

| Export | Purpose |
| --- | --- |
| `resetQuizWarningsForTests` | Clear Quiz dev warnings between tests |
| `resetAssessmentWarningsForTests` | Clear assessment guard warnings |
| `resetLessonMountRegistryForTests` | Reset lesson mount registry |
| `resetCompoundValidationWarningsForTests` | Clear compound child validation warnings |
| `resetLessonkitProviderStorageForTests` | Clear session storage used by provider |
| `resetCourseStartedTrackingFlightForTests` | Reset course_started delivery flight state |

### `@lessonkit/core/testing` exports

| Export | Purpose |
| --- | --- |
| `resetTelemetryBuilderWarningsForTests` | Clear telemetry builder dev warnings |
| `resetStoragePortForTests` | Reset default storage port |
| `resetSharedVolatileSessionIdForTests` | Reset tab session id helper state |
| `resetCourseStartedEmitFlightForTests` | Reset headless course_started emit flight |

Prefer these subpaths over deprecated main-entry reset helpers.

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

### Framework 1.6 blocks

Export from `@lessonkit/react` / `@lessonkit/react/blocks` (catalog v3, framework **1.6.0+**):

| Block | Role |
| --- | --- |
| `Table`, `Timeline`, `ImageJuxtaposition`, `ImageSequence`, `Collage`, `AudioRecorder`, `QrContent`, `AdventCalendar` | Content |
| `CombinationLock`, `Crossword`, `WordSearch` | Assessment (`checkId` required) |
| `GameMap`, `MapStage`, `MapExit` | Compound (spatial map; `blockId` on container) |

Full prop contracts: [Block catalog — 1.6.0](block-catalog.md#catalog-v3-additions-framework-160) · [generated prop tables](block-catalog.md#generated-prop-reference-catalog-v3). Discover blocks from CLI: `lessonkit blocks list --json`.

### Framework 1.7 blocks

Export from `@lessonkit/react` / `@lessonkit/react/blocks` (catalog v3, framework **1.7.0+**):

| Block | Role |
| --- | --- |
| `SortParagraphs`, `GuessTheAnswer`, `MultimediaChoice` | Assessment (`checkId` required) |
| `SingleChoiceSet` | Compound (child `Quiz` / `KnowledgeCheck` only) |

**Quiz / `KnowledgeCheck` variants:** `answers`, `shuffleChoices`, `shuffleSeed`, `choiceFeedback` — see [Migration 1.6 → 1.7](../MIGRATION-1.6-to-1.7.md).

Full prop contracts: [Block catalog — 1.7.0](block-catalog.md#catalog-v3-additions-framework-170) · [generated prop tables](block-catalog.md#generated-prop-reference-catalog-v3).

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
