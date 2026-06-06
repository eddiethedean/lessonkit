# Telemetry and xAPI

## Telemetry (`@lessonkit/core`)

Events include `course_started`, `lesson_started`, `lesson_completed`, `lesson_time_on_task`, `quiz_answered`, `quiz_completed`, and `interaction`.

Configure on `Course` / `LessonkitProvider`:

```tsx
import { createFetchBatchSink } from "@lessonkit/xapi";

const analytics = createFetchBatchSink({ url: "/api/telemetry/batch", timeoutMs: 30_000 });

const config = {
  courseId: "my-course",
  tracking: {
    batchSink: analytics.batchSink,
    exitBatchSink: analytics.exitBatchSink,
    batch: { enabled: true, flushIntervalMs: 5000, maxBatchSize: 25 },
  },
  session: {
    sessionId: "optional-fixed-id",
    user: { id: "learner-1" },
  },
};
```

`tracking.enabled: false` uses a no-op client.

Full catalog and payloads: [Telemetry reference](../../reference/telemetry.md).

## xAPI (`@lessonkit/xapi`)

Prefer `createFetchTransport` for timeout, retry backoff, and pagehide keepalive delivery:

```tsx
import { createFetchTransport } from "@lessonkit/xapi";

const xapiFetch = createFetchTransport({
  url: "/api/xapi/statements",
  timeoutMs: 30_000,
  headers: () => ({ Authorization: `Bearer ${getShortLivedToken()}` }),
});

const config = {
  courseId: "my-course",
  xapi: {
    transport: xapiFetch.transport,
    exitTransport: xapiFetch.exitTransport,
  },
};
```

Custom transport with manual `fetch` — always set a timeout:

```tsx
xapi: {
  transport: async (statement) => {
    const res = await fetch(LRS_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(statement),
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`LRS ${res.status}`);
  },
},
```

Lifecycle helpers on `createXAPIClient` mirror lesson/course completion. From 0.5+, lifecycle statements are also driven through the telemetry → xAPI mapper when `courseId` is set.

Inject a custom client:

```tsx
xapi: { client: myXAPIClient },
```

## LXPack bridge (packaged courses)

When embedded in an LXPack export, `@lessonkit/react` can forward completion/scores to `window.parent.lxpackBridge.v1` (`config.lxpack.bridge`, default `auto`). See [LXPack bridge reference](../../reference/lxpack-bridge.md) and [Packaging reference](../../reference/packaging.md).

`LessonkitProvider` uses `runtimeVersion: "v2"` by default (headless runtime from `@lessonkit/core`). Set `runtimeVersion: "v1"` to opt out; see [Core reference](../../reference/core.md) and [MIGRATION-0.x-to-1.0.md](../../MIGRATION-0.x-to-1.0.md).

## Production

Before go-live, complete the [production checklist](production-checklist.md) (LMS bridge, flush-on-exit, `blockId`, observability hooks).

### Observability hooks

Wire **all five** hooks in production:

```tsx
observability: {
  onTelemetrySinkError: (err, { sinkId }) => { /* report */ },
  onTelemetryBufferDrop: () => { /* alert: telemetry buffer dropped events */ },
  onXapiQueueDepth: (depth) => { /* gauge */ },
  onXapiQueueCap: () => { /* alert: queue dropped oldest statement */ },
  onLxpackBridgeMiss: (event) => { /* LMS bridge missing for completion */ },
},
```

`LessonkitProvider` calls `flushOnExit` (keepalive) then async `flush` when the tab is hidden or on `pagehide`.

## Identity and URNs

All telemetry requires `courseId`. Object URNs for xAPI follow the identity contract—[Identity reference](../../reference/identity.md).
