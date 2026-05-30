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

Deprecated aliases `buildTrackEvent` / `tryBuildTrackEvent` were removed in **1.0.0**.

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

`defineLessonkitPlugin` and `createPluginHost` were removed in **1.0.0**; use `defineTelemetryPlugin` (etc.) and `createPluginRegistry`.

### Headless runtime

```typescript
import { createLessonkitRuntime } from "@lessonkit/core";

const runtime = createLessonkitRuntime({ courseId: "my-course", runtimeVersion: "v2" });
```

## `@lessonkit/react`

### Config

- `runtimeVersion: "v2"` is the default headless runtime in **1.0.0** (set `"v1"` to opt out).
- `sinks?: TelemetryPipelineSink[]` registers additional pipeline sinks alongside `tracking` / `xapi`.
- `tracking` and `xapi` config remain the primary ergonomics for analytics and xAPI transport.

### Bridge

Import bridge utilities from `@lessonkit/lxpack/bridge` instead of duplicating in app code:

```typescript
import { forwardTelemetryToBridge, dispatchBridgeAction } from "@lessonkit/lxpack/bridge";
```

`setLxpackBridgeMode` (global) was removed in **1.0.0**. Use provider config and per-call bridge mode instead:

```typescript
// Provider (default "auto")
<Course
  courseId="my-course"
  config={{ lxpack: { bridge: "auto" } }} // or "off"
>
```

For manual forwarding outside the provider pipeline, pass mode to `forwardTelemetryToBridge(event, mode)` from `@lessonkit/lxpack/bridge`. See [LXPack bridge reference](LXPACK_BRIDGE.md).

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
