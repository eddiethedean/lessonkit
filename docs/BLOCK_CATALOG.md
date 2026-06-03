# Runtime block catalog (v1)

:::{admonition} H5P equivalents
:class: tip

Many LessonKit blocks mirror **[H5P](https://h5p.org/content-types-and-applications)** content types as native React components (not embedded H5P). **`Quiz`** = H5P **Multiple Choice**; Tier B P0 question types ship in [Catalog v2](#catalog-v2-framework-110--shipped) (framework 1.1.0). Full mapping: **[H5P capability map](../project/h5p-capability-map.md)** · guide: **[Coming from H5P?](../guides/h5p-for-lessonkit-authors.md)**.
:::

The block catalog describes every **framework-owned** learning primitive in `@lessonkit/react`. Use it to validate generated code, document supported props, and align Studio/AI workflows with the same runtime components authors use today.

## H5P names for v1 blocks

| LessonKit block | H5P display name | H5P machine name (typical) |
| --- | --- | --- |
| `Quiz` / `KnowledgeCheck` | Multiple Choice | `H5P.MultiChoice` |
| `Scenario` | *(scenario / content area)* | — |
| `Reflection` | *(open text / reflection)* | — |
| `Course` / `Lesson` | *(course structure)* | — |
| `ProgressTracker` | *(progress UI)* | — |

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
- **`Scenario` / `Reflection`**: set `blockId` when you want block-level URNs on `interaction` events (see [Telemetry reference](reference/telemetry.md)).
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

## Catalog v2 (framework 1.1.0 — shipped)

:::{admonition} H5P question types (1.1.0)
:class: note

These LessonKit blocks are React implementations of common H5P **question** content types. Each implements the shared **Assessment contract** (scores, retry, solutions, xAPI)—see [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md#assessment-contract-framework-11x).
:::

`blockCatalogVersion = 2` adds H5P-aligned assessments under a shared **Assessment contract**. Full traceability: [H5P capability map](../project/h5p-capability-map.md).

| LessonKit block | H5P display name |
| --- | --- |
| `TrueFalse` | True/False |
| `FillInTheBlanks` | Fill in the Blanks |
| `DragAndDrop` | Drag and Drop |
| `DragTheWords` | Drag the Words |
| `MarkTheWords` | Mark the Words |
| `AssessmentSequence` | Question Set |

| Block | Category | `checkId` | 1.1.x tranche |
| --- | --- | --- | --- |
| `TrueFalse` | assessment | required | P0 |
| `FillInTheBlanks` | assessment | required | P0 |
| `DragAndDrop` | assessment | required | P0 |
| `DragTheWords` | assessment | required | P0 |
| `MarkTheWords` | assessment | required | P0 |
| `AssessmentSequence` | container | per child | P0 |
| `Quiz` / `KnowledgeCheck` | assessment | required | existing (contract alignment) |

**P0 acceptance (each block):** Storybook story, unit tests, catalog JSON entry, telemetry + xAPI mapping, `lessonkit.json` assessment mapping, export parity e2e.

**Not in v2:** compound types (`InteractiveBook`, `SlideDeck`, …) — see [roadmap](../project/roadmap.md#h5p-aligned-capability-backlog).

Import `@lessonkit/react/block-catalog.v2.json` or `buildBlockCatalog({ version: 2 })` (default). Use `{ version: 1 }` for legacy generators.

---

## Cross-references

- **H5P mapping:** [H5P capability map](../project/h5p-capability-map.md)
- **Identity:** [Identity reference](reference/identity.md) — id format and URNs (`@lessonkit/core/identity-contract.v1.json`)
- **Telemetry events:** [Telemetry reference](reference/telemetry.md) — event catalog (`@lessonkit/core/telemetry-catalog.v1.json`)
- **Theming:** [Theming reference](reference/theming.md) — token catalog (`@lessonkit/themes/theme-catalog.v1.json`)
- **Accessibility:** [Accessibility reference](reference/accessibility.md)

## Reference example

[examples/lxpack-golden](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden) renders every catalog block (`Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`) and is the packaging golden path for CI.

## Generator checklist

1. Import `@lessonkit/react/block-catalog.v1.json` and reject unknown block types.
2. Validate required props and IDs per entry (`requiredIds`, `props`).
3. Keep `courseId` and every `checkId` in sync with `lessonkit.json`. For `single-spa` layouts, manifest `lessons[].id` lists LMS shell lesson(s) only; additional in-app `lessonId`s may exist only in React (see [Identity](reference/identity.md#single-spa-manifest-vs-in-app-steps)).
4. Nest blocks per `parentConstraints` (Quiz inside Lesson, etc.).
5. Do not invent Studio-only blocks (`text`, `heading`, …) in **framework** codegen until they ship in a future runtime catalog version (Studio schema is separate; see [H5P capability map](../project/h5p-capability-map.md)).
6. For new assessments, see [catalog v2](#catalog-v2-framework-110--shipped) and implement `checkId` before shipping.
7. When shipping an H5P-parity block, complete the [H5P documentation checklist](../project/roadmap.md#h5p-documentation-checklist-per-block) (capability map ✅, H5P names here, authors guide, Storybook).
