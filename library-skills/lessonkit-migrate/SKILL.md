---
name: lessonkit-migrate
description: >-
  Migrate LessonKit projects from 0.9.x to 1.0 — buildTelemetryEvent, plugin registry,
  runtimeVersion v2, lxpack bridge config, removed APIs. Use when upgrading deps or
  fixing breaking changes after @lessonkit/* 1.0.0.
license: Apache-2.0
metadata:
  lessonkit-version: "1.0.1"
---

# LessonKit 0.9.x → 1.0 migration

## Dependency pins

```json
"@lessonkit/react": "^1.0.1",
"@lessonkit/core": "^1.0.1",
"@lessonkit/cli": "^1.0.1"
```

Run `lessonkit build` and fix TypeScript errors before packaging.

## Breaking API removals

| Removed | Replacement |
|---------|-------------|
| `buildTrackEvent` / `tryBuildTrackEvent` | `buildTelemetryEvent` / `tryBuildTelemetryEvent` from `@lessonkit/core` |
| `defineLessonkitPlugin` | `defineTelemetryPlugin`, `defineAssessmentPlugin`, `defineLifecyclePlugin` |
| `createPluginHost` | `createPluginRegistry` |
| `setLxpackBridgeMode` | `config.lxpack.bridge` or `forwardTelemetryToBridge(event, mode)` |

## Runtime

- Default `runtimeVersion: "v2"` (headless runtime in core).
- Opt out: `runtimeVersion: "v1"` on provider config.

## Import paths

Do not import from `@lessonkit/react/runtime/*` — use package root or `@lessonkit/core`.

Full checklist: `references/checklist.md`  
Human guide: https://lessonkit.readthedocs.io/en/latest/MIGRATION-0.x-to-1.0.html

## Do not

- Bump to 1.0.0 without updating plugin and telemetry call sites
- Expect `wrapTrackingSink` to skip batched `batchSink` (fixed in 1.0.0 — wrappers apply on flush)
