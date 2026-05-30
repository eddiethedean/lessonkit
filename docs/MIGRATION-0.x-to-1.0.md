# Migrating from LessonKit 0.9.x to 1.0

This guide covers breaking and structural changes from the **0.9.x** line to **1.0.0** after the SOLID refactor.

## Summary

| Area | 0.9.x | 1.0 |
|------|-------|-----|
| Telemetry event builder | `@lessonkit/react` `buildTrackEvent` | `@lessonkit/core` `buildTelemetryEvent` |
| Telemetry fan-out | Hardcoded in `emitTelemetry` | `TelemetryPipeline` + `TelemetryPipelineSink` |
| Plugins | Monolithic `LessonkitPlugin` | Segregated `TelemetryPlugin`, `AssessmentPlugin`, `LifecyclePlugin` + `PluginRegistry` |
| Headless runtime | Embedded in `LessonkitProvider` | `@lessonkit/core` `createLessonkitRuntime` |
| LXPack bridge | Duplicate logic in react + lxpack | `@lessonkit/lxpack/bridge` `dispatchBridgeAction` |
| Project manifest | Parsed in CLI only | `@lessonkit/lxpack` `parseLessonkitManifest` |
| Packaging | Monolithic `packageLessonkitCourse` | Staged `validatePackageInputs`, `remapArtifactPaths` |

## `@lessonkit/core`

### Telemetry builder

```typescript
// Before (react internal)
import { buildTrackEvent } from "@lessonkit/react/runtime/emitTelemetry";

// After
import { buildTelemetryEvent } from "@lessonkit/core";
```

Deprecated aliases `buildTrackEvent` / `tryBuildTrackEvent` remain in 1.0-beta and are removed in 1.0.

### Telemetry pipeline

Register sinks explicitly:

```typescript
import { createTelemetryPipeline, createTrackingPipelineSink } from "@lessonkit/core";

const pipeline = createTelemetryPipeline([
  createTrackingPipelineSink("analytics", (event) => sink(event)),
]);
pipeline.emit(event);
```

### Plugins

Prefer narrow plugin helpers:

```typescript
import { defineTelemetryPlugin, defineAssessmentPlugin } from "@lessonkit/core";

defineTelemetryPlugin({ id: "x", version: "1", kind: "analytics", onTelemetry: (e) => e });
defineAssessmentPlugin({ id: "y", version: "1", kind: "assessment", scoreAssessment: () => null });
```

`defineLessonkitPlugin` and `createPluginHost` remain as deprecated wrappers; use `createPluginRegistry`.

### Headless runtime

```typescript
import { createLessonkitRuntime } from "@lessonkit/core";

const runtime = createLessonkitRuntime({ courseId: "my-course", runtimeVersion: "v2" });
```

## `@lessonkit/react`

### Config

- `runtimeVersion: "v2"` opts into the headless runtime adapter (default `"v1"` during beta).
- `sinks?: TelemetryPipelineSink[]` registers additional pipeline sinks.

Legacy `tracking` / `xapi` config shims are deprecated in 1.0-beta and removed in 1.0.

### Bridge

Import bridge utilities from `@lessonkit/lxpack/bridge` instead of duplicating in app code:

```typescript
import { forwardTelemetryToBridge, dispatchBridgeAction } from "@lessonkit/lxpack/bridge";
```

## `@lessonkit/lxpack`

### Manifest loading

```typescript
import { parseLessonkitManifest } from "@lessonkit/lxpack";

const result = parseLessonkitManifest(json, "lessonkit.json", projectRoot);
```

### Packaging stages

```typescript
import { validatePackageInputs, remapArtifactPaths } from "@lessonkit/lxpack";
```

## `@lessonkit/cli`

No command changes. `loadLessonkitJson` delegates to `@lessonkit/lxpack` manifest parsing.

## Testing checklist

- `npm test` — all workspace unit tests
- `npm run test:integration` — CLI init → build → package
- `npm run test:e2e` — Playwright export parity
- `npm run conformance:lxpack` — LMS target matrix

## Semver path

Refactor phases ship as **0.10.0-alpha.x**, then **1.0.0-beta.x**, then **1.0.0**.
