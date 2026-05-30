# Telemetry and xAPI

## Telemetry (`@lessonkit/core`)

Events include `course_started`, `lesson_started`, `lesson_completed`, `lesson_time_on_task`, `quiz_answered`, `quiz_completed`, and `interaction`.

Configure on `Course` / `LessonkitProvider`:

```tsx
const config = {
  courseId: "my-course",
  tracking: {
    sink: (event) => sendToAnalytics(event),
    batch: { enabled: true, flushIntervalMs: 5000, maxBatchSize: 25 },
    // or batchSink: (events) => api.ingestBatch(events),
  },
  session: {
    sessionId: "optional-fixed-id",
    user: { id: "learner-1", email: "a@b.com" },
  },
};
```

`tracking.enabled: false` uses a no-op client.

Full catalog and payloads: [Telemetry reference](../../reference/telemetry.md).

## xAPI (`@lessonkit/xapi`)

Pass a transport on config:

```tsx
xapi: {
  transport: async (statement) => {
    await fetch(LRS_ENDPOINT, { method: "POST", body: JSON.stringify(statement) });
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

## Identity and URNs

All telemetry requires `courseId`. Object URNs for xAPI follow the identity contract—[Identity reference](../../reference/identity.md).
