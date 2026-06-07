# Telemetry & xAPI (1.5.x)

LessonKit emits versioned telemetry events from `@lessonkit/react` and maps them to xAPI via `@lessonkit/xapi`.

## Event catalog

- **Version:** `telemetryCatalogVersion = 3` (exported from `@lessonkit/core`; default in framework 1.2+)
- **JSON:** `@lessonkit/core/telemetry-catalog.v3.json` (must match `buildTelemetryCatalog({ version: 3 })` in tests)
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
| `assessment_answered` / `assessment_completed` | P0 assessment blocks | `checkId`, scores, interaction metadata |
| `interaction` | Custom UI / branching via `track()` | `kind`, optional `blockId`, free-form fields |
| `book_page_viewed` / `compound_page_viewed` | Compound navigation | `blockId`, page index, parent type |
| `slide_viewed` | `SlideDeck` navigation (1.3+) | `blockId`, `slideIndex`, `slideTitle` |
| `video_cue_reached` | `InteractiveVideo` cue activation (1.4+) | `blockId`, `cueIndex`, `atSeconds`, `cueLabel?` |
| `video_segment_completed` | `InteractiveVideo` cue dismissed/completed (1.4+) | `blockId`, `segmentIndex`, `atSeconds`, `segmentLabel?` |
| `memory_card_flipped` | `MemoryGame` card flip (1.4+) | `blockId`, `cardIndex`, `face` |
| `information_wall_search` | `InformationWall` search (1.4+) | `blockId`, `query` |
| `parallax_slide_viewed` | `ParallaxSlideshow` slide view (1.4+) | `blockId`, `slideIndex` |
| `questionnaire_submitted` | `Questionnaire` submit (1.4+) | `blockId`, `fieldCount` |
| `branch_node_viewed` | `BranchingScenario` node activation (1.5+) | `blockId`, `nodeId`, `nodeIndex`, `nodeTitle?` |
| `branch_selected` | `BranchChoice` selection (1.5+) | `blockId`, `fromNodeId`, `toNodeId`, `label`, `scoreWeight?` |

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

Prefer **`createFetchTransport`** from `@lessonkit/xapi` for production LRS delivery (timeout, retry backoff, keepalive `exitTransport` for pagehide). See [Telemetry & xAPI guide](../guides/react-developers/telemetry-and-xapi.md).

## Custom interactions and blocks

For block-level xAPI on `interaction` events:

1. Set `blockId` on `Scenario` / `Reflection` (or pass `blockId` in interaction payload).
2. Ensure an active `lessonId` (normal when inside `Lesson`).
3. Call `track("interaction", { kind: "…", blockId: "my-block", … })`.

Without `blockId`, interaction events are tracked but do not emit xAPI.

## Batching and buffer limits

When `config.tracking.batch.enabled` is `true` (or `batchSink` is set), events are queued in an in-memory buffer before delivery.

| Setting | Default | Behavior |
|---------|---------|----------|
| `batch.flushIntervalMs` | `5000` | Periodic flush while the sink is slow or unavailable |
| `batch.maxBatchSize` | `25` | Flush when the buffer reaches this size |
| Internal telemetry buffer cap | **1000** events | When full, **new** events are dropped until the buffer drains |

If the sink throws or rejects, failed events are re-queued (entire batch for `batchSink`; undelivered tail for per-event sinks). Under prolonged outage the telemetry buffer can hit the cap; production is silent unless you wire `config.observability.onTelemetryBufferDrop`. Monitor sink failures via `onTelemetrySinkError` (covers both `sink` and `batchSink`). See [production checklist](../guides/react-developers/production-checklist.md).

The xAPI in-memory queue (default **1000** statements) drops the **oldest** statement when full — wire `onXapiQueueCap` and `onXapiQueueDepth`.

Non-batched mode (`batch.enabled: false`) invokes `sink` synchronously per event with no buffer cap.

## Tab exit and pagehide

`LessonkitProvider` calls **`flushOnExit`** (keepalive batch / xAPI delivery when configured) then async **`flush`** on `visibilitychange` (hidden) and `pagehide`. Wire `exitTransport` from `createFetchTransport` and `exitBatchSink` from `createFetchBatchSink` for best-effort delivery when the tab closes.

## Identity

All events require `courseId`. Lesson-scoped events require `lessonId`. Component ids are **trimmed** at the React provider boundary (`assertValidId`) so telemetry payloads and xAPI URNs stay aligned. See [Identity reference](reference/identity.md).

### `course_started` dedupe

The runtime uses separate session-storage marks:

| Key pattern | Purpose |
|-------------|---------|
| `lessonkit:course_started:{sessionId}:{courseId}` | xAPI / session bootstrap (may fire before tracking sink is ready) |
| `lessonkit:course_started_tracking:{sessionId}:{courseId}` | Tracking sink delivery — set **only after** a successful tracking `flush` |
| `lessonkit:course_started_pipeline_delivered:{sessionId}:{courseId}` | Non-tracking pipeline (xAPI mapper, bridge, extra sinks) |

When `config.session.sessionId` changes, `migrateCourseStartedMark` moves dedupe state to the new session id so learners do not receive duplicate `course_started` events after LMS handoff.

### Quiz telemetry

Built-in `Quiz` / `KnowledgeCheck` must be wrapped in `<Lesson>`. Events without an enclosing `lessonId` are dropped by `tryBuildTelemetryEvent`.

## Production observability

Required hooks depend on what you enable — see the [production checklist](../guides/react-developers/production-checklist.md) for the full matrix. When both tracking and xAPI delivery are configured, wire all six hooks including **`onXapiTransportError`** (required for xAPI, not optional):

| Config | Required hooks |
| --- | --- |
| Tracking or xAPI enabled | `onLxpackBridgeMiss` |
| Tracking delivery (`sink` or `batchSink`) | + `onTelemetrySinkError`, `onTelemetryBufferDrop` |
| xAPI delivery (`transport` or `client`) | + `onXapiQueueDepth`, `onXapiQueueCap`, `onXapiTransportError` |

Without these hooks, buffer/queue drops and sink failures are silent in production builds.
