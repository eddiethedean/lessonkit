# Frequently asked questions

Quick answers across onboarding, packaging, and adoption. Detailed runbooks: [React troubleshooting](react-developers/troubleshooting.md) · [Vibe coding troubleshooting](vibe-coding/troubleshooting.md).

## What is LessonKit?

A **React-first framework** for building trackable learning experiences and exporting them to SCORM, xAPI, cmi5, or standalone hosting. It is **developer tooling**—not a visual timeline editor like Storyline.

## Do I need to clone the GitHub repo?

**No**, to build a course. Run `npx @lessonkit/cli init my-course`. Clone only for [contributing](https://github.com/eddiethedean/lessonkit/blob/main/CONTRIBUTING.md) or [monorepo examples](../examples/index.md).

## Which Node.js version do I need?

**Node.js 20.19+ recommended** for `npx @lessonkit/cli init` (Vite 8). Node 18 may work for packaging-only workflows but is not tested in CI. See [Prerequisites](prerequisites.md).

| Task | Node.js |
| --- | --- |
| CLI scaffold (Vite 8), monorepo CI, Playwright e2e | **20.19+** recommended |
| Dev, build, package in an existing course | **18+** minimum |

## LessonKit vs H5P vs Storyline

| Tool | Best for |
| --- | --- |
| **H5P** | LMS content bank, `.h5p` packages, minimal coding |
| **Storyline / Captivate** | Visual timeline authoring, traditional e-learning teams |
| **LessonKit** | React/TypeScript teams, custom UX, one codebase → SCORM/xAPI/cmi5 |

LessonKit ships **native React blocks** inspired by H5P patterns—it does **not** embed H5P iframes. See [Coming from H5P?](h5p-for-lessonkit-authors.md).

## When should I **not** use LessonKit?

- You need a **WYSIWYG timeline editor** with no React development.
- Your team cannot maintain a **Vite + React** app.
- You only need a single H5P activity inside an existing LMS content bank (use H5P directly).

(scorm-zip-path)=
## Where is my SCORM zip after packaging?

Default path (relative to project root):

**`{{ scorm_zip_path }}`**

The CLI prints the resolved path. `lessonkit.json` → `paths.outputBaseDir` is **inside** `paths.lxpackOutDir`, not at the project root. See [First LMS export — where the SCORM zip lands](react-developers/first-lms-export.md#where-the-scorm-zip-lands).

## Why does my LMS not record completion?

Set `lxpack: { bridge: "auto", allowedParentOrigins: ["https://your-lms.example"] }` in `courseConfig.ts` before packaging. Production builds require the allowlist when the bridge is enabled. The init template defaults to `"off"`. See [LXPack bridge](../reference/lxpack-bridge.md).

## Why does `bridge: "auto"` work locally but not in the LMS?

Development builds allow bridge forwarding without an allowlist. **Production builds require `config.lxpack.allowedParentOrigins`** when `bridge` is `"auto"`. Add your LMS parent frame origin (scheme + host + port). Discover it from the SCORM preview URL, `document.referrer`, or browser devtools. Wire `onLxpackBridgeMiss` in observability. See [React troubleshooting](react-developers/troubleshooting.md#scorm-runs-but-lms-shows-no-completion-or-score).

## Why does my packaged course show a blank page?

Production mode requires proxy URLs (`VITE_ANALYTICS_URL`, `VITE_XAPI_PROXY_URL`) or explicitly disabled tracking/xAPI. See [Production runtime for LMS](react-developers/first-lms-export.md#production-runtime-for-lms).

## Why did `npm run build` succeed but my packaged course is blank or throws?

`npm run build` only compiles the Vite bundle — it does not validate production runtime config. When the LMS launches the course, production mode enforces real analytics/xAPI transports (or explicit `enabled: false`), observability hooks, and bridge allowlists. Dev console sinks are rejected. See [Production checklist](react-developers/production-checklist.md) · [Troubleshooting — production build throws](react-developers/troubleshooting.md#production-build-or-packaged-course-throws-on-load) · [Ship to LMS checklist](react-developers/ship-to-lms.md).

## How do I keep React and `lessonkit.json` in sync?

Align `courseId`, `lessonId`, and every `checkId` between React props and the manifest. Packaging fails on mismatch. See [Keep React IDs in sync](react-developers/quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).

## Is tracking on by default?

Yes, when you pass a `config` object without `tracking.enabled: false`. Provide a sink, batch sink, or disable tracking explicitly. Same pattern for xAPI (`transport` or `enabled: false`).

## Where is the API reference?

TypeScript types ship on npm (`dist/*.d.ts`). Browse generated API docs on [API reference](../reference/api.md) (TypeDoc for `@lessonkit/react`, `@lessonkit/core`, `@lessonkit/cli`, `@lessonkit/xapi`, `@lessonkit/lxpack`, `@lessonkit/themes`, `@lessonkit/accessibility`). For component behavior and props, use [Components and hooks](react-developers/components-and-hooks.md) and [Storybook](https://eddiethedean.github.io/lessonkit/storybook/). In your project, IDE “Go to Definition” on `@lessonkit/react` imports is the fastest path.

## How do I upgrade LessonKit?

See the [Upgrade guide](upgrading-lessonkit.md) for migration guides by version.

## How do I report a security issue?

Do not open a public issue. See [Security policy](../project/security.md).
