# xAPI reference (`@lessonkit/xapi`)

Statement generation, in-memory queueing, and telemetry-to-xAPI mapping for LessonKit courses.

For event names and when they fire, see the [telemetry reference](telemetry.md). For React wiring (`Course` config, transports), see [Telemetry & xAPI](../guides/react-developers/telemetry-and-xapi.md).

## Install

```bash
npm install @lessonkit/xapi
```

Peer usage: `@lessonkit/core` (telemetry types and URNs).

## Public API

| Export | Purpose |
|--------|---------|
| `telemetryEventToXAPIStatement(event)` | Canonical mapper from `@lessonkit/core` `TelemetryEvent` to `XAPIStatement` (or `null`) |
| `createXAPIClient({ courseId, transport, queue? })` | Imperative lifecycle helpers + queued send |
| `createInMemoryXAPIQueue({ maxSize?, onDepth?, onCap? })` | Default queue when transport fails or is async (max **1000** statements; oldest dropped when full) |
| `XAPIStatement`, `XAPITransport`, `XAPIClient`, `XAPIQueue` | Types |

## Telemetry → xAPI mapping

Canonical mapper: `telemetryEventToXAPIStatement(event)` in `@lessonkit/xapi`.

| Telemetry | xAPI verb | Object URN |
|-----------|-----------|------------|
| `course_started` | initialized | `…:course:{courseId}` |
| `course_completed` | completed | `…:course:{courseId}` |
| `lesson_started` | initialized | `…:lesson:{lessonId}` |
| `lesson_completed` | completed | `…:lesson:{lessonId}` (+ `result.duration` when `durationMs` set) |
| `lesson_time_on_task` | *(none)* | Returns `null` — use `lesson_completed` for xAPI duration |
| `quiz_answered` | answered | `…:check:{checkId}` |
| `quiz_completed` | completed | `…:check:{checkId}` (+ score when provided) |
| `interaction` | experienced | `…:block:{blockId}` only when `lessonId` and `data.blockId` are set |

For block-level `interaction` events, set `blockId` on `Scenario` / `Reflection` and ensure an active `lessonId`. See [telemetry reference](telemetry.md) for the full event catalog.

## React runtime

`LessonkitProvider` / `Course` call `telemetryEventToXAPIStatement` after each tracked event when `config.xapi.transport` or `config.xapi.client` is set. Course-level `initialized` is sent once per session when both tracking and xAPI are enabled.

Direct `createXAPIClient` usage is optional for non-React tooling; prefer the mapper for parity with telemetry URNs.

## Transport errors

If `transport` throws or rejects, statements are retained in the in-memory queue. Call `await client.flush()` to retry. The React provider flushes on client/course changes, unmount, and when the tab is hidden (`visibilitychange` / `pagehide`).

When the queue exceeds `maxSize` (default **1000**), the oldest statement is dropped and `onCap` runs (wire via `config.observability.onXapiQueueCap` in React). Under prolonged LRS outage, statements are lost silently unless you monitor queue depth via `onXapiQueueDepth` or handle `onXapiQueueCap`. See [production checklist](../guides/react-developers/production-checklist.md).
