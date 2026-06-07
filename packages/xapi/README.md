# @lessonkit/xapi

[![npm](https://img.shields.io/npm/v/@lessonkit/xapi.svg)](https://www.npmjs.com/package/@lessonkit/xapi)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/xapi.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

xAPI statement generation, in-memory queueing, and telemetry-to-xAPI mapping.

Requires Node.js **18+** minimum; **20.19+** recommended for CLI scaffold workflows (Vite 8).

## Install

```bash
npm install @lessonkit/xapi @lessonkit/core
```

## Usage

```typescript
import { createFetchTransport, createXAPIClient, telemetryEventToXAPIStatement } from "@lessonkit/xapi";

const { transport, exitTransport } = createFetchTransport({
  url: "/api/xapi/statements",
  timeoutMs: 30_000,
});

const xapi = createXAPIClient({
  courseId: "my-course",
  transport,
  exitTransport,
});

xapi.completeLesson({ lessonId: "lesson-1", durationMs: 1200, success: true });
await xapi.flush();
xapi.flushOnExit?.(); // pagehide keepalive delivery
```

Map from telemetry events: `telemetryEventToXAPIStatement(event)` — uses canonical LessonKit URNs.

Batch analytics sink:

```typescript
import { createFetchBatchSink } from "@lessonkit/xapi";

const { batchSink, exitBatchSink } = createFetchBatchSink({ url: "/api/telemetry/batch" });
```

## Behavior

- No transport → statements queue in memory (dev warns once).
- Transport failure → re-queue; call `flush()` to retry.
- Queue capped at **1000** statements by default; oldest dropped when full (`onCap` / `createInMemoryXAPIQueue({ onCap })`).
- Concurrent `flush()` calls are coalesced.
- `createFetchTransport` retries with exponential backoff and uses `AbortSignal.timeout` when available.

## Docs

[xAPI reference](https://lessonkit.readthedocs.io/en/latest/reference/xapi.html) · [Telemetry & xAPI guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/telemetry-and-xapi.html) · [LRS operations](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/lrs-operations.html) · [TypeDoc API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0
