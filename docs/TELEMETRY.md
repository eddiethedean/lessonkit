# Telemetry & xAPI (v1)

LessonKit emits versioned telemetry events from `@lessonkit/react` and maps them to xAPI via `@lessonkit/xapi`.

## Event catalog

- **Version:** `telemetryCatalogVersion = 1` (exported from `@lessonkit/core`)
- **JSON:** `@lessonkit/core/telemetry-catalog.v1.json` (must match `buildTelemetryCatalog()` in tests)
- **Types:** discriminated `TelemetryEvent` with required `courseId` on every event

| Event | When | Key `data` fields |
|-------|------|-------------------|
| `course_started` | First provider mount per tab session + course | — |
| `course_completed` | `completeCourse()` | — |
| `lesson_started` | Lesson becomes active | `lessonId` |
| `lesson_completed` | Lesson completed | `lessonId`, `durationMs?` |
| `lesson_time_on_task` | With `lesson_completed` when duration known | `lessonId`, `durationMs` |
| `quiz_answered` | Quiz choice selected | `checkId`, `question`, `choice`, `correct` |
| `quiz_completed` | First correct answer (built-in Quiz) or `useQuizState().complete()` | `checkId`, `score?`, `maxScore?` |
| `interaction` | Custom UI / branching via `track()` | `kind`, optional `blockId`, free-form fields |

Session fields on all events: `sessionId`, optional `attemptId`, optional `user`.

## xAPI mapping

Canonical mapper: `telemetryEventToXAPIStatement(event)` in `@lessonkit/xapi`.

| Telemetry | xAPI verb | Object URN |
|-----------|-----------|------------|
| `course_started` | initialized | `…:course:{courseId}` |
| `course_completed` | completed | `…:course:{courseId}` |
| `lesson_started` | initialized | `…:lesson:{lessonId}` |
| `lesson_completed` | completed | `…:lesson:{lessonId}` (+ `result.duration` when `durationMs` set) |
| `lesson_time_on_task` | *(none)* | Returns `null` — use `lesson_completed` for xAPI duration |
| `quiz_answered` | answered | `…:check:{checkId}` |
| `quiz_completed` | completed | `…:check:{checkId}` (+ score when provided) |
| `interaction` | experienced | `…:block:{blockId}` only when `lessonId` and `data.blockId` are set |

React runtime: after each `track()`, the provider calls the mapper and `xapi.send(statement)` when a statement is returned (single path; no duplicate lifecycle helpers).

## Custom interactions and blocks

For block-level xAPI on `interaction` events:

1. Set `blockId` on `Scenario` / `Reflection` (or pass `blockId` in interaction payload).
2. Ensure an active `lessonId` (normal when inside `Lesson`).
3. Call `track("interaction", { kind: "…", blockId: "my-block", … })`.

Without `blockId`, interaction events are tracked but do not emit xAPI.

## Identity

All events require `courseId`. Lesson-scoped events require `lessonId`. Component ids are **trimmed** at the React provider boundary (`assertValidId`) so telemetry payloads and xAPI URNs stay aligned. See [Identity reference](reference/identity.md).

### `course_started` dedupe

The runtime uses separate session-storage marks:

| Key pattern | Purpose |
|-------------|---------|
| `lessonkit:course_started:{sessionId}:{courseId}` | xAPI / session bootstrap (may fire before tracking sink is ready) |
| `lessonkit:course_started_tracking:{sessionId}:{courseId}` | Tracking sink delivery (retries when sink fails) |

When `config.session.sessionId` changes, `migrateCourseStartedMark` moves dedupe state to the new session id so learners do not receive duplicate `course_started` events after LMS handoff.

### Quiz telemetry

Built-in `Quiz` / `KnowledgeCheck` must be wrapped in `<Lesson>`. Events without an enclosing `lessonId` are dropped by `tryBuildTelemetryEvent`.
