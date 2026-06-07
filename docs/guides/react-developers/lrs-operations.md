# LRS and telemetry operations

Production runbook for xAPI delivery, analytics batching, and observability hooks. For React wiring, see [deployment guide](deployment-guide.md) and [production checklist](production-checklist.md).

## Architecture

```text
Browser SPA
  ├─ track() → batchSink → your analytics API (VITE_ANALYTICS_URL proxy)
  └─ xAPI transport → your LRS proxy (VITE_XAPI_PROXY_URL)
         └─ optional: LRS (never embed LRS passwords in the SPA)
```

**Rule:** The browser calls **your backend proxies**, not a public LRS with embedded credentials. Use short-lived tokens minted server-side.

## Backend proxy pattern

```typescript
// courseConfig.ts (production)
import { createFetchTransport, createFetchBatchSink } from "@lessonkit/xapi";

const xapiFetch = createFetchTransport({
  url: import.meta.env.VITE_XAPI_PROXY_URL,
  timeoutMs: 30_000,
  headers: () => ({ Authorization: `Bearer ${getSessionToken()}` }),
});

const analytics = createFetchBatchSink({
  url: import.meta.env.VITE_ANALYTICS_URL,
  timeoutMs: 30_000,
});
```

Your proxy validates the learner session, attaches LRS Basic auth or OAuth server-side, and forwards statements to the LRS.

## Statement lifecycle

1. **Emit** — React provider maps telemetry → xAPI via `telemetryEventToXAPIStatement`
2. **Queue** — Failed or async sends land in an in-memory queue (default max **1000**)
3. **Retry** — `createFetchTransport` retries with exponential backoff
4. **Pagehide** — `exitTransport` / `exitBatchSink` use `keepalive` fetch where supported
5. **Cap** — Oldest statement dropped when queue is full → `onXapiQueueCap`
6. **Dead letter** — After repeated head failures, statements may persist via `persistDeadLetterStatement` (see [xAPI reference — dead letter](../../reference/xapi.md#dead-letter-and-url-safety-advanced))

## Observability hooks matrix

| Hook | When it fires | Required when |
| --- | --- | --- |
| `onXapiTransportError` | Transport fails after retries | xAPI delivery enabled in production |
| `onXapiQueueDepth` | Queue size changes | Recommended when xAPI enabled |
| `onXapiQueueCap` | Queue exceeded max size | Recommended when xAPI enabled |
| `onTrackingSinkError` | Analytics sink throws | Tracking enabled with custom sink |
| `onBatchSinkError` | Batch sink throws | Batch tracking enabled |
| `onLxpackBridgeMiss` | Bridge call blocked (allowlist) | `bridge: "auto"` in production |

See [production checklist](production-checklist.md) for the full matrix.

## LRS outage runbook (24h+)

| Phase | Learner experience | Your action |
| --- | --- | --- |
| **0–5 min** | Statements queue; UI works | Monitor `onXapiQueueDepth` |
| **5–60 min** | Queue grows; retries continue | Alert on `onXapiTransportError` rate |
| **Cap reached** | Oldest statements dropped | `onXapiQueueCap` fires — page ops team |
| **Recovery** | New statements deliver | Export `loadDeadLetterStatements()`; replay via proxy |

Analytics batching uses the same pattern with `onBatchSinkError` and batch queue depth if you implement custom monitoring.

## cmi5 and AU launch

cmi5 packages include launch parameters for the LRS. Staging-test cmi5 the same way as SCORM — see [LMS compatibility](../../reference/lms-compatibility.md). Activity IRIs must match `lessonkit.json` → `tracking.xapi.activityIri`.

## Security checklist

- [ ] LRS credentials only on the server
- [ ] `assertSafeLrsUrl` or equivalent in custom transports
- [ ] HTTPS only for proxy endpoints in production
- [ ] Token TTL aligned with session length
- [ ] Log statement IDs, not learner PII, in proxy logs

## Related

- [Telemetry & xAPI guide](telemetry-and-xapi.md)
- [xAPI reference](../../reference/xapi.md)
- [Enterprise evaluation](../enterprise-evaluation.md)
