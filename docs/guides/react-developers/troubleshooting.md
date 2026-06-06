# Troubleshooting (React developers)

Common fixes for packaging, production builds, and LMS delivery. Vibe-coding users: see [vibe coding troubleshooting](../vibe-coding/troubleshooting.md). General questions: [FAQ](../faq.md).

## Cannot find the SCORM zip

**Symptom:** You look for `.lxpack/out/course-scorm12.zip` at the project root and the file is missing.

**Fix:** `paths.outputBaseDir` (`.lxpack/out`) is resolved **inside** `paths.lxpackOutDir` (`.lxpack/course`). Default full path:

```text
.lxpack/course/.lxpack/out/course-scorm12.zip
```

Trust the path **`lessonkit package` prints** on stdout. See [Getting started in 5 minutes — step 6](getting-started-in-5-minutes.md).

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

Details: [production checklist](production-checklist.md) · [Production runtime for LMS](getting-started-in-5-minutes.md#production-runtime-for-lms).

## SCORM runs but LMS shows no completion or score

**Symptom:** Learner finishes the course in the LMS player; status stays incomplete.

**Fix:**

1. Set `lxpack: { bridge: "auto" }` in `courseConfig.ts` **before** packaging (init template defaults to `"off"`).
2. Verify the LMS parent exposes `window.parent.lxpackBridge.v1` in SCORM preview.
3. Wire `onLxpackBridgeMiss` in production—see [LXPack bridge reference](../../reference/lxpack-bridge.md).

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
