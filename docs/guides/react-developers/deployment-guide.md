# Deployment guide

Ship LessonKit courses to learners via LMS packages or standalone hosting.

## Deployment targets

| Target | Artifact | Typical hosting |
| --- | --- | --- |
| `scorm12` | ZIP | LMS upload (widest compatibility) |
| `scorm2004` | ZIP | LMS with SCORM 2004 player |
| `xapi` | ZIP | xAPI-enabled platform + LRS |
| `cmi5` | ZIP | cmi5 AU launch + LRS |
| `standalone` | Directory or zip | CDN, static bucket, internal web server |

Build and package:

```bash
npm run build
npm run package:scorm12   # or scorm2004, xapi, cmi5, standalone
```

Default SCORM path: **`.lxpack/course/.lxpack/out/course-scorm12.zip`**. See [Getting started in 5 minutes — step 6](getting-started-in-5-minutes.md).

## Pre-flight checklist

1. **`lxpack.bridge: "auto"`** in `courseConfig.ts` for LMS iframe targets (SCORM/xAPI/cmi5).
2. **Proxy URLs** — set `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL` in `.env` before production build; never embed LRS secrets in the client bundle.
3. **Observability hooks** — wire all required `config.observability` callbacks. See [production checklist](production-checklist.md).
4. **ID parity** — React `courseId` / `checkId` values match `lessonkit.json`.
5. **HTTPS activity IRI** — `tracking.xapi.activityIri` in `lessonkit.json` must be HTTPS for xAPI/cmi5 packaging.

## Backend proxy pattern

LessonKit courses call **your** backend proxies from the browser:

```text
Browser SPA  ──►  /api/telemetry/batch  ──►  your analytics store
Browser SPA  ──►  /api/xapi/statements   ──►  your LRS (short-lived token)
```

Use `createFetchBatchSink` and `createFetchTransport` from `@lessonkit/xapi`. Issue short-lived tokens server-side—see `.env.example` in the init template.

## Standalone hosting

1. `npm run package:standalone`
2. Upload **`.lxpack/course/.lxpack/out/standalone/`** to your static host (S3 + CloudFront, Azure Static Web Apps, nginx, etc.).
3. Set `lxpack.bridge: "off"` (no LMS parent).
4. Configure xAPI/telemetry proxies if you report to an LRS.

## SCORM upload checklist (LMS admin)

- [ ] Import the ZIP the CLI printed
- [ ] Launch in SCORM preview; confirm course loads (no blank screen—check browser console)
- [ ] Complete an assessment; confirm completion/score in LMS gradebook
- [ ] Note: single-SPA export—navigation is inside the package (one SCO)

## CI/CD

Pin `@lessonkit/*` versions. Typical pipeline:

```bash
npm ci
npm run build
npm run package:scorm12 -- --json
```

Upload the artifact from `outputPath` in JSON output. Run `lessonkit package` on Node **18+**.

## Related docs

- [Production checklist](production-checklist.md)
- [Packaging and CLI](packaging-and-cli.md)
- [LMS compatibility](../../reference/lms-compatibility.md)
- [Export parity](export-parity.md)
- [Troubleshooting](troubleshooting.md)
