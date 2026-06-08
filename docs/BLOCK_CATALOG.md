# Runtime block catalog (v3 default)

:::{admonition} H5P equivalents
:class: tip

Many LessonKit blocks mirror **[H5P](https://h5p.org/content-types-and-applications)** content types as native React components (not embedded H5P; no `.h5p` import). **`Quiz`** = H5P **Multiple Choice**; Tier B P0 question types ship in [Catalog v2](#catalog-v2-framework-110--shipped) (framework 1.1.0). Full mapping: **[H5P capability map](../project/h5p-capability-map.md)** · guide: **[Coming from H5P?](../guides/h5p-for-lessonkit-authors.md)**.
:::

The block catalog describes every **framework-owned** learning primitive in `@lessonkit/react`. Use it to validate generated code, document supported props, and align AI/codegen workflows with the same runtime components authors use today.

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
| **Version** | `blockCatalogV3Version = 3` (default for `buildBlockCatalog()`; legacy v1 export: `blockCatalogVersion = 1`) |
| **JSON** | `@lessonkit/react/block-catalog.v3.json` (must match `buildBlockCatalog()` in tests) |
| **JSON Schema** | `@lessonkit/react/block-contract.v3.json` |
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

**Shipped block criteria:** catalog JSON entry, unit tests, telemetry mapping, export parity where applicable. Storybook coverage is expanding—see the [Component gallery](https://eddiethedean.github.io/lessonkit/storybook/).

Import `@lessonkit/react/block-catalog.v2.json` or `buildBlockCatalog({ version: 2 })`. Use `{ version: 1 }` for legacy generators.

---

## Catalog v3 (framework 1.2.0 — shipped)

**Default in 1.2.0:** `buildBlockCatalog()` and `buildBlockCatalog({ version: 3 })`.

Adds content primitives (`Text`, `Heading`, `Image`), compound containers (`Page`, `InteractiveBook`), Tier C/D blocks (`Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider`, `FindHotspot`, `FindMultipleHotspots`), and `allowedChildTypes` / `compoundContract` on compound entries.

| Block | H5P display name (typical) |
| --- | --- |
| `Page` | Column / page (Interactive Book chapter) |
| `InteractiveBook` | Interactive Book |
| `Accordion` | Accordion |
| `DialogCards` | Dialog Cards |
| `Flashcards` | Flashcards |
| `ImageHotspots` | Image Hotspots |
| `ImageSlider` | Image Slider |
| `FindHotspot` | Find the Hotspot |
| `FindMultipleHotspots` | Find Multiple Hotspots |

### Catalog v3 additions (framework 1.3.0)

| Block | H5P display name | Notes |
| --- | --- | --- |
| `Slide` | Course Presentation (slide row) | `compoundContract`; per-slide allowlist (no `ProgressTracker`) |
| `SlideDeck` | Course Presentation | `Slide[]` children; `slide_viewed` telemetry; keyboard nav |

**SlideDeck props:** `blockId` (required), `title`, `showDeckScore`, `Slide` children. Implements `CompoundHandle` with session resume (`persistCompoundState` default `true`).

### Catalog v3 additions (framework 1.4.0)

| Block | H5P display name | Notes |
| --- | --- | --- |
| `Video` | — | Self-hosted `<video>` primitive; nestable in `Page` / `Slide` |
| `TimedCue` | Interactive Video (cue) | Single child at `atSeconds`; used inside `InteractiveVideo` |
| `InteractiveVideo` | Interactive Video | `TimedCue[]` children; `video_cue_reached` telemetry; session resume |
| `Summary` | Summary | Statement-bank construct task |
| `ImagePairing` | Image Pairing | Match image pairs |
| `ImageSequencing` | Image Sequencing | Order images |
| `ArithmeticQuiz` | Arithmetic Quiz | Timed math prompts |
| `Essay` | Essay | Open text; plugin grading via `scoreAssessment` |
| `Questionnaire` | Questionnaire | Unscored multi-field survey |
| `MemoryGame` | Memory Game | Card flip pairs |
| `InformationWall` | Information Wall | Searchable panel grid |
| `ParallaxSlideshow` | Slideshow (parallax) | Static fallback under `prefers-reduced-motion` |

**InteractiveVideo props:** `blockId` (required), `title`, `src`, `showVideoScore?`, `TimedCue` children. Implements `CompoundHandle` with session resume (video time + cue index + child assessment state).

**Slide / Page allowlist:** includes `Video`, `Summary`, and all 1.4.0 content blocks above.

Import `@lessonkit/react/block-catalog.v3.json` or pin `{ version: 2 }` until generators are updated.

---

## Catalog v3 additions (framework 1.5.0)

| Block | Role | Notes |
| --- | --- | --- |
| `BranchingScenario` | Compound | Graph navigation with `BranchNode` / `BranchChoice`; persists `__lk_bs__` branch meta |
| `BranchNode` | Compound child | Page-like content container; `terminal` locks choices |
| `BranchChoice` | Navigation | Emits `branch_selected` via parent scenario |
| `Embed` | Content | Sandboxed iframe (`https` in production); telemetry strips credentials from `src` |
| `Chart` | Content | `bar` or list-style `pie` plus accessible data table; unknown types fall back to table |

**Chart note:** `type="pie"` renders segment labels as a list (not geometric slices). Use `bar` or the table for precise comparisons.

**Branching resume:** Sessions without `__lk_bs__` meta restart at `startNodeId` (legacy saves before 1.5.0).

---

## Catalog v3 additions (framework 1.6.0)

| Block | Role | Notes |
| --- | --- | --- |
| `Table` | Content | Accessible data table with optional caption |
| `ImageJuxtaposition` | Content | Before/after image slider |
| `Timeline` | Content | Event list with focus tracking |
| `ImageSequence` | Content | Stepped image frames |
| `Collage` | Content | Multi-image layout |
| `AudioRecorder` | Content | Browser audio capture |
| `CombinationLock` | Assessment | Digit entry; `checkId` required |
| `QrContent` | Content | QR payload with hidden reveal |
| `Crossword` | Assessment | Grid fill assessment |
| `WordSearch` | Assessment | Letter grid word find |
| `AdventCalendar` | Content | Door-based reveal calendar |
| `GameMap` | Compound | Stage graph with `MapStage` / `MapExit` children |

Import `@lessonkit/react/block-catalog.v3.json` or `buildBlockCatalog({ version: 3 })` (default). Use `{ version: 1 }` only for legacy generators.

---

## Generated prop reference (catalog v3)

Full prop tables for blocks beyond the v1 manual section above (auto-generated from `block-catalog.v3.json`):

```{include} ../_generated/block-props.md
:start-after: <!-- Generated by
```

Regenerate after catalog changes: `node docs/scripts/generate-block-props-doc.mjs`.

---

## Storybook examples

Visual states and props for shipped blocks live in the monorepo Storybook gallery:

- **Gallery:** [Storybook on GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/)
- **Local:** `npm run storybook` from the repo root (after `npm run build:packages`)

| Story group | Blocks demonstrated |
| --- | --- |
| [Components/Blocks](https://eddiethedean.github.io/lessonkit/storybook/?path=/docs/components-blocks--docs) | `Scenario`, `Reflection`, `KnowledgeCheck` |
| [Components/CourseLesson](https://eddiethedean.github.io/lessonkit/storybook/?path=/docs/components-courselesson--docs) | `Course`, `Lesson`, navigation |
| [Components/Quiz](https://eddiethedean.github.io/lessonkit/storybook/?path=/docs/components-quiz--docs) | `Quiz` — unanswered, incorrect, correct |
| [Components/TrueFalse](https://eddiethedean.github.io/lessonkit/storybook/?path=/docs/components-truefalse--docs) | `TrueFalse` |
| [Components/Compound & Tier C/D](https://eddiethedean.github.io/lessonkit/storybook/?path=/docs/components-compound-tier-c-d--docs) | `InteractiveBook`, `SlideDeck`, `InteractiveVideo`, `BranchingScenario`, `Embed`, `Chart`, Tier C/D blocks |

For blocks without a dedicated story yet, see [framework-12-showcase](https://github.com/eddiethedean/lessonkit/tree/main/examples/framework-12-showcase) and [components guide](../guides/react-developers/components-and-hooks.md).

---

## Cross-references

- **H5P mapping:** [H5P capability map](../project/h5p-capability-map.md)
- **Identity:** [Identity reference](identity.md) — id format and URNs (`@lessonkit/core/identity-contract.v1.json`)
- **Telemetry events:** [Telemetry reference](telemetry.md) — event catalog (`@lessonkit/core/telemetry-catalog.v3.json`)
- **Theming:** [Theming reference](theming.md) — token catalog (`@lessonkit/themes/theme-catalog.v1.json`)
- **Accessibility:** [Accessibility reference](accessibility.md)

## Reference example

[examples/lxpack-golden](https://github.com/eddiethedean/lessonkit/tree/main/examples/lxpack-golden) smoke-renders core catalog blocks (`Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`) and is the packaging golden path for CI.

## Generator checklist

1. Import `@lessonkit/react/block-catalog.v3.json` (or `buildBlockCatalog({ version: 3 })`) and reject unknown block types.
2. Validate required props and IDs per entry (`requiredIds`, `props`).
3. Keep `courseId` and every `checkId` in sync with `lessonkit.json`. For `single-spa` layouts, manifest `lessons[].id` lists LMS shell lesson(s) only; additional in-app `lessonId`s may exist only in React (see [Identity](identity.md#single-spa-manifest-vs-in-app-steps)).
4. Nest blocks per `parentConstraints` (Quiz inside Lesson, etc.).
5. Do not invent non-catalog blocks in **framework** codegen until they ship in a future runtime catalog version (see [H5P capability map](../project/h5p-capability-map.md)).
6. For new assessments, see [catalog v2](#catalog-v2-framework-110--shipped) and implement `checkId` before shipping.
7. When shipping an H5P-parity block, complete the [H5P documentation checklist](../project/roadmap.md#h5p-documentation-checklist-per-block) (capability map ✅, H5P names here, authors guide, Storybook).
