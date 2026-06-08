# Migrating off runtime v1 (LessonKit 2.0)

`runtimeVersion: "v1"` on `LessonkitConfig` is **deprecated** as of framework 1.4.0 and will be **removed in LessonKit 2.0**.

## What changes in v2 (default)

- Headless `createLessonkitRuntime()` coordinates lifecycle (`setActiveLesson`, `completeLesson`, `completeCourse`) and plugin registration.
- `LessonkitProvider` uses the v2 runtime internally unless you opt into v1.

## Action for course authors

1. **Remove** `runtimeVersion: "v1"` from `courseConfig` / `LessonkitProvider` config.
2. Use `Course` + `config` props (or `LessonkitProvider`) — do not depend on v1-only telemetry batching quirks.
3. Wire production [observability hooks](guides/react-developers/production-checklist.md) (`onLxpackBridgeMiss`, `onTelemetrySinkError`, etc.).

## Deprecated aliases removed in 2.0 (plan)

| API | Replacement |
| --- | --- |
| `runtimeVersion: "v1"` | Omit (v2 default) |
| `parent.lxpack` bridge host | `parent.lxpackBridge.v1` |
| `LxpackBridgeMode` type alias | `LmsBridgeMode` from `@lessonkit/core` |
| `McqAssessmentDescriptor` | `AssessmentDescriptor` with `kind: "mcq"` |
| `AssessmentSequenceProvider` | `CompoundProvider` |
| `buildBlockCatalogV1()` | `buildBlockCatalog({ version: 1 })` |
| `KnowledgeCheck` component | `Quiz` |

## CI / a11y

Automated accessibility checks run in e2e against the golden Vite preview (axe-core). Expand to compound examples in 2.x.
