# Production checklist

Use this checklist before shipping a LessonKit course to learners in an LMS, standalone site, or LRS-backed deployment.

:::{admonition} Canonical guide
:class: tip

For the full go-live path (including smoke-test branch), see **[LMS Go-Live](lms-go-live.md)**.
:::

## Packaging target

| Target | `config.lxpack.bridge` | `allowedParentOrigins` | xAPI transport |
| --- | --- | --- | --- |
| SCORM / xAPI / cmi5 (LXPack iframe) | `"auto"` | **Required in production** — LMS parent origin(s) | Required if you report to an LRS |
| Standalone web (no LMS parent) | `"off"` | Omit | Required if you report to an LRS |

The `lessonkit init` template scaffolds `lxpack.bridge: "off"`. Set `"auto"` and configure `allowedParentOrigins` before packaging for LMS iframe targets:

```ts
lxpack: {
  bridge: "auto",
  allowedParentOrigins: ["https://your-lms.example"],
},
```

Development builds allow bridge forwarding without an allowlist; production builds deny it when the list is empty. See [LXPack bridge reference](../../reference/lxpack-bridge.md).

Do **not** ship `config.preview.allowConsoleTelemetry` in learner-facing production builds — it is for Read the Docs demo bundles only. Wire real sinks and all `config.observability` hooks instead.

Verify the parent exposes `window.parent.lxpackBridge.v1` in SCORM previews before go-live. If the bridge is missing, completions stay in the UI only.

## xAPI and analytics

1. **Configure a transport** — `config.xapi.transport` or `config.xapi.client`. Without it, statements queue in memory only.
2. **Use timeout + backoff** — prefer `createFetchTransport` from `@lessonkit/xapi` (uses `AbortSignal.timeout` and retry backoff). Wire `exitTransport` for pagehide keepalive delivery.
3. **Flush on tab exit** — `LessonkitProvider` calls `flushOnExit` (keepalive) then async `flush` on `visibilitychange` (hidden) and `pagehide`. Custom clients must implement `flushOnExit` themselves.
4. **Monitor queue depth** — use `config.observability.onXapiQueueDepth` and handle `onXapiQueueCap` when the queue drops oldest statements (default cap: 1000).
5. **Never embed LRS secrets in the bundle** — use short-lived tokens from your backend or LMS proxy; do not ship Basic auth passwords in client JavaScript.

## Session and resume

1. **Unique `blockId`** on each `Page`, `InteractiveBook`, and `AssessmentSequence` when `persistCompoundState` is enabled (default `true`).
2. **Kiosk / shared devices** — set `config.session.persistCompoundState: false` or use private browsing. See [Security](../../project/security.md).
3. **Expect multi-tab last-write-wins** — same origin tabs share `sessionStorage` keys.

## Authoring guardrails

1. **Every assessment inside `<Lesson>`** — otherwise production shows an alert and skips telemetry/xAPI.
2. **Align IDs** — `courseId`, `lessonId`, and `checkId` must match `lessonkit.json` for packaging. `lessonkit package` fails when React source and manifest IDs diverge.
3. **Run packaging smoke** — after changing assessments or `lessonkit.json`, run `npm run build && npx lessonkit package --target scorm12` in your course repo and import the zip into a staging LMS. Optionally add that command to your CI pipeline.

## Observability (required in production)

When telemetry or xAPI delivery is configured, wire observability hooks so silent data loss surfaces in your monitoring stack. Required hooks depend on what you enable:

| Config | Required hooks |
| --- | --- |
| Tracking or xAPI enabled | `onLxpackBridgeMiss` |
| Tracking delivery (`sink` or `batchSink`) | + `onTelemetrySinkError`, `onTelemetryBufferDrop` |
| xAPI delivery (`transport` or `client`) | + `onXapiQueueDepth`, `onXapiQueueCap`, `onXapiTransportError` |

Example when both tracking and xAPI use fetch transports:

```tsx
observability: {
  onTelemetrySinkError: (err, ctx) => reportError({ ...ctx, err }),
  onTelemetryBufferDrop: () => metrics.increment("lessonkit.telemetry.buffer_cap"),
  onXapiQueueDepth: (depth) => metrics.gauge("lessonkit.xapi.queue", depth),
  onXapiQueueCap: () => metrics.increment("lessonkit.xapi.queue_cap"),
  onLxpackBridgeMiss: (event) =>
    reportWarning("lxpack_bridge_missing", { event: event.name }),
  onXapiTransportError: (err) => reportError({ code: "xapi_transport", err }),
},
```

`onTelemetryBufferDrop` fires when the telemetry batch buffer (cap 1000) drops new events. `onTelemetrySinkError` covers both per-event sinks and `batchSink` failures. `onLxpackBridgeMiss` alerts when SCORM/LMS parent lacks `lxpackBridge.v1` (set `lxpack.bridge: "auto"` only in LMS shells). `onXapiTransportError` is **required** when xAPI delivery is configured — it fires when the LRS transport fails after retries.

`lessonkit init` scaffolds these hooks in `src/courseConfig.ts`. Production builds call `assertProductionCourseConfig()` (via `shouldEnforceProductionGuard()` in the template) — console sinks, `tracking.enabled` without a sink/batchSink, missing delivery config, or missing hooks throw before the app mounts.

## CI / build

- Pin aligned `@lessonkit/*` versions (framework 1.7.x).
- Set `VITE_XAPI_PROXY_URL` and `VITE_ANALYTICS_URL` (see `.env.example` in scaffolded projects).
- `tracking.xapi.activityIri` in `lessonkit.json` must be **HTTPS** for xAPI/cmi5 packaging.
- `lessonkit build` and `lessonkit package` run under Node 18+; set `LESSONKIT_CMD_TIMEOUT_MS` if builds need a limit (default 30 minutes per subprocess). `lessonkit dev` has no subprocess timeout.

## Related docs

- [Telemetry & xAPI](telemetry-and-xapi.md)
- [Packaging and CLI](packaging-and-cli.md)
- [LXPack bridge reference](../../reference/lxpack-bridge.md)
- [xAPI reference](../../reference/xapi.md)
