# LessonKit plugin architecture (v1)

LessonKit plugins extend the runtime without forking `@lessonkit/react`. They register on
`LessonkitProvider` via `config.plugins` and run in a deterministic order.

## Plugin kinds

| Kind | Purpose | Typical hooks |
|------|---------|----------------|
| `analytics` | Forward or transform telemetry | `onTelemetry`, `wrapTrackingSink`, `onTelemetryBatch` |
| `lms` | LMS-specific session/completion (future) | `setup`, `onTelemetry` |
| `assessment` | Custom scoring engines | `scoreAssessment` |
| `interaction` | Declare custom block types | `interactionBlocks` |
| `ai` | AI-assisted flows (future) | `onTelemetry`, custom setup |

## Lifecycle

1. **Register** — pass `plugins: LessonkitPlugin[]` on `LessonkitProvider` / `<Course config={…}>`.
2. **Setup** — `setup(ctx)` runs when the provider mounts and when `courseId`, `session.sessionId`, `session.attemptId`, or `session.user` changes (`ctx` includes `courseId`, `sessionId`, `attemptId`).
3. **Runtime** — telemetry flows through `onTelemetry` in **registration order** (return `null` to drop an event for delivery; downstream plugins’ `onTelemetry` hooks are not called after a `null`). Register **filters before enrichers**. Then tracking/xAPI/LXPack bridge.
4. **Dispose** — `dispose()` runs in reverse registration order on unmount.

## Constraints (v1)

- Plugins are **bundled with your app** (static import). Dynamic loading and a marketplace are post–Studio 1.0.
- `onTelemetry` is **synchronous**; keep work fast or enqueue to your own service.
- Custom **interaction** blocks require you to render React components; `interactionBlocks` is metadata for tooling.
- Plugins must use **stable `id`** strings (reverse-DNS recommended, e.g. `com.example.analytics`).
- `onTelemetryBatch` runs when you configure `tracking.batchSink` (the provider wraps your batch sink and applies `wrapTrackingSink` per event before your `batchSink`). Batched flushes that only use `tracking.sink` do not invoke `onTelemetryBatch`.
- If both `tracking.sink` and `tracking.batchSink` are set, **flushed batches use only `batchSink`** (per-event `sink` is not called for buffered events).

## API surface

Types and helpers live in `@lessonkit/core` (re-exported from `@lessonkit/react`):

- `LessonkitPlugin`, `LessonkitPluginKind`, `LessonkitPluginContext`
- `createPluginRegistry()`, `defineTelemetryPlugin()`, `defineAssessmentPlugin()`, `defineLifecyclePlugin()`
- `useLessonkit().plugins` — the active `PluginRegistry` (or `null`)

## Example

```ts
import { defineTelemetryPlugin } from "@lessonkit/react";

const myAnalytics = defineTelemetryPlugin({
  id: "com.example.analytics",
  version: "1.0.0",
  kind: "analytics",
  onTelemetry(event) {
    if (event.name === "course_completed") {
      void fetch("/api/telemetry", {
        method: "POST",
        body: JSON.stringify(event),
      });
    }
    return event;
  },
});

<Course courseId="my-course" config={{ plugins: [myAnalytics] }}>…</Course>
```

See [Plugin cookbook](guides/react-developers/plugin-cookbook.md) for a full walkthrough.
