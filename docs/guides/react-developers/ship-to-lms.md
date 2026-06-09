# Ship to LMS checklist

:::{admonition} Appendix — read LMS Go-Live first
:class: note

This one-page checklist is a **quick reference** only. For the decision tree, shared steps, and troubleshooting, start with **[LMS Go-Live](lms-go-live.md)**.
:::

One-page checklist for taking a scaffolded LessonKit course from local preview to a working LMS upload. Complete [Getting started in 5 minutes](getting-started-in-5-minutes.md) first if you have not previewed locally yet.

:::{admonition} When something breaks
:class: tip

Use the [troubleshooting decision tree](troubleshooting.md) or [FAQ](../faq.md).
:::

## Before you start

| Requirement | Details |
| --- | --- |
| Node.js | See [Prerequisites — decision table](../prerequisites.md) |
| Project | From `npx @lessonkit/cli init` with `npm run dev` working |
| IDs | `courseId`, `lessonId`, and every `checkId` match between React and `lessonkit.json` |

## Checklist

### 1. Configure the LMS bridge

In `src/courseConfig.ts`:

```ts
lxpack: {
  bridge: "auto",
  allowedParentOrigins: ["https://your-lms.example"],
},
```

Development builds allow `bridge: "auto"` without an allowlist; **production builds require `allowedParentOrigins`**. See [LXPack bridge reference](../../reference/lxpack-bridge.md).

### 2. Configure production runtime

Choose one path:

| Path | Steps |
| --- | --- |
| **Production delivery** | Copy `.env.example` → `.env`; set `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL`; wire observability hooks in `courseConfig.ts` (see comments there) |
| **First smoke test only** | Temporarily set `tracking: { enabled: false }` and `xapi: { enabled: false }` in `courseConfig.ts` |

Details: [Production checklist](production-checklist.md) · [Production runtime for LMS](first-lms-export.md#production-runtime-for-lms)

### 3. Set activity IRI (xAPI / cmi5 only)

Replace the `example.com` placeholder in `lessonkit.json` → `course.tracking.xapi.activityIri` with an **HTTPS** IRI for your organization.

### 4. Build and package

```bash
npm run build
npm run package:scorm12   # or scorm2004, standalone, xapi, cmi5
```

Note the ZIP path the CLI prints (default: `{{ scorm_zip_path }}`).

### 5. Upload and verify in LMS

1. Upload the ZIP to your LMS staging environment.
2. Launch as a learner; complete the quiz or assessment.
3. Confirm completion/score appears in the LMS gradebook or report.
4. If completion is missing, verify `window.parent.lxpackBridge.v1` in browser devtools and re-check `allowedParentOrigins`.

### 6. Go-live (production)

Before learner-facing deployment:

- [ ] Real analytics/xAPI transports wired (no console-only sinks)
- [ ] All required [observability hooks](production-checklist.md#observability-required-in-production) configured
- [ ] Pin aligned `@lessonkit/*` versions in `package.json`
- [ ] Run through [deployment guide](deployment-guide.md) for CORS/proxy setup
- [ ] Optional: [LRS operations](lrs-operations.md) for statement monitoring

## Deep dives

| Topic | Guide |
| --- | --- |
| Step-by-step first export | [First LMS export](first-lms-export.md) |
| Production guardrails | [Production checklist](production-checklist.md) |
| Proxy and CORS | [Deployment guide](deployment-guide.md) |
| CLI flags and targets | [Packaging and CLI](packaging-and-cli.md) |
| LMS format requirements | [LMS compatibility](../../reference/lms-compatibility.md) |
| Export parity testing | [Export parity](export-parity.md) |
