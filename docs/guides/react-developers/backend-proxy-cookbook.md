# Backend proxy cookbook

LessonKit course bundles call **your** backend for analytics and xAPI delivery. The init template reads proxy URLs from Vite env vars at build time:

| Env var | Purpose | Typical backend route |
| --- | --- | --- |
| `VITE_ANALYTICS_URL` | Telemetry batch ingest | `POST /api/telemetry/batch` |
| `VITE_XAPI_PROXY_URL` | xAPI statement forward | `POST /api/xapi/statements` |

Never embed LRS Basic Auth or long-lived API keys in the SPA. Proxies hold secrets server-side and return short-lived tokens or forward server-to-server.

**Prerequisites:** Complete [LMS Go-Live](lms-go-live.md) for bridge and observability setup. Copy `.env.example` → `.env` in your course project before `npm run build`.

## Minimal Node + Express proxy

The examples below run on `http://localhost:3001`. In `.env`:

```bash
VITE_ANALYTICS_URL=http://localhost:3001/api/telemetry/batch
VITE_XAPI_PROXY_URL=http://localhost:3001/api/xapi/statements
```

### Analytics batch (`VITE_ANALYTICS_URL`)

`createFetchBatchSink` POSTs a JSON **array** of telemetry events.

```javascript
// proxy-server.mjs — run: node proxy-server.mjs
import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.post("/api/telemetry/batch", (req, res) => {
  const events = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ error: "Expected JSON array" });
  }
  // Forward to your warehouse, Segment, Snowplow collector, etc.
  console.log("[telemetry batch]", events.length, "events");
  res.status(204).end();
});

app.listen(3001, () => console.log("Analytics proxy on :3001"));
```

### xAPI statements (`VITE_XAPI_PROXY_URL`)

`createFetchTransport` POSTs a single xAPI statement per request.

```javascript
app.post("/api/xapi/statements", async (req, res) => {
  const statement = req.body;
  if (!statement || typeof statement !== "object") {
    return res.status(400).json({ error: "Expected xAPI statement object" });
  }

  const lrsUrl = process.env.LRS_STATEMENTS_URL; // e.g. https://lrs.example.com/xapi/statements
  const lrsAuth = process.env.LRS_BASIC_AUTH; // Base64 user:pass — server env only

  if (!lrsUrl || !lrsAuth) {
    return res.status(503).json({ error: "LRS not configured on proxy" });
  }

  const upstream = await fetch(lrsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${lrsAuth}`,
      "X-Experience-API-Version": "1.0.3",
    },
    body: JSON.stringify(statement),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return res.status(upstream.status).send(text);
  }
  res.status(204).end();
});
```

Combine both routes in one Express app for local staging QA.

## Token-based auth (recommended for production)

Issue short-lived bearer tokens instead of exposing LRS credentials:

```javascript
// GET /api/lrs-token — called from courseConfig.ts lrsAuthHeaders()
app.get("/api/lrs-token", (req, res) => {
  // Validate LMS session cookie or OIDC token here
  const token = signJwt({ sub: req.user?.id, exp: Date.now() + 300_000 });
  res.json({ Authorization: `Bearer ${token}` });
});
```

In `src/courseConfig.ts`, wire `createFetchTransport` / `createFetchBatchSink` with a `headers` function that fetches the token (see init template comments).

## Serverless (AWS Lambda + API Gateway)

Same contract: accept POST, validate body shape, forward with server-side credentials.

```javascript
// handler.mjs — API Gateway HTTP API, POST /api/xapi/statements
export async function handler(event) {
  const statement = JSON.parse(event.body ?? "{}");
  const res = await fetch(process.env.LRS_STATEMENTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${process.env.LRS_BASIC_AUTH}`,
      "X-Experience-API-Version": "1.0.3",
    },
    body: JSON.stringify(statement),
  });
  return { statusCode: res.ok ? 204 : res.status, body: res.ok ? "" : await res.text() };
}
```

Set `VITE_XAPI_PROXY_URL` to the API Gateway invoke URL before `npm run build`.

## CORS and LMS iframe notes

| Context | CORS |
| --- | --- |
| SCORM package hosted on LMS origin | Browser calls **your** proxy URL; proxy must allow the LMS origin (or use same-site proxy path) |
| Standalone CDN | Allow your course origin in `Access-Control-Allow-Origin` |

Packaged courses use `fetch` with credentials only when you configure it in transport `init`. Default LessonKit transports do not send cookies to third-party analytics URLs.

If the browser blocks requests, see [Deployment guide — CORS](deployment-guide.md) and [Troubleshooting — CORS and proxy errors](troubleshooting.md#cors-and-proxy-errors).

## Wire into `courseConfig.ts`

After proxies exist:

1. Set `.env` values.
2. Re-run `npm run build` (Vite inlines `import.meta.env.VITE_*` at build time).
3. Run `npm run package:scorm12`.
4. Launch in LMS staging; confirm network tab shows `204`/`200` from your proxy, not console-only sinks.

Smoke test without backends: temporarily set `tracking: { enabled: false }` and `xapi: { enabled: false }` — see [LMS Go-Live — smoke test](lms-go-live.md#smoke-test-branch).

## Related

- [LMS Go-Live](lms-go-live.md) — canonical go-live path
- [Production checklist](production-checklist.md) — observability hooks
- [Telemetry and xAPI](telemetry-and-xapi.md) — runtime behavior
- [xAPI reference](../../reference/xapi.md) — `createFetchTransport`, `createFetchBatchSink`
