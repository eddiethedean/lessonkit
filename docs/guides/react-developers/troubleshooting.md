# Troubleshooting (React developers)

Common fixes for packaging, production builds, and LMS delivery. Vibe-coding users: see [vibe coding troubleshooting](../vibe-coding/troubleshooting.md). General questions: [FAQ](../faq.md).

## Decision tree

| If you see… | Go to |
| --- | --- |
| SCORM zip not where expected | [Cannot find the SCORM zip](#cannot-find-the-scorm-zip) · [FAQ SCORM path](../faq.md#where-is-my-scorm-zip-after-packaging) |
| `lessonkit package` ID / manifest errors | [`lessonkit package` fails on ID parity](#lessonkit-package-fails-on-id-parity) |
| Blank page or throw after LMS upload | [Production build throws](#production-build-or-packaged-course-throws-on-load) |
| `assertProductionCourseConfig` or missing observability hook | [Observability hook errors](#observability-hook-errors) |
| xAPI/cmi5 packaging fails on activity IRI | [HTTPS activity IRI required](#https-activity-iri-required) |
| Analytics/xAPI 401, 403, or CORS errors | [CORS and proxy errors](#cors-and-proxy-errors) |
| `npm install` fails during `init` | [npm install failures](#npm-install-failures) |
| LMS shows no completion/score | [SCORM runs but no completion](#scorm-runs-but-lms-shows-no-completion-or-score) |
| `lessonkit: command not found` | [`lessonkit: command not found`](#lessonkit-command-not-found) |
| Node engine / version errors | [Node version errors](#node-version-errors) |

## Cannot find the SCORM zip

**Symptom:** You look for `.lxpack/out/course-scorm12.zip` at the project root and the file is missing.

**Fix:** See the canonical path in the [FAQ — SCORM zip location](../faq.md#where-is-my-scorm-zip-after-packaging). Trust the path **`lessonkit package` prints** on stdout. Details: [First LMS export — where the SCORM zip lands](first-lms-export.md#where-the-scorm-zip-lands).

## `lessonkit package` fails on ID parity

**Symptom:** Errors about missing `checkId`, unknown `courseId`, or React/manifest mismatch.

**Fix:**

1. Every `checkId` in React must appear in `lessonkit.json` → `course.assessments[]`.
2. `<Course courseId="…">` must match `course.courseId` in the manifest.
3. Use `"layout": "single-spa"` for standard CLI packaging.

See [Keep React IDs in sync](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).

## Production build or packaged course throws on load

**Symptom:** Blank page, `VITE_ANALYTICS_URL is required`, or `assertProductionCourseConfig` error in the browser console after `npm run build`, `vite preview`, or LMS launch.

**Fix:**

- **Production export:** Copy `.env.example` to `.env`, set `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL`, rebuild, then package.
- **First test export only:** Temporarily set `tracking: { enabled: false }` and `xapi: { enabled: false }` in `courseConfig.ts`.
- **Dev vs prod:** `npm run dev` uses console sinks; production mode enforces real delivery or explicit disable.

Details: [production checklist](production-checklist.md) · [Production runtime for LMS](first-lms-export.md#production-runtime-for-lms) · [Ship to LMS checklist](ship-to-lms.md).

## Observability hook errors

**Symptom:** `assertProductionCourseConfig` throws at startup with a message about missing `onLxpackBridgeMiss`, `onTelemetrySinkError`, `onXapiTransportError`, or similar.

**Fix:**

1. Open `src/courseConfig.ts` and wire the observability hooks scaffolded there (uncomment and route to your monitoring stack).
2. Match hooks to what you enable — see the [observability table](production-checklist.md#observability-required-in-production).
3. For a **first smoke test only**, disable delivery: `tracking: { enabled: false }`, `xapi: { enabled: false }`.
4. Rebuild (`npm run build`) before packaging.

## HTTPS activity IRI required

**Symptom:** `lessonkit package --target xapi` or `--target cmi5` fails validation on `activityIri`, or packaging warns that the IRI must be HTTPS.

**Fix:**

1. Edit `lessonkit.json` → `course.tracking.xapi.activityIri`.
2. Replace the `example.com` placeholder from `lessonkit init` with a real **HTTPS** IRI (for example `https://lms.example.com/courses/my-course`).
3. Re-run `npm run package:xapi` or `package:cmi5`.

See [Manifest reference](../../reference/manifest.md).

## CORS and proxy errors

**Symptom:** Browser console shows CORS blocked requests, 401/403 from your analytics or xAPI proxy, or `onXapiTransportError` / `onTelemetrySinkError` firing after LMS launch.

**Fix:**

1. Confirm `.env` has `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL` pointing at **your** backend proxies (not the LRS directly with embedded credentials).
2. Configure your proxy to accept requests from the packaged course origin and return appropriate CORS headers.
3. Use short-lived tokens from your backend; never ship LRS Basic auth passwords in the client bundle.
4. Wire `onXapiTransportError` and `onTelemetrySinkError` so failures surface in monitoring.

Details: [Deployment guide](deployment-guide.md) · [LRS operations](lrs-operations.md)

## npm install failures

**Symptom:** `npx @lessonkit/cli init` fails during `npm install`, or you see `EBADENGINE`, peer dependency warnings, or registry timeout errors.

**Fix:**

| Error | Action |
| --- | --- |
| `EBADENGINE` / Node too old | Use **Node.js 20.19+** for `init` (Vite 8). Check with `node -v`. |
| Registry timeout / `ECONNRESET` | Retry `npm install`; check corporate proxy or mirror settings (`npm config get registry`). |
| Peer dependency conflicts | Align `react` and `react-dom` to versions LessonKit supports (18+ or 19.x). |
| Non-empty directory | Use `lessonkit init --here` only in an empty folder, or `lessonkit init my-course` in a new directory. |
| Skip install during init | `lessonkit init my-course --skip-install`, then run `npm install` manually after fixing Node/proxy issues. |

See [Prerequisites](../prerequisites.md) and [CLI reference](../../reference/cli.md).

## SCORM runs but LMS shows no completion or score

**Symptom:** Learner finishes the course in the LMS player; status stays incomplete.

**Fix:**

1. Set `lxpack: { bridge: "auto", allowedParentOrigins: ["https://your-lms.example"] }` in `courseConfig.ts` **before** packaging (init template defaults to `"off"`). Production builds deny bridge forwarding when `allowedParentOrigins` is empty.
2. Verify the LMS parent exposes `window.parent.lxpackBridge.v1` in SCORM preview.
3. Discover the parent origin: inspect `document.referrer`, the LMS launch URL, or the parent frame in browser devtools. Use the exact scheme, host, and port in the allowlist.
4. Wire `onLxpackBridgeMiss` in production—see [LXPack bridge reference](../../reference/lxpack-bridge.md).

## Bridge works in dev but not after LMS upload

**Symptom:** `npm run dev` shows completions; packaged SCORM in the LMS does not.

**Fix:** Production requires `allowedParentOrigins` with `bridge: "auto"`. Development skips the allowlist check. Rebuild after updating `courseConfig.ts`, then re-package.

## Quiz does not mark complete

- Confirm `checkId` on the assessment matches `lessonkit.json` → `course.assessments[].checkId`.
- Confirm the learner selected the **exact** answer string from `choices`.
- Ensure the assessment is inside `<Lesson>` (required for telemetry in production).

## Empty `dist/` or packaging skips build

**Symptom:** Packaging fails because `dist/` is missing.

**Fix:** Run `npm run build` or omit `--no-build` on `lessonkit package`.

## Node version errors

| Task | Node.js |
| --- | --- |
| `lessonkit dev`, `build`, `package` | **18+** |
| CLI scaffold (Vite 8), monorepo e2e | **20.19+** recommended |

```bash
node -v   # expect v18.x, v20.x, or v22.x
```

## `lessonkit: command not found`

```bash
npx @lessonkit/cli dev
# or: npm install -g @lessonkit/cli
```

Prefer `npm run dev` in scaffolded projects (uses the local CLI in `node_modules`).

## Still stuck?

- [FAQ](../faq.md)
- [Packaging and CLI](packaging-and-cli.md)
- [CLI reference](../../reference/cli.md)
- GitHub issues: [eddiethedean/lessonkit](https://github.com/eddiethedean/lessonkit/issues)
