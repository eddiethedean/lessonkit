# Changelog

All notable changes to the LessonKit monorepo are documented here.

- [`@lessonkit/*`](https://www.npmjs.com/org/lessonkit) — core platform (tag `v*.*.*`)

## Unreleased

### Added

- **@lessonkit/core**: `McqAssessmentProps`, `LmsBridgeMode`; `./testing` subpath export for test reset helpers.
- **@lessonkit/react**: `./blocks` and `./testing` subpath exports; optional `@lessonkit/lxpack` peer dependency.
- **@lessonkit/lxpack**: `LessonkitExportTarget` alias for packaging targets.
- **CI**: Dependabot for npm and GitHub Actions.

### Changed

- **@lessonkit/react**: `QuizProps` and `KnowledgeCheckProps` now use `McqAssessmentProps` from `@lessonkit/core` (was `McqAssessmentDescriptor` from lxpack).
- **@lessonkit/lxpack**: `@lxpack/*` dependencies pinned to exact `0.6.2`; LXPack compatibility matrix in [LXPack interoperability](docs/reference/lxpack-upgrades.md).
- **@lessonkit/cli**: `exports` field now includes TypeScript types.
- **Docs**: `SECURITY.md` lists 1.4.x; README clarifies lxpack bundles `@lxpack/*`; onboarding docs (API subpaths, example READMEs, init template packaging scripts).
- Test reset helpers on main package entries are **deprecated**; use `@lessonkit/core/testing` and `@lessonkit/react/testing`.

### Removed

- **Studio**: Visual Studio authoring packages (`packages/studio-*`, `apps/studio-web`, `examples/studio-minimal`) removed from the monorepo. LessonKit is React-first only; historical `studio-v*` git tags remain for archaeology.

## [1.4.0] - 2026-06-05

Framework **1.4.x** — `InteractiveVideo` (H5P Interactive Video) and bundled Tier B/C/D blocks in a single release. All seven `@lessonkit/*` packages ship at **1.4.0**.

### Added

- **@lessonkit/react**: `Video`, `TimedCue`, `InteractiveVideo`; assessments `Summary`, `ImagePairing`, `ImageSequencing`, `ArithmeticQuiz`, `Essay`; content `Questionnaire`, `MemoryGame`, `InformationWall`, `ParallaxSlideshow`.
- **@lessonkit/core**: compound allowlists for `InteractiveVideo` / `TimedCue`; telemetry catalog v3 events (`video_cue_reached`, `video_segment_completed`, `memory_card_flipped`, `information_wall_search`, `parallax_slide_viewed`, `questionnaire_submitted`); assessment interaction types for 1.4 blocks.
- **@lessonkit/xapi**: xAPI mappers for new telemetry events.
- **Examples**: `examples/interactive-video` golden path; integration SCORM packaging test; Playwright smoke.

### Changed

- **Block catalog v3**: 38 entries (was 26); `Slide` allowlist includes `Video` and 1.4 blocks.
- **Docs**: [MIGRATION-1.3-to-1.4.md](docs/MIGRATION-1.3-to-1.4.md); H5P capability map rows marked ✅ at 1.4.0.
- **Dependencies**: `@lessonkit/react` transitively installs `@lessonkit/lxpack` (and `@lxpack/*`) for LMS bridge telemetry at runtime; use `@lessonkit/cli` as a devDependency for packaging only.

## [1.3.1] - 2026-06-05

Framework **1.3.x** patch — production hardening and documentation. All seven `@lessonkit/*` packages ship at **1.3.1**.

### Added

- **@lessonkit/xapi**: `createFetchTransport` and `createFetchBatchSink` (timeout, retry backoff, keepalive pagehide delivery); `XAPIClient.flushOnExit()`.
- **@lessonkit/core**: `TrackingClient.flushOnExit()` via optional `exitBatchSink`; `wrapBatchSink` routes batch failures to `onTelemetrySinkError`.
- **@lessonkit/lxpack**: `validateReactManifestParity` — `lessonkit package` fails when React `src/` omits manifest `courseId` or `checkId` values.
- **@lessonkit/react**: production observability warning when hooks are missing; pagehide calls `flushOnExit` before async flush.

### Changed

- **@lessonkit/react**: `course_started` tracking dedupe mark is written only after a successful flush.
- **@lessonkit/cli**: `lessonkit dev` has no subprocess timeout; init template uses noop telemetry sinks (no `console.log` PII).
- **Docs**: production checklist, telemetry/xAPI guides, Sphinx reference pages updated for 1.3.x observability and transport helpers.

### Fixed

- **@lessonkit/react**: `batchSink` failures now invoke `onTelemetrySinkError`.
- **@lessonkit/react**: `course_started` dedupe is atomic under concurrent emit; backup path skips xAPI when primary flush fails; compound persistence waits for resume hydration before saving.
- **@lessonkit/react**: `autoCheck` retry no longer locks out learners in DragTheWords and FillInTheBlanks; resume telemetry replay for drag, fill, and hotspot blocks.
- **@lessonkit/core**: `markCourseStarted` returns a boolean; in-flight telemetry batches included in `flushOnExit`.
- **@lessonkit/xapi**: successful queue delivery removes statements by id; `flushOnExit` skips in-flight head; fetch transport with timeout, retry, and keepalive pagehide delivery.
- **@lessonkit/lxpack**: strict React manifest parity (comment stripping, `.jsx`/`.js` scan, constant indirection, fail on missing source); promote lock checks PID liveness before TTL expiry.
- **@lessonkit/accessibility** / **@lessonkit/themes**: CSS selector escaping hardening, cloned theme presets, roving focus and trap filtering improvements.

## [1.3.0] - 2026-06-04

Framework **1.3.x** — `SlideDeck` (H5P Course Presentation). `@lessonkit/core`, `@lessonkit/react`, `@lessonkit/lxpack`, `@lessonkit/xapi`, `@lessonkit/themes`, `@lessonkit/accessibility`, and `@lessonkit/cli` ship at **1.3.0**.

### Added

- **@lessonkit/core**: `SLIDE_ALLOWED_CHILD_TYPES`, `SLIDE_DECK_ALLOWED_CHILD_TYPES`; `slide_viewed` in telemetry catalog v3.
- **@lessonkit/react**: `Slide`, `SlideDeck`; `useCompoundKeyboardNav` (Arrow keys, Home, End); block catalog v3 entries for Course Presentation.
- **@lessonkit/xapi**: xAPI mapping for `slide_viewed`.
- Example: `examples/slide-deck` — golden path for slide navigation, scoring, and session resume.
- **Docs**: [MIGRATION-1.2-to-1.3.md](docs/MIGRATION-1.2-to-1.3.md); H5P capability map marks `H5P.CoursePresentation` → `SlideDeck` as shipped.

### Fixed

- **@lessonkit/core**: compound resume accepts one-level string-key maps in child state (DragTheWords, FillInTheBlanks, DragAndDrop round-trip); shared volatile session ID across provider and compound hooks; `course_started` dedupe when session storage write fails; batched telemetry partial-flush redelivery and `onTelemetryBufferDrop` observability.
- **@lessonkit/react**: duplicate `assessment_answered` on resume for drag/fill blocks; compound persistence merges live handle state on save; FindHotspot resets when props change; compound containers use provider `StoragePort`.
- **@lessonkit/xapi**: queue no longer drops the oldest non-head event during flush; interaction xAPI mapping guards missing `blockId`.
- **@lessonkit/lxpack**: symlink-aware path containment for packaging inputs; fail closed on error-severity build issues in CLI `package`; `remapArtifactPaths` throws on escape.
- **@lessonkit/cli**: packaging warnings filter respects issue severity.

## [1.2.0] - 2026-06-03

Framework **1.2.x** — Compound containers, resume state, and Tier C/D P0 blocks. `@lessonkit/core`, `@lessonkit/react`, `@lessonkit/lxpack`, `@lessonkit/xapi`, `@lessonkit/themes`, and `@lessonkit/accessibility` ship at **1.2.0**.

### Added

- **@lessonkit/core**: `CompoundHandle`, `CompoundResumeState`, compound session storage v2, `compoundAllowlists`, telemetry catalog v3 (`book_page_viewed`, content interaction events).
- **@lessonkit/react**: `Page`, `InteractiveBook`, `Text`, `Heading`, `Image`; Tier C/D blocks (`Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider`, `FindHotspot`, `FindMultipleHotspots`); `AssessmentSequence` implements `CompoundHandle`; `block-catalog.v3.json` (default `buildBlockCatalog({ version: 3 })`).
- **@lessonkit/lxpack**: `findHotspot` / `findMultipleHotspots` assessment descriptor kinds.
- Example: `examples/interactive-book`, **`examples/framework-12-showcase`** (full 1.2 catalog), **`examples/framework-11-showcase`** (full 1.1 foundation + P0 assessments).
- **Docs**: [MIGRATION-1.1-to-1.2.md](docs/MIGRATION-1.1-to-1.2.md); ROADMAP 1.2.x milestone; H5P capability map updates; onboarding funnel ([Getting started in 5 minutes](docs/guides/react-developers/getting-started-in-5-minutes.md), [Glossary](docs/reference/glossary.md), [API reference index](docs/reference/api.md), [ARCHITECTURE.md](https://github.com/eddiethedean/lessonkit/blob/main/ARCHITECTURE.md), [CODE_OF_CONDUCT.md](https://github.com/eddiethedean/lessonkit/blob/main/CODE_OF_CONDUCT.md), [good first contributions](docs/project/good-first-contributions.md)).
- Library Skills remote installer: `library-skills/install-remote.sh`.
- GitHub Actions workflow to publish Storybook to GitHub Pages (`.github/workflows/storybook-pages.yml`).
- **@lessonkit/core**: Headless `createLessonkitRuntime` runs plugin telemetry hooks and `scoreAssessment`; `buildPluginContext` exported.

### Changed

- **`buildBlockCatalog()`** defaults to **catalog v3** (use `{ version: 2 }` to keep the 1.1.x shape).
- **`AssessmentSequence`** implements `CompoundHandle` and may surface parent-level scores when using a ref.
- **`persistCompoundState`** defaults to **`true`**; provide a unique `blockId` on each compound container to avoid shared `sessionStorage` keys.
- **`runtimeVersion: "v1"`** logs a development deprecation warning; **v2** remains the default.
- README and quickstart: npm-first funnel, `npm run dev`, package install table, examples index.
- npm package `homepage` fields point to Read the Docs.
- `lessonkit init` template pins `^1.2.0` for `@lessonkit/*`; CLI template Vitest aligned to v4.x.

## [1.1.0] - 2026-06-03

Framework **1.1.x** — Assessment contract and Tier B P0 blocks. All seven `@lessonkit/*` packages ship at **1.1.0**.

### Added

- **@lessonkit/core**: `AssessmentHandle`, `AssessmentBehaviour`, `AssessmentXAPIData`, `AssessmentInteractionType`; telemetry events `assessment_answered` and `assessment_completed`; `telemetry-catalog.v2.json` and `buildTelemetryCatalogV2()`.
- **@lessonkit/react**: `TrueFalse`, `FillInTheBlanks`, `DragAndDrop`, `DragTheWords`, `MarkTheWords`, `AssessmentSequence`; `useAssessmentState`; `block-catalog.v2.json` and `block-contract.v2.json` (`blockCatalogVersion` 2 via `buildBlockCatalog({ version: 2 })`, default).
- **@lessonkit/xapi**: xAPI mapping for `assessment_answered` / `assessment_completed`.
- **@lessonkit/lxpack**: Discriminated `AssessmentDescriptor` (`mcq`, `trueFalse`, `fillInBlanks`); `trueFalse` converts to MCQ for LMS shell packaging; `assessment_completed` forwards to LXPack bridge.
- **Example**: `examples/assessments-p0` — golden path for P0 blocks and SCORM 1.2 packaging.
- **Docs**: [MIGRATION-1.0-to-1.1.md](docs/MIGRATION-1.0-to-1.1.md).

### Changed

- `lessonkit init` template pins `^1.1.0` for `@lessonkit/*`.
- `Quiz` / `KnowledgeCheck` props remain `McqAssessmentDescriptor` (unchanged MCQ shape).

### Fixed

- **@lessonkit/react:** `TrueFalse` feedback respects plugin `passed`; `passingScore` applied in `scoreFromCustom`; `autoCheck` dedupes `assessment_answered`; empty FIB/DragTheWords templates and zero-token `MarkTheWords` show author-facing errors.
- **Docs / policy:** Version badges, SECURITY supported versions, README migration link, broken CHANGELOG paths.

## [1.0.2] - 2026-06-01

Patch release: telemetry and course-lifecycle correctness, contributor DX, integration test determinism, session storage hardening, and Vitest 4 security upgrade.

### Fixed

- **@lessonkit/react**: `course_started` tracking dedupe is marked only after `tracking.flush()` so batched `batchSink` delivery cannot be lost while session storage blocks retry.
- **@lessonkit/react**: `Lesson` auto-complete on unmount no longer emits `lesson_completed` under the wrong `courseId` when the provider switches courses (conditional lesson trees / `key={courseId}`).
- **@lessonkit/react**: `course_started` non-tracking pipeline awaits async `extraSinks` before marking pipeline delivery (failures retry).
- **@lessonkit/react**: Dev-only `<Quiz>` outside `<Lesson>` no longer violates Rules of Hooks (wrapper + `QuizInner`).
- **@lessonkit/react**: `completeLesson` accepts optional `{ courseId }` and ignores completions when the live provider course differs.
- **@lessonkit/xapi**: Duplicate `send()` while an in-flight statement fails schedules a retry after the flight completes (success path still dedupes in-flight sends).
- **@lessonkit/core**: `createTrackingClient()` throws when `batchSink` is set with `batch.enabled: false`.
- **@lessonkit/core**: `createSessionStoragePort()` falls back to in-memory storage when `sessionStorage` is `null` or throws on access (embedded / restricted contexts).
- **@lessonkit/lxpack**: Bridge resolution falls back to `parent.lxpackBridge.v1` when the SDK helper returns null.
- **@lessonkit/lxpack**: Descriptor validation failures report `courseDir` as the staged course directory (`outDir`), not the packaging output path.
- **Integration tests**: `package --no-build` failure test removes copied `dist/` so a local fixture build cannot make the test pass spuriously.

### Changed

- **Monorepo**: Root `pretest` runs `build:packages` before `npm test` so workspace tests use current `@lessonkit/*` dist artifacts.
- **DevDependencies**: Vitest and `@vitest/coverage-v8` upgraded to **4.1.8** (addresses GHSA-5xrq-8626); removed deprecated `coverage.all` from Vitest configs.
- **`lessonkit init` template**: Pins `^1.0.2` for `@lessonkit/*`.

## [1.0.1] - 2026-05-31

Patch release: stronger TypeScript typing across the monorepo with no intended runtime API breaks.

### Fixed

- **@lessonkit/react**: Do not mark `course_started` as delivered to the tracking sink when a telemetry plugin filters the event; retries when tracking enables after xAPI bootstrap or when the filter is removed.
- **@lessonkit/react**: Strict `course_started` delivery for lxpack bridge and `extraSinks` with a pipeline dedupe flag; retry bridge/`extraSinks` when session and tracking marks are set but pipeline delivery failed; honor telemetry plugins in xAPI bootstrap; avoid duplicate xAPI bootstrap after pipeline delivery.
- **@lessonkit/xapi**: `flush()` awaits in-flight direct transport sends, not only the queued batch.
- **@lessonkit/lxpack**: Validate `outDir`, manifest paths, `output`, and absolute `--out` overrides with `realpath` (blocks symlink escapes); harden promote with unique temp dirs and clear errors for legacy `.bak` / `.tmp-promote` artifacts.
- **@lessonkit/lxpack**: Reject Windows drive-relative SPA paths (`C:foo`); coerce manifest `schemaVersion: "1"` (string); trim manifest `name`; reject `paths.spaDistDir` of `.` only.
- **@lessonkit/lxpack**: Case-insensitive path-under-root checks and `path.relative` remapping for Windows-style artifact paths.
- **@lessonkit/cli**: Forward extra Vite CLI args on `lessonkit build`; `package --no-build` fails fast when `dist/` is missing; `--force` requires `--here`.
- **@lessonkit/core**: `hasCourseStartedPipelineDelivered` / `markCourseStartedPipelineDelivered` session helpers (used by React provider retries).
- **Integration tests**: Await golden-example Vite build in `beforeAll` so `lessonkit package --target standalone` does not race a missing `dist/`.

### Changed

- **All `@lessonkit/*` packages**: Discriminated telemetry/CLI result types, ID parse helpers, `validateDescriptor(unknown)`, stricter theme validation, exported component prop types, and `@typescript-eslint/no-explicit-any` enforcement.
- **`lessonkit init` template**: Pins `^1.0.1` for `@lessonkit/*`.

## [1.0.0] - 2026-05-30

**Stable public API.** See [MIGRATION-0.x-to-1.0.md](docs/MIGRATION-0.x-to-1.0.md).

### Fixed

- **@lessonkit/react**: Emit `course_started` to the tracking sink when xAPI bootstraps first and tracking is enabled later (without duplicating xAPI statements).
- **@lessonkit/core**: Track `course_started` delivery to the tracking sink separately from xAPI/session dedupe marks.
- **@lessonkit/xapi**: Coalesce concurrent `flush()` calls so queued statements are not sent twice.
- **@lessonkit/react**: Default `Quiz` `passingScore` to the assessment plugin `maxScore` when the prop is omitted.
- **@lessonkit/lxpack**: Fix cross-platform `remapArtifactPaths` prefix checks and Windows output path joining.
- **@lessonkit/lxpack**: Restore staged package content when promote fails and `outDir` did not exist yet.
- **library-skills**: Fix `install.sh` default (global only), `validate.sh` path in `lessonkit-author`, and packaging output path notes.
- **Tooling**: Add ESLint (flat config) with CI lint step and library-skills install/validate smoke in packaging CI.

### Post-release maintenance (1.0.0 line)

Shipped on `main` without a semver bump (packages remain **1.0.0**): Node **18+** for LMS packaging; quiz/lesson/provider hardening; LXPack staging validation; library-skills and CI template parity; items previously listed here through the first 1.0.0 release.

### Fixed (1.0.0 maintenance)

- **@lessonkit/core**: Isolate sync and async telemetry sink failures so one sink cannot block others or crash callers.
- **@lessonkit/core**: Catch async rejections from non-batch `tracking.sink` (dev warning).
- **@lessonkit/core**: Skip duplicate `lesson_started` when re-activating an already completed lesson (headless runtime).
- **@lessonkit/react**: Bootstrap xAPI `course_started` on new clients after remount (Strict Mode / transport swap).
- **@lessonkit/react**: Reset headless runtime and progress when `runtimeVersion` toggles between v1 and v2.
- **@lessonkit/react**: Skip duplicate `lesson_started` when remounting a completed lesson (v1 progress path).
- **@lessonkit/lxpack**: Reject `course` arrays in `parseLessonkitManifest` (clear validation message).
- **@lessonkit/lxpack**: Preserve failed promote builds as `.lk-failed-promote-*` when `outDir` already exists.
- **@lessonkit/lxpack**: Resolve SPA and `outputBaseDir` paths with `realpath` under `projectRoot`.
- **@lessonkit/lxpack**: Swallow host bridge throws when forwarding telemetry (dev warning).
- **@lessonkit/xapi**: Map `quiz_answered.correct` to xAPI `result.success`.
- **@lessonkit/xapi**: Skip duplicate in-flight `send()` calls for the same statement `id`.
- **@lessonkit/cli**: Clarify `--force` help text; README points at bundled template source.
- **@lessonkit/xapi**: Add Node **18+** `engines`; README notes header aligned with 1.0.0.
- **@lessonkit/react**: Split `course_started` bootstrap so tracking dedupe is marked before xAPI/bridge pipeline retries (no duplicate tracking events on partial failure).
- **@lessonkit/react**: Forward `course_started` to lxpack bridge and `extraSinks` when tracking enables after xAPI bootstrap.
- **@lessonkit/cli**: Launch Vite via `node …/vite/bin/vite.js` so `dev` and `build` work on Windows (no `.cmd` spawn).
- **@lessonkit/lxpack**: `loadLessonkitManifestFromFile` accepts optional `projectRoot` for path validation; trim manifest `paths.*` values; reject unsafe relative `output` without `projectRoot`.
- **@lessonkit/lxpack**: Promote double-failure throws a recovery message listing `.lk-backup-*` and `.lk-failed-promote-*` paths.
- **Docs**: Fix staged packaging example in `docs/PACKAGING.md` for 1.0 `validatePackageInputs` API.

### Added

- **Library Skills** (`library-skills/`) — Agent Skills (`SKILL.md`) for Cursor, Claude Code, and compatible agents: `lessonkit-author`, `lessonkit-packaging`, `lessonkit-telemetry`, `lessonkit-migrate`; `install.sh` and [docs/guides/library-skills.md](docs/guides/library-skills.md).
- **Storybook** for `@lessonkit/react` (`npm run storybook`) — Course/Lesson layouts, Quiz states, block stories; CI `build-storybook` job.
- **Docs:** [Core reference](docs/reference/core.md), [LXPack bridge reference](docs/reference/lxpack-bridge.md); updated plugins, packaging, and migration guides.

### Changed

- **`runtimeVersion: "v2"`** is the default headless runtime in `@lessonkit/react`.
- Monorepo packages bumped to **1.0.0**; `lessonkit init` template pins `^1.0.0`.

### Removed (breaking)

- `buildTrackEvent` / `tryBuildTrackEvent` — use `buildTelemetryEvent` / `tryBuildTelemetryEvent`.
- `defineLessonkitPlugin` / `createPluginHost` — use segregated plugin helpers and `createPluginRegistry`.
- `setLxpackBridgeMode` — bridge mode is per-call via `@lessonkit/lxpack/bridge`.

## [1.0.0-beta.1] - 2026-05-29

SOLID monorepo refactor: headless runtime, telemetry pipeline, segregated plugins, LXPack manifest/packaging stages.

### Added

- **`@lessonkit/core`**: `buildTelemetryEvent`, `TelemetryPipeline`, segregated plugin types (`TelemetryPlugin`, `AssessmentPlugin`, `LifecyclePlugin`), `createPluginRegistry`, `createLessonkitRuntime`, shared `ports` / `progress` / `session` modules.
- **`@lessonkit/lxpack`**: `parseLessonkitManifest`, `dispatchBridgeAction`, `forwardTelemetryToBridge`, packaging stages `validatePackageInputs`, `buildStagingPackage`, `promoteStagingToOutDir`.
- **Docs**: [MIGRATION-0.x-to-1.0.md](docs/MIGRATION-0.x-to-1.0.md).

### Changed

- **`@lessonkit/react`**: `LessonkitProvider` delegates to `useLessonkitProviderRuntime`; `runtimeVersion: "v2"` and `sinks` config; bridge via `@lessonkit/lxpack/bridge`.
- **`@lessonkit/cli`**: Manifest parsing delegates to `@lessonkit/lxpack`.
- Monorepo packages bumped to **1.0.0-beta.1**.

### Deprecated (removed in 1.0.0)

- `defineLessonkitPlugin` / `createPluginHost` — use segregated plugin helpers and `createPluginRegistry`.
- React-local `buildTrackEvent` — use `buildTelemetryEvent` from core.
- Legacy `tracking` / `xapi` split config — use `TelemetryPipelineSink[]`.

## [0.9.3] - 2026-05-29

### Changed

- Monorepo packages bumped to **0.9.3**.
- **`Quiz` / `KnowledgeCheck`**: Optional `passingScore` prop (default `1`) forwarded to telemetry and the LXPack bridge.

### Fixed

- **@lessonkit/cli**: `lessonkit init` uses `@lessonkit/core` `slugifyId()` so numeric or invalid directory names produce valid `courseId` values (e.g. `9th-grade` → `id-9th-grade`).
- **@lessonkit/core**: `composeTrackingSink` preserves stateful wrapper closures across events while still refreshing context when `courseId` / session changes.
- **@lessonkit/react**: `wrapTrackingSink` no longer re-composes the sink on every telemetry event (fixes broken stateful analytics wrappers).
- **@lessonkit/react**: `Quiz` resets answer state when `courseId` changes in-app.
- **@lessonkit/react**: Provider unmount captures the xAPI client before async flush (avoids remount race).
- **@lessonkit/react**: `completeCourse()` completes the active in-progress lesson before marking the course complete.
- **@lessonkit/lxpack**: `per-lesson-spa` `lessonSpaDirs` paths are validated under `projectRoot` when set.

## [0.9.2] - 2026-05-29

### Added

- **`@lessonkit/integration`**: Vitest integration workspace (`npm run test:integration`) — real CLI `init` / `build` / `package` pipeline, golden target matrix, descriptor parity guards.
- **E2E**: Playwright launch specs for SCORM 2004 (`API_1484_11` mock), xAPI, and cmi5 packages; global-setup packages all golden LMS artifacts.
- **CI**: **Integration (Node 20)** job in [`.github/workflows/checks.yml`](https://github.com/eddiethedean/lessonkit/blob/main/.github/workflows/checks.yml).

### Changed

- Monorepo packages bumped to **0.9.2**.
- **`examples/lxpack-golden`**: `tracking.xapi.activityIri` for xAPI / cmi5 packaging and export parity.

### Fixed

- **@lessonkit/react**: Plugin `onTelemetryBatch` and `wrapTrackingSink` use fresh `courseId` / session context at delivery time (fixes stale context after in-app `courseId` changes with batched tracking).
- **@lessonkit/react**: Flush batched telemetry before emitting `course_started` when `courseId` changes.
- **@lessonkit/react**: `Quiz` feedback reflects `scoreAssessment` result (not only `props.answer`).
- **@lessonkit/react**: `scoreAssessment` without explicit `passed` and with `maxScore` 0 or unset falls back to answer matching (no longer treats any `score > 0` as pass).
- **@lessonkit/react**: `course_started` session dedupe is marked only after a successful emit (sink failures can retry).
- **@lessonkit/cli**: Stricter `lessonkit.json` validation (`paths` types, `course.lessons` / `course.assessments` arrays, `course.spaDistDir` vs `paths.spaDistDir` conflict).
- **@lessonkit/cli**: `react-vite` package target uses `INVALID_PROJECT` when `dist` is missing after build.
- **@lessonkit/lxpack**: Reject `output` paths outside `projectRoot` when `projectRoot` is set (direct API use).
- **@lessonkit/cli**: `lessonkit init` resolves bundled template when CLI runs from `dist/bin.js` (fixes template path for published CLI).

## [0.9.1] - 2026-05-29

### Added

- **E2E telemetry harness** (`e2e/fixtures/telemetry-harness/`): Playwright project for telemetry batching and xAPI queue behavior via `window.__e2e`.
- **E2E**: Expanded keyboard coverage on golden Vite (lesson nav, knowledge check).
- **Docs**: Conformance matrix table and CI job map in [export parity guide](docs/guides/react-developers/export-parity.md); expanded [`e2e/README.md`](https://github.com/eddiethedean/lessonkit/blob/main/e2e/README.md); [contributing E2E section](docs/guides/react-developers/contributing-to-the-monorepo.md#e2e-and-conformance).
- **`PluginHost.deliverTelemetryBatch`**: batch flush hook for events already filtered at emit time (avoids double `onTelemetry` passes).

### Changed

- Monorepo packages bumped to **0.9.1**; **0.9.x conformance harness** milestone complete per [ROADMAP](docs/project/roadmap.md).
- **`@lessonkit/core`**: `TrackingClient.flush` / `dispose` may return `Promise<void>`; batched `dispose` drains the buffer after in-flight flushes complete.
- **`@lessonkit/react`**: Provider unmount awaits tracking flush/dispose; `setActiveLesson` flushes batched telemetry after auto-completing the previous lesson.

### Fixed

- **@lessonkit/react**: Duplicate course-level xAPI `initialized` when tracking starts disabled and is enabled later with a transport (bootstrap now marks `course_started` in session storage).
- **@lessonkit/react**: Plugin `batchSink` no longer re-runs `onTelemetry` on buffered events (prevents silent drops from stateful plugins).
- **@lessonkit/react**: `Quiz` / `KnowledgeCheck` honor `scoreAssessment` plugins from `LessonkitProvider`.
- **@lessonkit/react**: Dev warning and flush when `courseId` changes with an injected `config.xapi.client`.
- **@lessonkit/lxpack**: Validate `outDir` / `outputBaseDir` when `projectRoot` is set; allow `./dist`-style paths; log promote restore failures.
- **@lessonkit/cli**: Pass `projectRoot` into packaging; map unsafe `--out` paths to `CliError` (`INVALID_PROJECT`); harden `lessonkit init` JSX string escaping.
- **E2E**: Telemetry harness batching spec drains startup lifecycle events before asserting quiz batch coalescing.

## [0.9.0] - 2026-05-29

### Added

- **Plugin architecture (v1)** in `@lessonkit/core` / `@lessonkit/react`: `LessonkitPlugin`, `createPluginHost`, `config.plugins` on `LessonkitProvider` (telemetry hooks, sink wrapping, assessment scoring slot).
- **Docs**: [plugins reference](docs/reference/plugins.md), [plugin cookbook](docs/guides/react-developers/plugin-cookbook.md), example `consoleAnalyticsPlugin`.
- **Conformance harness** (`e2e/`): Playwright e2e for `examples/lxpack-golden` on Vite preview, standalone, and SCORM 1.2 (LMS API mock).
- **CI**: `@lxpack/conformance` packaging matrix, golden package matrix, and `test:e2e` job (Node 20).
- **Docs**: [export parity guide](docs/guides/react-developers/export-parity.md), `e2e/README.md`, contributor notes for conformance.

### Changed

- Monorepo packages bumped to **0.9.0**; focus milestone is export parity before framework 1.0.

### Fixed

- **@lessonkit/react**: Emit one course-level xAPI `initialized` statement when both tracking and xAPI transport are configured (removed duplicate bootstrap send on provider mount).

## [0.8.2] - 2026-05-29

### Changed

- **@lessonkit/lxpack**: Bump `@lxpack/api`, `@lxpack/spa-bridge`, `@lxpack/validators`, and `@lxpack/tracking-schema` to **^0.6.0**; `packageLessonkitCourse()` uses LXPack `packageLessonkit()` instead of hand-built YAML + separate validate/build.
- **@lessonkit/lxpack**: `descriptorToInterchange()` includes `runtime`, `assessments`, and interchange types from `@lxpack/validators`; `writeLxpackProject()` delegates to `materializeLessonkitProject()` (removed local YAML emitters).
- **@lessonkit/lxpack/bridge**: Re-export `@lxpack/spa-bridge` and `mapLessonkitTelemetryToBridgeAction` from `@lxpack/tracking-schema`; `telemetryEventToLessonkit()` adapts `@lessonkit/core` events.
- **@lessonkit/react**: Forward telemetry to the LXPack bridge via the shared tracking map (replacing hand-rolled switch).
- **@lessonkit/lxpack**: Export `materializeLessonkitProject`, `parseLessonkitInterchange`, and `lessonkitInterchangeSchema` for advanced tooling.

## [0.8.1] - 2026-05-29

### Fixed

- **@lessonkit/react**: Reset progress synchronously on `courseId` change so child `<Lesson>` effects cannot emit completions under the wrong course id.
- **@lessonkit/react**: Revert to tab/auto `sessionId` when `session.sessionId` is cleared from config.
- **@lessonkit/react**: Skip `course_started` storage/delivery while `tracking.enabled` is `false`; emit when tracking is re-enabled.
- **@lessonkit/react**: Reset `Quiz` state when `answer` or `question` changes; cancel pending dispose timers on provider remount.
- **@lessonkit/react**: Remove stale `course_started` storage keys after session id migration.
- **@lessonkit/cli**: Validate `lessonkit.json` `paths.*` and `package --out` stay under the project root.
- **@lessonkit/cli**: `init --force` only allowed when the target directory is empty or contains dotfiles only; template uses `{{courseId}}` / `{{courseTitle}}` placeholders.
- **@lessonkit/lxpack**: `validateProjectPaths`, `resolveSafePackageOutputOverride`; validate custom theme and completion threshold in `validateDescriptor`; `writeLxpackProject` resolves relative `spaDistDir` under optional `projectRoot`.
- **@lessonkit/lxpack/bridge**: Scale `passingScore` to 0–1 when `maxScore` is provided (matches `normalizeAssessmentScore`); clamp normalized scores to 1.
- **@lessonkit/lxpack**: Atomic promote of packaged `outDir` so a failed `rename` does not delete the previous course tree.
- **@lessonkit/lxpack**: Validate `passingScore` as absolute points (not capped by choice count); remap nested `build.outputPath` / `outputDir` after staging promote.
- **@lessonkit/react**: Emit `course_started` before `lesson_started` when `courseId` changes; reset xAPI queue on `courseId` change.
- **@lessonkit/react**: Harden tracking client dispose on provider unmount.
- **@lessonkit/react**: Skip xAPI client creation when no transport/client unless `xapi.enabled: true`; flush batched tracking on `completeCourse`; migrate `course_started` dedup when `session.sessionId` changes.
- **@lessonkit/cli**: Honor `--no-build` for `react-vite` package target; clarify `init --force` (only with `--here`).
- **Examples**: `lessonkit.json` for react-vite, data-privacy, and customer-service; golden `course.descriptor.ts` sync; `examples/lxpack-golden/README.md` documents `single-spa` lesson ids.
- **Docs**: README license Apache-2.0; ROADMAP framework status 0.8.1.
- **@lessonkit/react**: Migrate `course_started` dedup when `session.sessionId` is first supplied after a tab auto-id (including from stored tab session).
- **@lessonkit/react**: Reset `Quiz` completion state when `checkId` changes on a mounted instance.
- **@lessonkit/react**: Ignore stale xAPI flush work after transport/client/courseId layout effect cleanup.
- **Examples**: `react-vite` manifest theme preset matches App (`brand`); `lxpack-golden` renames in-SPA lesson `safety-signoff` (distinct from assessment `checkId`) and aligns welcome lesson title with the app.
- **Docs**: CLI and guide version callouts updated to 0.8.1.

## [0.8.0] - 2026-05-28

### Added

- **@lessonkit/react**: Runtime block catalog v1 — `buildBlockCatalog()`, `getBlockCatalogEntry()`, `BLOCK_CATALOG`, `blockCatalogVersion`.
- **@lessonkit/react**: Machine-readable `@lessonkit/react/block-catalog.v1.json` and JSON Schema `@lessonkit/react/block-contract.v1.json`.
- **Docs**: [`docs/BLOCK_CATALOG.md`](docs/reference/block-catalog.md) and [block catalog reference](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html).
- **Examples**: `examples/lxpack-golden` demonstrates every catalog block (`KnowledgeCheck`, optional `blockId` on Scenario/Reflection).

### Changed

- Monorepo packages bumped to **0.8.0**.
- **Docs**: Block catalog reference complete; vibe-coding and components guides link to block catalog.

## [0.7.0] - 2026-05-28

### Added

- **@lessonkit/cli**: Real `init`, `dev`, `build`, and `package` commands with dual export (`react-vite` + LMS targets via `@lessonkit/lxpack`).
- **`lessonkit.json` v1**: Canonical project manifest for packaging.
- **CLI**: Structured errors, stable exit codes, `--json` output mode, `--skip-install` / `--force` for automation.
- **Template bundling**: Vite + React starter copied into `@lessonkit/cli` for `lessonkit init`.
- **Docs**: [`docs/CLI.md`](docs/reference/cli.md).
- **CI**: CLI packaging smoke step on golden example.

### Changed

- Monorepo packages bumped to **0.7.0**.
- **`examples/lxpack-golden`**: Packaging scripts use `lessonkit package` instead of custom `tsx` script.
- **`templates/vite-react`** and golden example include `lessonkit.json`.
- **Starter template**: `ThemeProvider` defaults to `preset="default"` / `mode="light"` to match `lessonkit.json`.

### Fixed

- **@lessonkit/cli**: `paths.outputBaseDir` is honored when resolving package artifacts; `lessonkit build` passes Vite `--outDir` when `paths.spaDistDir` is not `dist`.
- **@lessonkit/cli**: Project discovery requires `schemaVersion: 1` (ignores LXPack interchange `lessonkit.json` under `.lxpack/course`).
- **@lessonkit/cli**: `lessonkit init` patches `src/App.tsx` `courseId` and course title to match the manifest; rejects `per-lesson-spa` for `lessonkit package`.
- **@lessonkit/lxpack**: Descriptor validation requires `layout` and validates `theme.preset`.
- **@lessonkit/react**: `completeLesson` clears `activeLessonId`; provider unmount flushes pending lesson completions before disposing the active tracking client; `courseId` changes re-activate mounted lessons.

## [0.6.0] - 2026-05-28

### Added

- **@lessonkit/lxpack**: New package — `LessonkitCourseDescriptor`, `writeLxpackProject`, `packageLessonkitCourse`, `validateLessonkitProject`, `buildLessonkitProject`; `themeToLxpackRuntime`; `single-spa` and `per-lesson-spa` layouts; assessment export; browser bridge (`@lessonkit/lxpack/bridge`).
- **@lessonkit/react**: Forwards `lesson_completed`, `course_completed`, and `quiz_completed` to `window.parent.lxpackBridge.v1` when embedded (`config.lxpack.bridge`, default `auto`).
- **Examples**: `examples/lxpack-golden` — build + SCORM 1.2 / standalone packaging scripts.
- **CI**: Node 20 packaging smoke job (golden example → SCORM ZIP).
- **Docs**: [`docs/PACKAGING.md`](docs/reference/packaging.md); LXPack id mapping in [`docs/IDENTITY.md`](docs/reference/identity.md); theme parity in [`docs/THEMING.md`](docs/reference/theming.md).

### Changed

- Monorepo packages bumped to **0.6.0**.
- Root `build:packages` includes `@lessonkit/lxpack` (requires Node 20+ for consumers of the adapter).
- **@lessonkit/react**: Depends on `@lessonkit/lxpack` for shared LXPack bridge score normalization.

### Fixed

- **@lessonkit/lxpack**: Reject unsafe `spaPath` values and verify copy destinations stay inside the project root.
- **@lessonkit/lxpack**: Normalize trimmed ids/titles in validated descriptors; validate `spaLessonId`, duplicate `spaPath`, and assessment `passingScore` / choices.
- **@lessonkit/lxpack**: Clear stale SPA output before re-copy; stage packaging in a temp dir so failed runs do not overwrite a good `outDir`.
- **@lessonkit/lxpack**: Export `normalizeAssessmentScore` / `normalizeAssessmentPassingScore` from `@lessonkit/lxpack/bridge`.
- **@lessonkit/react**: LXPack bridge skips `submitAssessment` when `quiz_completed` has no finite score (no longer defaults to 100%).
- **@lessonkit/react**: Lifecycle telemetry uses canonical `lessonId` when `data.lessonId` conflicts.
- **@lessonkit/react**: Reset progress and emit `course_started` when `courseId` changes; send `course_started` to xAPI when the client is enabled after mount.
- **@lessonkit/xapi**: Dev warning when xAPI transport fails and a statement is re-queued.

## [0.5.0] - 2026-05-28

### Added

- **@lessonkit/core**: Identity v1 — `validateId`, `slugifyId`, `deriveId`, `buildLessonkitUrn`; typed `TelemetryEvent` payloads; `TELEMETRY_EVENT_CATALOG` / `telemetry-catalog.v1.json`; `identity-contract.v1.json`.
- **@lessonkit/xapi**: `telemetryEventToXAPIStatement()` — canonical mapping from telemetry to xAPI object URNs.
- **Docs**: [`docs/IDENTITY.md`](docs/reference/identity.md), [`docs/TELEMETRY.md`](docs/reference/telemetry.md).

### Changed

- **@lessonkit/react**: xAPI emission goes through the telemetry mapper after each `track()` (single path for lifecycle and quiz events).
- **@lessonkit/xapi**: `createXAPIClient` uses `courseId` and the mapper internally for lifecycle helpers.

### Breaking

- **@lessonkit/react**: `courseId` required on `Course` and `LessonkitProvider`; `lessonId` required on `Lesson` (removed `useId()` lesson fallback); `checkId` required on `Quiz` / `KnowledgeCheck`.
- **@lessonkit/react**: `useQuizState().answer` / `.complete` require `checkId` in their payloads.
- **@lessonkit/react**: Removed exported `sanitizeLessonId`.
- **@lessonkit/core**: All telemetry events require `courseId`; event `data` shapes are discriminated by event name.
- **@lessonkit/xapi**: Clients without `courseId` no longer emit lifecycle statements; default `urn:lessonkit` base id removed.

### Fixed

- **@lessonkit/react**: `setActiveLesson` completes the previously active lesson when switching ids (tab/programmatic navigation).
- **@lessonkit/react**: `<Lesson>` defers completion on unmount so React Strict Mode does not emit spurious `lesson_completed` events in development.
- **@lessonkit/react**: Progress state uses `createProgressController()` (single implementation shared with tests).
- **@lessonkit/react**: Dev-only warnings for invalid `courseId` / `lessonId` / `checkId`; xAPI mapping skips invalid ids with a dev warning instead of throwing.
- **@lessonkit/core**: Test asserts `identity-contract.v1.json` `idPattern` matches `ID_PATTERN`.

### Migration

See [`docs/IDENTITY.md`](docs/reference/identity.md): add `courseId`, `lessonId`, and `checkId` to your components; preserve IDs in source when regenerating.

## [0.4.0] - 2026-05-28

### Added

- **@lessonkit/themes**: Token schema v1 (colors, spacing, typography, radius, shadows), `validateTheme`, `mergeThemes`, `themeToCssVariables`, presets (`default`, `light`, `dark`, `brand`), `buildThemeCatalog`, published `theme-contract.v1.json` / `theme-catalog.v1.json`, optional `base.css`.
- **@lessonkit/react**: `ThemeProvider`, `useTheme`, and theme types; injects `--lk-*` CSS variables on `:root` or a scoped element.
- **Docs**: [`docs/THEMING.md`](docs/reference/theming.md) — CSS variable contract, merge precedence, generator catalog paths.
- **Examples/templates**: Showcase theme toggle (light / dark / system); styles migrated to `--lk-*` variables.

### Changed

- **@lessonkit/themes**: `LessonkitTheme` is now an alias for the full `LessonkitThemeV1` schema (breaking if you relied on the old partial shape without other token groups).

### Fixed

- **@lessonkit/themes** / **@lessonkit/react**: `preset="brand"` no longer forces dark palette colors when `mode` is `light` or `system` (brand merges `brandThemeOverrides` onto the active mode base).
- **@lessonkit/react**: `LessonkitProvider` uses shared `createXapiClientFromConfig` from `runtime/xapi` (no duplicate factory logic).
- **Docs**: Package READMEs and root example updated for 0.4.0; `SPEC.md` imports `@lessonkit/react`; theming docs clarify `preset="default"` vs `defaultTheme`.

## [0.3.1] - 2026-05-28

### Fixed

- **@lessonkit/react**: Use an isomorphic layout effect in `LessonkitProvider` to avoid SSR `useLayoutEffect` warnings while preserving client-side lifecycle behavior.
- **Repo**: Make `npm run typecheck` deterministic by building workspace package declarations first.
- **@lessonkit/react**: Silence expected React error output in the “missing provider” test while keeping the assertion.
- **@lessonkit/core**: Call `unref()` on batched telemetry flush timers so Node test runners and CLIs can exit cleanly.

### Changed

- **@lessonkit/core**, **@lessonkit/xapi**, **@lessonkit/react**: Internal module split (types, tracking client, xAPI queue/client, runtime session ports) with no intended public API changes.
- **@lessonkit/react**: Session and course-started persistence now go through a storage port (`runtime/session`).

## [0.3.0] - 2026-05-28

### Fixed

- **@lessonkit/react**: Move tracking and xAPI client lifecycle to `useLayoutEffect` (no dispose side effects in `useMemo`); stabilize batch config dependencies on primitive fields.
- **@lessonkit/react**: Persist tab-scoped `sessionId` via `sessionStorage` when `session.sessionId` is omitted; dedupe `course_started` across React Strict Mode remounts.
- **@lessonkit/react**: Flush shared xAPI queue when `xapi.transport` changes so queued statements are not dropped.
- **@lessonkit/react**: Flush batched telemetry on provider unmount; idempotent `completeLesson` / `completeCourse` telemetry.
- **@lessonkit/react**: `Quiz` emits `quiz_completed` on first correct answer; fieldset legend uses bundled visually-hidden styles (no `.sr-only` CSS required).

### Added

- **@lessonkit/accessibility**: `visuallyHiddenStyle` export for screen-reader-only UI without app CSS.
- **@lessonkit/react**: Depends on `@lessonkit/accessibility` for Quiz legend styling.

### Changed

- Root build order builds `@lessonkit/accessibility` before `@lessonkit/react`.
- Documentation updated for 0.3.0 (ROADMAP status, React README notes on lesson unmount and sessions).

## [0.2.0] - (unreleased on npm; included in 0.3.0)

Analytics and tracking milestone (shipped in repo before 0.3.0 hardening):

- Session-aware telemetry, optional batching (`@lessonkit/core`, `@lessonkit/react`).
- `LessonkitProvider` runtime config (tracking sink, `xapi.transport`, session metadata).
- xAPI in-memory queue, richer lesson completion results (`@lessonkit/xapi`).
- Vite React example and template with telemetry/xAPI wiring.

## [0.1.1] - 2026-05-27

Last version published to npm before 0.2.x.

- Initial public packages: `@lessonkit/core`, `@lessonkit/react`, `@lessonkit/xapi`, `@lessonkit/accessibility`, `@lessonkit/themes`, `@lessonkit/cli`.
- Tag-based publish workflow and CI checks (build, typecheck, test, coverage).

[1.2.0]: https://github.com/eddiethedean/lessonkit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/eddiethedean/lessonkit/compare/v1.0.2...v1.1.0
[0.5.0]: https://github.com/eddiethedean/lessonkit/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/eddiethedean/lessonkit/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/eddiethedean/lessonkit/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/eddiethedean/lessonkit/compare/v0.1.1...v0.3.0
