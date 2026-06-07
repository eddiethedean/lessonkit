# Glossary

Terms you will see across LessonKit docs, npm packages, and LMS export tooling.

## LessonKit

The React-first framework and CLI for authoring courses and exporting LMS packages. npm scope: **`@lessonkit/*`**.

## lessonkit (CLI)

The command-line tool from **`@lessonkit/cli`**: `lessonkit init`, `dev`, `build`, `package`. In scaffolded projects, prefer **`npm run dev`** / **`npm run build`** (they call the local CLI in `node_modules`).

## lessonkit.json

Project manifest (`schemaVersion: 1`) at the repo root. Describes the course for packaging (IDs, assessments, theme, paths). React props for `courseId`, `lessonId`, and `checkId` must stay in sync with this file. Full field reference: [lessonkit.json manifest](manifest.md).

## LessonkitProvider

React context provider that powers telemetry, xAPI, progress, and plugins. **`Course`** wraps `LessonkitProvider` for you—pass `config` on `Course` unless you build a custom tree with `LessonkitProvider` directly.

## LXPack

External packaging engine used by **`@lessonkit/lxpack`** and the CLI. Produces SCORM, standalone, xAPI, and cmi5 artifacts. You rarely import `@lxpack/api` directly when using `lessonkit package`.

## lxpackBridge

Browser bridge (`window.parent.lxpackBridge.v1`) used when a packaged course runs inside an LXPack-hosted iframe. Set `config.lxpack.bridge` to `"auto"` for LMS iframe shells; the init template defaults to `"off"`.

## allowedParentOrigins

List of parent-frame origins (scheme + host + port) permitted to receive bridge telemetry when `config.lxpack.bridge` is `"auto"`. **Required in production builds** when the bridge is enabled. Example: `["https://lms.example"]`. See [LXPack bridge](lxpack-bridge.md).

## .lxpack/

Working directories created during packaging (descriptor staging, output zips). Default layout:

- **`paths.lxpackOutDir`** — `.lxpack/course` (LXPack project root)
- **`paths.outputBaseDir`** — `.lxpack/out` (resolved **inside** `lxpackOutDir`, not at the project root)

Default SCORM artifact: **`.lxpack/course/.lxpack/out/course-scorm12.zip`**. The CLI prints the resolved path after `lessonkit package`. See [First LMS export — where the SCORM zip lands](../guides/react-developers/first-lms-export.md#where-the-scorm-zip-lands).

## single-spa

`course.layout` value in `lessonkit.json` for one Vite SPA that contains the full course UI. Required for standard `lessonkit package` workflows in 1.x.

## courseId, lessonId, checkId

Stable identifiers for telemetry, xAPI URNs, and LMS descriptors. Required on `Course`, `Lesson`, and assessment blocks. See [Identity reference](identity.md).

## Block catalog

Machine-readable list of block types and props. **`buildBlockCatalog()`** defaults to **catalog v3** (framework 1.2+; extended with `Slide` / `SlideDeck` in **1.3.0**). JSON files are named `block-catalog.v1.json` … `v3.json` on `@lessonkit/react`—the filename is the schema generation, not necessarily the default you pass at runtime.

## Observability hooks

Optional React `config.observability` callbacks for production monitoring: `onTelemetrySinkError`, `onTelemetryBufferDrop`, `onXapiQueueDepth`, `onXapiQueueCap`, `onLxpackBridgeMiss`. See [production checklist](../guides/react-developers/production-checklist.md).
