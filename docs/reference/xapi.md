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
| `createXAPIClient({ courseId, transport, exitTransport?, queue? })` | Imperative lifecycle helpers + queued send; optional `flushOnExit()` when `exitTransport` is set |
| `createFetchTransport({ url, timeoutMs?, retries?, backoffMs?, headers? })` | Production fetch transport with timeout, retry backoff, keepalive `exitTransport`, and `abortInFlight` for pagehide dedupe |
| `createFetchBatchSink({ url, … })` | Batch analytics POST with matching `exitBatchSink` for pagehide |
| `createInMemoryXAPIQueue({ maxSize?, onDepth?, onCap? })` | Default queue when transport fails or is async (max **1000** statements; oldest dropped when full) |
| `XAPIStatement`, `XAPITransport`, `XAPIExitTransport`, `XAPIClient`, `XAPIQueue` | Types |

## Recommended transport (production)

```typescript
import { createFetchTransport, createXAPIClient } from "@lessonkit/xapi";

const { transport, exitTransport, abortInFlight } = createFetchTransport({
  url: "/api/xapi/statements",
  timeoutMs: 30_000,
  headers: () => ({ Authorization: `Bearer ${getShortLivedToken()}` }),
});

const client = createXAPIClient({
  courseId: "my-course",
  transport,
  exitTransport,
  abortInFlight,
});

await client.flush();
client.flushOnExit?.(); // pagehide keepalive drain
```

Custom `fetch` transports should use `AbortSignal.timeout(ms)` and handle non-OK responses by throwing so statements re-queue.

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

`LessonkitProvider` / `Course` call `telemetryEventToXAPIStatement` after each tracked event when `config.xapi.transport` or `config.xapi.client` is set. Pass `exitTransport` and `abortInFlight` alongside `transport` (from `createFetchTransport`) for pagehide delivery. If you pass a prebuilt `config.xapi.client`, wire queue observability hooks yourself — the provider only attaches `onXapiQueueDepth` / `onXapiQueueCap` when it builds the client from `transport`. Course-level `initialized` is sent once per session when both tracking and xAPI are enabled.

Direct `createXAPIClient` usage is optional for non-React tooling; prefer the mapper for parity with telemetry URNs.

## Transport errors

If `transport` throws or rejects, statements are retained in the in-memory queue. Call `await client.flush()` to retry. The React provider calls `flushOnExit()` then `flush()` when the tab is hidden (`visibilitychange` / `pagehide`).

When the queue exceeds `maxSize` (default **1000**), the oldest statement is dropped and `onCap` runs (wire via `config.observability.onXapiQueueCap` in React). Under prolonged LRS outage, statements are lost silently unless you monitor queue depth via `onXapiQueueDepth` or handle `onXapiQueueCap`. See [production checklist](../guides/react-developers/production-checklist.md).

## Related

- [Production checklist](../guides/react-developers/production-checklist.md)
- [Telemetry reference](telemetry.md)
