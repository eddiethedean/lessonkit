# Glossary

Terms you will see across LessonKit docs, npm packages, and LMS export tooling.

## LessonKit

The React-first framework and CLI for authoring courses and exporting LMS packages. npm scope: **`@lessonkit/*`**.

## lessonkit (CLI)

The command-line tool from **`@lessonkit/cli`**: `lessonkit init`, `dev`, `build`, `package`. In scaffolded projects, prefer **`npm run dev`** / **`npm run build`** (they call the local CLI in `node_modules`).

## lessonkit.json

Project manifest (`schemaVersion: 1`) at the repo root. Describes the course for packaging (IDs, assessments, theme, paths). React props for `courseId`, `lessonId`, and `checkId` must stay in sync with this file. Full field reference: [lessonkit.json manifest](manifest.md).

## LessonkitConfig

TypeScript shape for `config` on `Course` / `LessonkitProvider`: tracking, xAPI, `lxpack` bridge, observability hooks, session, and plugins. See [Components and hooks — LessonkitConfig](../guides/react-developers/components-and-hooks.md) and [API reference](api.md).

## LessonkitProvider

React context provider that powers telemetry, xAPI, progress, and plugins. **`Course`** wraps `LessonkitProvider` for you—pass `config` on `Course` unless you build a custom tree with `LessonkitProvider` directly.

## ID parity

Requirement that `courseId`, every `lessonId`, and every `checkId` in React source match `lessonkit.json`. `lessonkit package` fails when they diverge. Common after AI-assisted edits — see [Keep React IDs in sync](../guides/react-developers/quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).

## LXPack

External packaging engine used by **`@lessonkit/lxpack`** and the CLI. Produces SCORM, standalone, xAPI, and cmi5 artifacts. You rarely import `@lxpack/api` directly when using `lessonkit package`.

## lxpackBridge

Browser bridge (`window.parent.lxpackBridge.v1`) used when a packaged course runs inside an LXPack-hosted iframe. Set `config.lxpack.bridge` to `"auto"` for LMS iframe shells; the init template defaults to `"off"`.

## allowedParentOrigins

List of parent-frame origins (scheme + host + port) permitted to receive bridge telemetry when `config.lxpack.bridge` is `"auto"`. **Required in production builds** when the bridge is enabled. Example: `["https://lms.example"]`. See [LXPack bridge](lxpack-bridge.md).

## Production guard

Runtime checks in production builds that reject console-only telemetry/xAPI sinks, missing delivery configuration, and missing observability hooks. Prevents silent data loss but can cause blank LMS pages if env/proxy setup is skipped. See [LMS Go-Live](../guides/react-developers/lms-go-live.md) and [Known limitations](../guides/known-limitations.md).

## SCORM

Sharable Content Object Reference Model — LMS packaging formats (`scorm12`, `scorm2004`) produced by `lessonkit package`. Upload the ZIP the CLI prints (default under `.lxpack/course/.lxpack/out/`).

## .lxpack/

Working directories created during packaging (descriptor staging, output zips). Default layout:

- **`paths.lxpackOutDir`** — `.lxpack/course` (LXPack project root)
- **`paths.outputBaseDir`** — `.lxpack/out` (resolved **inside** `lxpackOutDir`, not at the project root)

Default SCORM artifact: **`.lxpack/course/.lxpack/out/course-scorm12.zip`**. The CLI prints the resolved path after `lessonkit package`. See [LMS Go-Live — SCORM output layout](../guides/react-developers/lms-go-live.md).

## single-spa

`course.layout` value in `lessonkit.json` for one Vite SPA that contains the full course UI. Required for standard `lessonkit package` workflows in 1.x.

## courseId, lessonId, checkId

Stable identifiers for telemetry, xAPI URNs, and LMS descriptors. Required on `Course`, `Lesson`, and assessment blocks. See [Identity reference](identity.md).

## Block catalog

Machine-readable list of block types and props. **`buildBlockCatalog()`** defaults to **catalog v3** (framework 1.2+; extended with `Slide` / `SlideDeck` in **1.3.0**). JSON files are named `block-catalog.v1.json` … `v3.json` on `@lessonkit/react`—the filename is the schema generation, not necessarily the default you pass at runtime.

## Observability hooks

Optional React `config.observability` callbacks for production monitoring: `onTelemetrySinkError`, `onTelemetryBufferDrop`, `onXapiQueueDepth`, `onXapiQueueCap`, `onLxpackBridgeMiss`, `onXapiTransportError`. See [production checklist](../guides/react-developers/production-checklist.md).

## Storybook

Interactive component gallery for visual states and keyboard behavior — [Storybook gallery](storybook-gallery.md) · [GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/). Complements Read the Docs component pages and the block catalog.

## Library Skills

Portable `SKILL.md` packages for AI editors (Cursor, Claude Code, etc.) with LessonKit authoring rules. Install via [Library Skills](../guides/library-skills.md) — remote install does not require keeping a full monorepo checkout.

## Vibe coding

Authoring path for non-React developers: describe courses in plain language, let an AI edit `App.tsx` and `lessonkit.json`, preview with `npm run dev`, package with the CLI. See [Vibe coding guides](../guides/vibe-coding/index.md).
