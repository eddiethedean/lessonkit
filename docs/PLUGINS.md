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
2. **Setup** — `setup(ctx)` runs once per provider mount (`ctx` includes `courseId`, `sessionId`, `attemptId`).
3. **Runtime** — telemetry flows through `onTelemetry` (return `null` to drop an event), then tracking/xAPI/LXPack bridge.
4. **Dispose** — `dispose()` runs in reverse registration order on unmount.

## Constraints (v1)

- Plugins are **bundled with your app** (static import). Dynamic loading and a marketplace are post–Studio 1.0.
- `onTelemetry` is **synchronous**; keep work fast or enqueue to your own service.
- Custom **interaction** blocks require you to render React components; `interactionBlocks` is metadata for tooling.
- Plugins must use **stable `id`** strings (reverse-DNS recommended, e.g. `com.example.analytics`).

## API surface

Types and helpers live in `@lessonkit/core` (re-exported from `@lessonkit/react`):

- `LessonkitPlugin`, `LessonkitPluginKind`, `LessonkitPluginContext`
- `createPluginHost()`, `defineLessonkitPlugin()`
- `useLessonkit().plugins` — the active `PluginHost` (or `null`)

## Example

```ts
import { defineLessonkitPlugin } from "@lessonkit/react";

const myAnalytics = defineLessonkitPlugin({
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
