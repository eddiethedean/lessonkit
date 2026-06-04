# Production checklist

Use this checklist before shipping a LessonKit course to learners in an LMS, standalone site, or LRS-backed deployment.

## Packaging target

| Target | `config.lxpack.bridge` | xAPI transport |
| --- | --- | --- |
| SCORM / xAPI / cmi5 (LXPack iframe) | `"auto"` (default) | Required if you report to an LRS |
| Standalone web (no LMS parent) | `"off"` | Required if you report to an LRS |

Verify the parent exposes `window.parent.lxpackBridge.v1` in SCORM previews before go-live. If the bridge is missing, completions stay in the UI only.

## xAPI and analytics

1. **Configure a transport** — `config.xapi.transport` or `config.xapi.client`. Without it, statements queue in memory only.
2. **Flush on tab exit** — `LessonkitProvider` flushes on `visibilitychange` (hidden) and `pagehide`. Custom clients must call `flush()` themselves.
3. **Monitor queue depth** — use `config.observability.onXapiQueueDepth` and handle `onXapiQueueCap` when the queue drops oldest statements (default cap: 1000).
4. **Never embed LRS secrets in the bundle** — use short-lived tokens from your backend or LMS proxy; do not ship Basic auth passwords in client JavaScript.

## Session and resume

1. **Unique `blockId`** on each `Page`, `InteractiveBook`, and `AssessmentSequence` when `persistCompoundState` is enabled (default `true`).
2. **Kiosk / shared devices** — set `config.session.persistCompoundState: false` or use private browsing. See [Security](../../../SECURITY.md).
3. **Expect multi-tab last-write-wins** — same origin tabs share `sessionStorage` keys.

## Authoring guardrails

1. **Every assessment inside `<Lesson>`** — otherwise production shows an alert and skips telemetry/xAPI.
2. **Align IDs** — `courseId`, `lessonId`, and `checkId` must match `lessonkit.json` for packaging.
3. **Run export parity** — `npm run test:e2e` in the monorepo or package smoke in CI after changing assessments or `lessonkit.json`.

## Observability (recommended)

```tsx
observability: {
  onTelemetrySinkError: (err, ctx) => reportError({ ...ctx, err }),
  onXapiQueueDepth: (depth) => metrics.gauge("lessonkit.xapi.queue", depth),
  onXapiQueueCap: () => metrics.increment("lessonkit.xapi.queue_cap"),
  onLxpackBridgeMiss: (event) =>
    reportWarning("lxpack_bridge_missing", { event: event.name }),
},
```

## CI / build

- Pin aligned `@lessonkit/*` versions (framework 1.2.x).
- `lessonkit build` and `lessonkit package` run under Node 18+; set `LESSONKIT_CMD_TIMEOUT_MS` if builds need a limit (default 30 minutes per subprocess).

## Related docs

- [Telemetry & xAPI](telemetry-and-xapi.md)
- [Packaging and CLI](packaging-and-cli.md)
- [LXPack bridge reference](../../reference/lxpack-bridge.md)
- [xAPI reference](../../reference/xapi.md)
