# Runtime block catalog (v1)

The block catalog describes every **framework-owned** learning primitive in `@lessonkit/react`. Use it to validate generated code, document supported props, and align Studio/AI workflows with the same runtime components authors use today.

## Catalog artifacts

| Artifact | Path |
| --- | --- |
| **Version** | `blockCatalogVersion = 1` (exported from `@lessonkit/react`) |
| **JSON** | `@lessonkit/react/block-catalog.v1.json` (must match `buildBlockCatalog()` in tests) |
| **JSON Schema** | `@lessonkit/react/block-contract.v1.json` |
| **Programmatic API** | `buildBlockCatalog()`, `getBlockCatalogEntry(type)`, `BLOCK_CATALOG` |

Import in Node or bundlers:

```ts
import catalog from "@lessonkit/react/block-catalog.v1.json" assert { type: "json" };
// catalog.schemaVersion === 1
// catalog.entries — one object per block type
```

## Block types (v1)

| Type | Category | Required IDs | Telemetry |
| --- | --- | --- | --- |
| `Course` | container | `courseId` | `course_started`, `course_completed` |
| `Lesson` | container | `lessonId` | `lesson_started`, `lesson_completed`, `lesson_time_on_task` |
| `Scenario` | content | optional `blockId` | manual `interaction` via `useTracking()` |
| `Reflection` | content | optional `blockId` | manual `interaction` via `useTracking()` |
| `Quiz` | assessment | `checkId` | `quiz_answered`, `quiz_completed` |
| `KnowledgeCheck` | assessment | *(alias of `Quiz`)* | same as `Quiz` |
| `ProgressTracker` | chrome | — | none |

## Composition rules

```text
ThemeProvider
  └── Course (courseId)
        ├── ProgressTracker
        └── Lesson (lessonId)
              ├── Scenario (blockId?)
              ├── Reflection (blockId?)
              ├── Quiz / KnowledgeCheck (checkId)
              └── custom UI + useTracking()
```

- **`Quiz` / `KnowledgeCheck`** must be inside an active `Lesson` for quiz telemetry (`lessonId` required).
- **`Scenario` / `Reflection`**: set `blockId` when you want block-level URNs on `interaction` events (see [Telemetry reference](telemetry.md)).
- **`ProgressTracker`** reads runtime progress; place inside `Course`.

## Per-block contracts

### Course

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | yes | Course title (h1) |
| `courseId` | CourseId | yes | Stable course id |
| `config` | LessonkitConfig (minus courseId) | no | Tracking, xAPI, session |
| `children` | ReactNode | yes | Lessons and chrome |

**A11y:** `<section aria-label={title}>`, `<h1>`.  
**Theming:** Inherits `--lk-*` from `ThemeProvider`.  
**Telemetry:** Provider emits `course_started` on mount; `completeCourse()` emits `course_completed`.

### Lesson

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | yes | Lesson title (h2) |
| `lessonId` | LessonId | yes | Stable lesson id |
| `children` | ReactNode | yes | Blocks and content |

**A11y:** `<article aria-label={title}>`, `<h2>`.  
**Theming:** Inherits global tokens.  
**Telemetry:** `lesson_started` on mount; `lesson_completed` + `lesson_time_on_task` on unmount or lesson switch.

### Scenario

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `blockId` | BlockId | no | Block URN segment for interactions |
| `children` | ReactNode | yes | Narrative and custom UI |

**A11y:** `<section aria-label="Scenario">`.  
**Theming:** `data-lk-block-id` when `blockId` set.  
**Telemetry:** No automatic events; use `useTracking().track("interaction", …)`.

### Reflection

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `blockId` | BlockId | no | Block URN segment |
| `prompt` | string | no | Question above textarea |
| `children` | ReactNode | no | Optional content above textarea |

**A11y:** `<section aria-label="Reflection">`; textarea uses `aria-labelledby` or `aria-label`.  
**Theming:** `data-lk-block-id` when `blockId` set.  
**Telemetry:** Manual `interaction` events (e.g. on submit).

### Quiz / KnowledgeCheck

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| `checkId` | CheckId | yes | Assessment id (sync with `lessonkit.json`) |
| `question` | string | yes | Question text |
| `choices` | string[] | yes | Radio options |
| `answer` | string | yes | Correct choice (must match one option) |

**A11y:** Fieldset + radios; `role="status" aria-live="polite"` for feedback; visually hidden legend.  
**Theming:** `data-lk-check-id` from `checkId`.  
**Telemetry:** `quiz_answered` on each choice; `quiz_completed` on first correct answer.

### ProgressTracker

No props.

**A11y:** `<aside aria-label="Progress">`.  
**Theming:** Inherits global tokens.  
**Telemetry:** None (display-only).

## Cross-references

- **Identity:** [`IDENTITY.md`](IDENTITY.md) — id format and URNs (`@lessonkit/core/identity-contract.v1.json`)
- **Telemetry events:** [`TELEMETRY.md`](TELEMETRY.md) — event catalog (`@lessonkit/core/telemetry-catalog.v1.json`)
- **Theming:** [`THEMING.md`](THEMING.md) — token catalog (`@lessonkit/themes/theme-catalog.v1.json`)
- **Accessibility:** [Accessibility reference](accessibility.md)

## Reference example

[`examples/lxpack-golden`](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden) renders every catalog block (`Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`) and is the packaging golden path for CI.

## Generator checklist

1. Import `@lessonkit/react/block-catalog.v1.json` and reject unknown block types.
2. Validate required props and IDs per entry (`requiredIds`, `props`).
3. Keep `courseId` and every `checkId` in sync with `lessonkit.json`. For `single-spa` layouts, manifest `lessons[].id` lists LMS shell lesson(s) only; additional in-app `lessonId`s may exist only in React (see [Identity](IDENTITY.md#single-spa-manifest-vs-in-app-steps)).
4. Nest blocks per `parentConstraints` (Quiz inside Lesson, etc.).
5. Do not invent Studio-only blocks (`text`, `heading`, …) until they ship in a future catalog version.
