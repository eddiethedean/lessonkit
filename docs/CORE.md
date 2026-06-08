# `@lessonkit/core` reference (1.6.x)

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
import { createFetchBatchSink } from "@lessonkit/xapi";

const { batchSink, exitBatchSink } = createFetchBatchSink({ url: "/api/telemetry/batch" });

const client = createTrackingClient({
  batchSink,
  exitBatchSink,
  batch: { enabled: true, flushIntervalMs: 5000, maxBatchSize: 50 },
});
```

For local debugging only, a per-event `sink` or `console.log` is fine; production courses should use batched delivery and [observability hooks](../guides/react-developers/production-checklist.md).

### Catalog

- `TELEMETRY_EVENT_CATALOG`, `buildTelemetryCatalog()` / `buildTelemetryCatalogV3()`, `telemetryCatalogVersion` (v1) and `telemetryCatalogV3Version` (v3, default runtime catalog in 1.2+)
- JSON: `@lessonkit/core/telemetry-catalog.v3.json` (v1/v2 files retained for older generators)

See [Telemetry reference](reference/telemetry.md).

## Headless runtime

`createLessonkitRuntime` powers `@lessonkit/react` when `runtimeVersion` is `"v2"` (the default in 1.0):

```typescript
import { createLessonkitRuntime } from "@lessonkit/core";

const runtime = createLessonkitRuntime({
  courseId: "my-course",
  runtimeVersion: "v2",
  session: { sessionId: "…", attemptId: "…" },
  plugins: [defineTelemetryPlugin({ id: "…", version: "1", kind: "analytics", onTelemetry: (e) => e })],
});

runtime.setActiveLesson("intro", emitLifecycle);
runtime.completeLesson("intro", emitLifecycle);
runtime.completeCourse(emitLifecycle);
```

Exports: `createProgressController`, `buildPluginContext`, session helpers (`resolveSessionId`, `hasCourseStarted`, …), and course lifecycle helpers in `runtime/courseLifecycle`. Plugin hooks run on `runtime.track` and lifecycle emits; call `runtime.dispose()` when tearing down a headless instance.

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

## Compound state and resume

Compound blocks (`InteractiveBook`, `SlideDeck`, `InteractiveVideo`, `BranchingScenario`) persist navigation and child assessment state in `sessionStorage` when `config.session.persistCompoundState` is true (default).

### Storage helpers

```typescript
import {
  compoundStateStorageKey,
  loadCompoundState,
  saveCompoundState,
  clearCompoundState,
} from "@lessonkit/core";

const key = compoundStateStorageKey("my-course", "safety-book");
const saved = loadCompoundState(storagePort, key);
saveCompoundState(storagePort, key, { pageIndex: 2, childState: { /* ... */ } });
clearCompoundState(storagePort, key);
```

### Resume state shape

```typescript
import {
  createCompoundResumeState,
  parseCompoundResumeState,
  clampCompoundPageIndex,
} from "@lessonkit/core";

const state = createCompoundResumeState({ pageIndex: 0, pageCount: 5 });
const parsed = parseCompoundResumeState(JSON.parse(raw)); // null if invalid
const index = clampCompoundPageIndex(7, 5); // 4
```

`CompoundResumeState` includes `pageIndex`, optional `childState` map, and extension `meta` for compound-specific fields (for example video time or branch path).

### Branching scenario meta

`BranchingScenario` stores branch resume under meta key `__lk_bs__` (active node id, visited nodes). Sessions saved before framework **1.5.0** without this meta restart at `startNodeId`.

### Branch graph validation

```typescript
import { validateBranchGraph } from "@lessonkit/core";

const result = validateBranchGraph([
  { id: "start", choices: [{ targetId: "end", label: "Finish" }] },
  { id: "end", choices: [] },
]);
// result.ok === true; result.issues lists cycles, orphans, missing startNodeId
```

### Allowlists

`getAllowedChildTypes(parent)` and `isChildTypeAllowed(parent, childType)` enforce catalog nesting rules (for example `Page` inside `InteractiveBook`, `TimedCue` inside `InteractiveVideo`). See [Block catalog](reference/block-catalog.md).

### CompoundHandle (React)

Compound containers implement `CompoundHandle` for parent scoring and navigation: `getScore()`, `getMaxScore()`, `resetTask()`, `showSolutions()`, etc. See [Components and hooks](../guides/react-developers/components-and-hooks.md).
