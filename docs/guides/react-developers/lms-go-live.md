# LMS Go-Live

**Start here** for every LMS upload—local preview to a working SCORM (or xAPI/cmi5) package. This is the **only canonical go-live guide**; other LMS pages are appendices that link back here.

**Prerequisites:** A course from `npx @lessonkit/cli init` with `npm run dev` working. Node.js: see [Prerequisites — decision table](../prerequisites.md#node-js-and-npm).

## Choose your path

```text
                    Local preview OK (npm run dev)
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        Smoke test only                  Production delivery
   (first LMS upload)              (learners + analytics + xAPI)
                │                               │
                ▼                               ▼
   Disable tracking/xAPI              Wire .env proxies + observability
   bridge: auto + allowlist           Full production checklist
   build → package → upload           build → package → staging QA
```

| Path | When | Tracking / xAPI | Bridge |
| --- | --- | --- | --- |
| **Smoke test** | First SCORM import; verify completion UI | Temporarily `enabled: false` in `courseConfig.ts` | `"auto"` + `allowedParentOrigins` |
| **Production** | Learners on staging/production LMS | Real sinks/transports + observability hooks | `"auto"` + allowlist + staging QA |

Smoke test proves packaging and LMS shell behavior. Production delivery requires the [production checklist](production-checklist.md) — builds can succeed while LMS runtime fails if hooks and transports are missing.

## Shared steps (both paths)

### 1. Align IDs

`courseId`, every `lessonId`, and every `checkId` must match between React and `lessonkit.json`. `lessonkit package` fails on parity errors. See [Keep React IDs in sync](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).

### 2. Enable the LMS bridge

In `src/courseConfig.ts`:

```ts
lxpack: {
  bridge: "auto",
  allowedParentOrigins: ["https://your-lms-staging.example"],
},
```

The init template defaults to `bridge: "off"` for local preview. **Production builds require `allowedParentOrigins`** when `bridge: "auto"`. Details: [LXPack bridge reference](../../reference/lxpack-bridge.md).

### 3. Build

```bash
npm run build
```

Confirm `dist/index.html` exists (or your `paths.spaDistDir`).

### 4. Package

```bash
npm run package:scorm12
# or: npx lessonkit package --target scorm12
```

Trust the path printed on stdout, for example: `Packaged scorm12 → …/course-scorm12.zip`.

(scorm-output-layout)=
### 5. SCORM output layout

`paths.outputBaseDir` resolves **inside** `paths.lxpackOutDir`, not at the project root:

```text
my-course/
├── lessonkit.json
├── dist/                                    ← paths.spaDistDir (Vite build)
└── .lxpack/course/                          ← paths.lxpackOutDir
    └── .lxpack/out/                         ← paths.outputBaseDir
        ├── course-scorm12.zip               ← upload this (SCORM 1.2)
        ├── course-scorm2004.zip
        ├── course-xapi.zip
        ├── course-cmi5.zip
        └── standalone/                      ← standalone target (directory)
```

Default values come from `lessonkit.json` `paths` (omitted keys use CLI defaults). Override artifact location with `--out path/inside/project.zip` — see [Packaging and CLI](packaging-and-cli.md).

### 6. Upload and verify

1. Upload the ZIP to LMS **staging**.
2. Launch the activity; complete a lesson and an assessment.
3. Confirm completion/score reaches the LMS gradebook (bridge) or your LRS (xAPI/cmi5).

## Smoke-test branch

For your **first** export when analytics backends are not ready:

```ts
// courseConfig.ts — temporary for smoke test only
tracking: { enabled: false },
xapi: { enabled: false },
```

Re-enable before production. Do **not** ship smoke-test config to learners.

## Production branch

Before go-live:

1. Copy `.env.example` → `.env`; set `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL` (never embed LRS passwords in the bundle).
2. Wire all required `config.observability` hooks — see [Production checklist](production-checklist.md).
3. Replace `example.com` in `lessonkit.json` → `course.tracking.xapi.activityIri` with your HTTPS activity IRI (xAPI/cmi5 targets).
4. Re-run `npm run build` then `npm run package:<target>`.
5. Verify `window.parent.lxpackBridge.v1` in the LMS preview frame.

Full matrix: [Deployment guide](deployment-guide.md) · [LRS operations](lrs-operations.md).

## When something breaks

| Symptom | Start here |
| --- | --- |
| Blank iframe / white screen | [Troubleshooting — runtime](troubleshooting.md) |
| Package fails / wrong zip path | [CLI error catalog](../../reference/cli-errors.md) · [FAQ — SCORM zip](../faq.md) |
| Completion not in gradebook | Bridge allowlist + [LXPack bridge](../../reference/lxpack-bridge.md) |
| xAPI not in LRS | [LRS operations](lrs-operations.md) · transport + `onXapiTransportError` |

## Related (appendix pages)

These pages repeat subsets of this guide—use them only as quick references:

- [First LMS export](first-lms-export.md) — first-export checklist (appendix)
- [Ship to LMS checklist](ship-to-lms.md) — one-page checklist (appendix)
- [Production checklist](production-checklist.md) — observability, session, CI pins (appendix)
- [Packaging and CLI](packaging-and-cli.md) — all `--target` values
- [Export parity](export-parity.md) — what CI guarantees per format
