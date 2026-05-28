# Changelog

All notable changes to the LessonKit monorepo are documented here. Published packages use the
[`@lessonkit/*`](https://www.npmjs.com/org/lessonkit) scope.

## [0.3.1] - 2026-05-28

### Fixed

- **@lessonkit/react**: Use an isomorphic layout effect in `LessonkitProvider` to avoid SSR `useLayoutEffect` warnings while preserving client-side lifecycle behavior.
- **Repo**: Make `npm run typecheck` deterministic by building workspace package declarations first.
- **@lessonkit/react**: Silence expected React error output in the “missing provider” test while keeping the assertion.

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

[0.3.0]: https://github.com/eddiethedean/lessonkit/compare/v0.1.1...main
