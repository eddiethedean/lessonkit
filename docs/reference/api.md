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
| `@lessonkit/core` | `import type { … } from "@lessonkit/core"` | [Core reference](core.md) |
| `@lessonkit/xapi` | `import type { … } from "@lessonkit/xapi"` | [xAPI reference](xapi.md) |

## Machine-readable contracts

| Artifact | Package path |
| --- | --- |
| Block catalog v1–v3 | `@lessonkit/react/block-catalog.v3.json` |
| Block contract v1–v3 | `@lessonkit/react/block-contract.v3.json` |
| Telemetry catalog | `@lessonkit/core/telemetry-catalog.v3.json` |
| Identity contract | `@lessonkit/core/identity-contract.v1.json` |

See [Block catalog](block-catalog.md) and [Glossary](glossary.md) for version naming.

## IDE tips

In a scaffolded course, run `npm run dev` and use **Go to Definition** on imports from `@lessonkit/react`. For headless APIs (`createLessonkitRuntime`, plugins), import from `@lessonkit/core` directly.
