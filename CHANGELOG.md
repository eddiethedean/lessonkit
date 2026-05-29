# Changelog

All notable changes to the LessonKit monorepo are documented here. Published packages use the
[`@lessonkit/*`](https://www.npmjs.com/org/lessonkit) scope.

## [0.9.2] - 2026-05-29

### Added

- **`@lessonkit/integration`**: Vitest integration workspace (`npm run test:integration`) — real CLI `init` / `build` / `package` pipeline, golden target matrix, descriptor parity guards.
- **E2E**: Playwright launch specs for SCORM 2004 (`API_1484_11` mock), xAPI, and cmi5 packages; global-setup packages all golden LMS artifacts.
- **CI**: **Integration (Node 20)** job in [`.github/workflows/checks.yml`](.github/workflows/checks.yml).

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
- **Docs**: Conformance matrix table and CI job map in [export parity guide](docs/guides/react-developers/export-parity.md); expanded [`e2e/README.md`](e2e/README.md); [contributing E2E section](docs/guides/react-developers/contributing-to-the-monorepo.md#e2e-and-conformance).
- **`PluginHost.deliverTelemetryBatch`**: batch flush hook for events already filtered at emit time (avoids double `onTelemetry` passes).

### Changed

- Monorepo packages bumped to **0.9.1**; **0.9.x conformance harness** milestone complete per [ROADMAP.md](ROADMAP.md).
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
- **Docs**: [`docs/BLOCK_CATALOG.md`](docs/BLOCK_CATALOG.md) and [block catalog reference](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html).
- **Examples**: `examples/lxpack-golden` demonstrates every catalog block (`KnowledgeCheck`, optional `blockId` on Scenario/Reflection).

### Changed

- Monorepo packages bumped to **0.8.0**.
- **Docs**: `STUDIO_READINESS.md` 0.8.x checklist complete; vibe-coding and components guides link to block catalog.

## [0.7.0] - 2026-05-28

### Added

- **@lessonkit/cli**: Real `init`, `dev`, `build`, and `package` commands with dual export (`react-vite` + LMS targets via `@lessonkit/lxpack`).
- **`lessonkit.json` v1**: Canonical project manifest for packaging and future Studio alignment.
- **CLI**: Structured errors, stable exit codes, `--json` output mode, `--skip-install` / `--force` for automation.
- **Template bundling**: Vite + React starter copied into `@lessonkit/cli` for `lessonkit init`.
- **Docs**: [`docs/CLI.md`](docs/CLI.md).
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
- **Docs**: [`docs/PACKAGING.md`](docs/PACKAGING.md); LXPack id mapping in [`docs/IDENTITY.md`](docs/IDENTITY.md); theme parity in [`docs/THEMING.md`](docs/THEMING.md).

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
- **Docs**: [`docs/IDENTITY.md`](docs/IDENTITY.md), [`docs/TELEMETRY.md`](docs/TELEMETRY.md).

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

See [`docs/IDENTITY.md`](docs/IDENTITY.md): add `courseId`, `lessonId`, and `checkId` to your components; preserve IDs in source when regenerating.

## [0.4.0] - 2026-05-28

### Added

- **@lessonkit/themes**: Token schema v1 (colors, spacing, typography, radius, shadows), `validateTheme`, `mergeThemes`, `themeToCssVariables`, presets (`default`, `light`, `dark`, `brand`), `buildThemeCatalog`, published `theme-contract.v1.json` / `theme-catalog.v1.json`, optional `base.css`.
- **@lessonkit/react**: `ThemeProvider`, `useTheme`, and theme types; injects `--lk-*` CSS variables on `:root` or a scoped element.
- **Docs**: [`docs/THEMING.md`](docs/THEMING.md) — CSS variable contract, merge precedence, generator catalog paths.
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

[0.5.0]: https://github.com/eddiethedean/lessonkit/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/eddiethedean/lessonkit/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/eddiethedean/lessonkit/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/eddiethedean/lessonkit/compare/v0.1.1...v0.3.0
