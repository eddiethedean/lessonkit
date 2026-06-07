# Migrating from LessonKit 1.x to 2.0

LessonKit **2.0** will remove deprecated APIs that still work in **1.5.x** with development warnings. Plan upgrades before pinning `@lessonkit/*@2`.

## Removal checklist

| Deprecated (1.x) | Use instead | Notes |
| --- | --- | --- |
| `runtimeVersion: "v1"` on provider config | Omit or `"v2"` (default) | v2 headless runtime is default since 1.0 |
| `resetTelemetryBuilderWarningsForTests` from `@lessonkit/core` | `@lessonkit/core/testing` | |
| `resetStoragePortForTests` from `@lessonkit/core` | `@lessonkit/core/testing` | |
| `resetSharedVolatileSessionIdForTests` from `@lessonkit/core` | `@lessonkit/core/testing` | |
| `resetQuizWarningsForTests` from `@lessonkit/react` | `@lessonkit/react/testing` | |
| `resetAssessmentWarningsForTests` from `@lessonkit/react` | `@lessonkit/react/testing` | |
| `LxpackBridgeMode` type | `LmsBridgeMode` from `@lessonkit/core` | |
| `parent.lxpack` bridge host alias | `window.parent.lxpackBridge.v1` | |
| `LessonkitPlugin` combined type | `defineTelemetryPlugin`, `defineAssessmentPlugin`, `defineLifecyclePlugin` | |
| `buildBlockCatalogV1()` | `buildBlockCatalog({ version: 1 })` | |
| `LessonkitTheme` type | `LessonkitThemeV1` from `@lessonkit/themes` | |
| `McqAssessmentDescriptor` | `McqAssessmentProps` from `@lessonkit/core` | |
| `AssessmentSequenceProvider` | `CompoundProvider` | |
| `resolveViteBin()` (CLI internals) | `resolveViteJs()` + `process.execPath` | |
| `course.spaDistDir` in `lessonkit.json` | `paths.spaDistDir` | |

## Telemetry namespaces

`Quiz` / `KnowledgeCheck` continue to emit `quiz_*` events in 2.0. Modern assessment blocks emit `assessment_*`. Both map to xAPI and the LMS bridge in 1.5+; no migration required unless you parse raw event names in custom sinks.

## Production observability

2.0 may require additional hooks when LMS bridge mode is `"auto"`. Wire `observability.onLxpackBridgeError` and `onXapiMappingError` before upgrading production courses.

See [CHANGELOG](project/changelog.md) when 2.0 ships.
