---
name: lessonkit-telemetry
description: >-
  Wire LessonKit 1.6.x telemetry, xAPI, plugins, and LXPack bridge — LessonkitProvider
  config, tracking sinks, batchSink, defineTelemetryPlugin, runtimeVersion v2.
  Use when adding analytics, LRS, SCORM completion, or custom plugins.
license: Apache-2.0
metadata:
  lessonkit-version: "1.6.6"
---

# LessonKit telemetry and plugins

## Provider config (`Course` / `LessonkitProvider`)

```tsx
<Course
  courseId="my-course"
  config={{
    runtimeVersion: "v2", // default in 1.0.0
    tracking: {
      sink: (event) => { /* per-event */ },
      batch: { enabled: true, flushIntervalMs: 5000 },
      batchSink: (events) => { /* batch HTTP */ },
    },
    xapi: {
      enabled: true,
      transport: (statement) => sendToLrs(statement),
    },
    lxpack: { bridge: "auto" }, // forward to parent lxpackBridge when packaged
    plugins: [myAnalyticsPlugin],
    sinks: [], // extra TelemetryPipelineSink[]
  }}
>
```

## Event builder (1.0)

```typescript
import { buildTelemetryEvent } from "@lessonkit/core";
```

Removed: `buildTrackEvent`, `defineLessonkitPlugin`, `setLxpackBridgeMode`.

## Plugins (1.0)

```typescript
import { defineTelemetryPlugin, defineAssessmentPlugin, defineLifecyclePlugin } from "@lessonkit/react";

defineTelemetryPlugin({
  id: "com.example.analytics",
  version: "1.0.0",
  kind: "analytics",
  onTelemetry: (event) => event, // return null to drop
  wrapTrackingSink: (sink, ctx) => (event) => sink(event),
  onTelemetryBatch: (events, ctx) => { /* when batchSink configured */ },
});
```

- Register **filters before enrichers** — `onTelemetry` returning `null` stops downstream plugins.
- `wrapTrackingSink` runs on **both** per-event `sink` and batched `batchSink` flushes.
- `setup` / `dispose` re-run when `session.user` changes.

Details: `references/plugins.md`

## LXPack bridge

When embedded in a package, completion/scores forward to `window.parent.lxpackBridge.v1`.

- Config: `lxpack.bridge: "auto" | "off"`
- Low-level: `forwardTelemetryToBridge` from `@lessonkit/lxpack/bridge`

Details: `references/bridge.md`

## Catalog

Event names and payloads: `@lessonkit/core/telemetry-catalog.v3.json`  
Human reference: https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html

## Do not

- Use `createPluginHost` or monolithic `defineLessonkitPlugin`
- Set global bridge mode — use provider config or per-call bridge mode
- Assume `onTelemetryBatch` runs when only `tracking.sink` is set (needs `batchSink` for batch hook)
