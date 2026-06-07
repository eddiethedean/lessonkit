# Troubleshooting (React developers)

Common fixes for packaging, production builds, and LMS delivery. Vibe-coding users: see [vibe coding troubleshooting](../vibe-coding/troubleshooting.md). General questions: [FAQ](../faq.md).

## Decision tree

| If you see… | Go to |
| --- | --- |
| SCORM zip not where expected | [Cannot find the SCORM zip](#cannot-find-the-scorm-zip) · [FAQ SCORM path](../faq.md#where-is-my-scorm-zip-after-packaging) |
| `lessonkit package` ID / manifest errors | [`lessonkit package` fails on ID parity](#lessonkit-package-fails-on-id-parity) |
| Blank page or throw after LMS upload | [Production build throws](#production-build-or-packaged-course-throws-on-load) |
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

Details: [production checklist](production-checklist.md) · [Production runtime for LMS](first-lms-export.md#production-runtime-for-lms).

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
