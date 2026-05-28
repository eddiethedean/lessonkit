# Changelog

All notable changes to the LessonKit monorepo are documented here. Published packages use the
[`@lessonkit/*`](https://www.npmjs.com/org/lessonkit) scope.

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
