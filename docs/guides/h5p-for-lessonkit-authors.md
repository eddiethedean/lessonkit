# Coming from H5P?

:::{admonition} H5P authors
:class: tip

If you already use **[H5P](https://h5p.org/content-types-and-applications)** in Moodle, WordPress, or another LMS, LessonKit offers the **same kinds of interactions** as native **React components**—with one course app, stable IDs, and SCORM/xAPI/cmi5 export via the CLI. We do **not** embed H5P iframes or `.h5p` runtimes inside shipped courses.
:::

LessonKit is **React-first**, not a plugin inside your LMS’s content bank. You author a small web app (`Course` → `Lesson` → blocks), declare assessments in **`lessonkit.json`**, then **`lessonkit package`** for delivery.

## Find your H5P content type

Use the **[H5P capability map](../project/h5p-capability-map.md)** for the full table (machine name, display name, LessonKit id, roadmap status).

### Available today (framework 1.0)

| H5P name | LessonKit | Import / notes |
| --- | --- | --- |
| **Multiple Choice** (`H5P.MultiChoice`) | `Quiz` / `KnowledgeCheck` | Set `checkId`; mirror in `lessonkit.json` `assessments[]` |
| **Scenario** (narrative regions) | `Scenario` | Optional `blockId` for telemetry URNs |
| Open response / reflection | `Reflection` | Not auto-scored (like many H5P text tasks) |
| Course shell | `Course`, `Lesson` | One SPA vs one H5P activity per embed |
| Progress | `ProgressTracker` | Course-level progress, not per-iframe |

:::{admonition} H5P: Question Set
:class: note

**H5P Question Set** maps to the planned **`AssessmentSequence`** component (framework **1.2.x**). Until then, compose multiple `Quiz` components in a `Lesson` or build a small custom sequence in React.
:::

### Planned (roadmap / capability map)

Common H5P types and their LessonKit names (same idea, React implementation):

| H5P | LessonKit (planned) |
| --- | --- |
| True/False | `TrueFalse` |
| Fill in the Blanks | `FillInTheBlanks` |
| Drag and Drop | `DragAndDrop` |
| Drag the Words | `DragTheWords` |
| Mark the Words | `MarkTheWords` |
| Interactive Video | `InteractiveVideo` |
| Course Presentation | `SlideDeck` |
| Branching Scenario | `BranchingScenario` |
| Interactive Book | `InteractiveBook` |
| Column | `Page` (Studio `container` today) |

:::{admonition} Renamed on purpose
:class: important

A few LessonKit ids differ from H5P labels where we already shipped or need clearer React names: **`Quiz`** = H5P Multiple Choice; **`SlideDeck`** = Course Presentation; **`AssessmentSequence`** = Question Set. Palette labels and docs will still say “Fill in the Blanks”, “Interactive Video”, etc.
:::

## LessonKit Studio (visual authoring)

:::{admonition} H5P Hub → Studio palette
:class: tip

**H5P Hub** is where you install content types in your LMS. **LessonKit Studio** (Alpha) is the visual editor for blocks that compile to the same React runtime as hand-written courses. Today: text, heading, image, quiz, scenario, container, and more—see [Studio guide](studio/index.md). New H5P-aligned blocks appear in the palette as framework **1.2.x+** ships.
:::

## Wiring differences (H5P vs LessonKit)

| Topic | H5P | LessonKit |
| --- | --- | --- |
| Package | `.h5p` zip + libraries | Vite `dist/` + `lessonkit package` → SCORM/xAPI/cmi5 |
| IDs | Per-content params | Required `courseId`, `lessonId`, `checkId` |
| Analytics | xAPI from library | Telemetry catalog + `@lessonkit/xapi` |
| Theming | Per content-type CSS | Global `--lk-*` via `@lessonkit/themes` |
| Nesting | Curated sub-content lists | Same idea via compound blocks + catalog allowlists (planned) |

## Import from existing H5P content

:::{admonition} H5P import (research)
:class: note

**Runtime embedding of H5P is not planned.** A future **read-only `.h5p` import** (framework **1.7.x**) may translate a subset of activities into `StudioProjectV1` or React source—still using LessonKit components after export. Until then, rebuild high-value activities using the capability map and [block catalog](../reference/block-catalog.md).
:::

## Next steps

1. **Map your activities** — [H5P capability map](../project/h5p-capability-map.md)
2. **React path** — [Quickstart](react-developers/quickstart.md) · [Components & hooks](react-developers/components-and-hooks.md)
3. **Visual path** — [LessonKit Studio](studio/index.md)
4. **Ship to LMS** — [Packaging](../reference/packaging.md) · [Vibe coding: shipping](vibe-coding/shipping-to-lms.md)

Roadmap detail: [H5P-aligned backlog](../../ROADMAP.md#h5p-aligned-capability-backlog) in the repo.
