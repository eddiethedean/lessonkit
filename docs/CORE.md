# `@lessonkit/core` reference (1.0)

Headless runtime, telemetry pipeline, plugins, identity, and session helpers shared across LessonKit packages.

## Identity

- `validateId`, `assertValidId`, `slugifyId`, `deriveId`, `buildLessonkitUrn`
- Machine-readable contract: `@lessonkit/core/identity-contract.v1.json`

See [Identity reference](reference/identity.md).

## Telemetry

### Event builder

```typescript
import { buildTelemetryEvent, tryBuildTelemetryEvent } from "@lessonkit/core";

const event = buildTelemetryEvent({
  name: "lesson_completed",
  courseId: "my-course",
  lessonId: "intro",
  sessionId: "…",
  data: { lessonId: "intro", durationMs: 1200 },
});
```

`tryBuildTelemetryEvent` returns `null` for quiz events when no `lessonId` is available (instead of throwing).

### Pipeline

Register sinks explicitly for custom fan-out:

```typescript
import {
  createTelemetryPipeline,
  createTrackingPipelineSink,
  type TelemetryPipelineSink,
} from "@lessonkit/core";

const pipeline = createTelemetryPipeline([
  createTrackingPipelineSink("analytics", (event) => sink(event)),
  {
    id: "custom",
    emit(event) {
      /* … */
    },
  },
]);

pipeline.emit(event);
```

`@lessonkit/react` routes provider telemetry through an internal pipeline (tracking, xAPI, LXPack bridge) and accepts extra sinks via `config.sinks`.

### Tracking client

```typescript
import { createTrackingClient } from "@lessonkit/core";

const client = createTrackingClient({
  sink: (event) => console.log(event),
  batch: { enabled: true, flushIntervalMs: 5000, maxBatchSize: 50 },
  batchSink: (events) => sendBatch(events),
});
```

### Catalog

- `TELEMETRY_EVENT_CATALOG`, `buildTelemetryCatalog()`, `telemetryCatalogVersion`
- JSON: `@lessonkit/core/telemetry-catalog.v1.json`

See [Telemetry reference](reference/telemetry.md).

## Headless runtime

`createLessonkitRuntime` powers `@lessonkit/react` when `runtimeVersion` is `"v2"` (the default in 1.0):

```typescript
import { createLessonkitRuntime } from "@lessonkit/core";

const runtime = createLessonkitRuntime({
  courseId: "my-course",
  runtimeVersion: "v2",
  session: { sessionId: "…", attemptId: "…" },
});

runtime.setActiveLesson("intro", emitLifecycle);
runtime.completeLesson("intro", emitLifecycle);
runtime.completeCourse(emitLifecycle);
```

Exports: `createProgressController`, session helpers (`resolveSessionId`, `hasCourseStarted`, …), and course lifecycle helpers in `runtime/courseLifecycle`.

## Plugins

Segregated plugin types and registry:

```typescript
import {
  createPluginRegistry,
  defineTelemetryPlugin,
  defineAssessmentPlugin,
  defineLifecyclePlugin,
} from "@lessonkit/core";

const registry = createPluginRegistry([
  defineTelemetryPlugin({
    id: "com.example.analytics",
    version: "1.0.0",
    kind: "analytics",
    onTelemetry: (event) => event,
  }),
]);
```

See [Plugins reference](reference/plugins.md) and [LXPack bridge reference](reference/lxpack-bridge.md).

## Ports

Testable abstractions: `createSessionStoragePort`, `createDefaultClock`, `createGlobalTimer`, `createNoopStorage`.
