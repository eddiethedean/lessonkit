# Coming from H5P?

:::{admonition} H5P authors
:class: tip

If you already use **[H5P](https://h5p.org/content-types-and-applications)** in Moodle, WordPress, or another LMS, LessonKit offers the **same kinds of interactions** as native **React components**—with one course app, stable IDs, and SCORM/xAPI/cmi5 export via the CLI. We do **not** embed H5P iframes or `.h5p` runtimes inside shipped courses.
:::

LessonKit is **React-first**, not a plugin inside your LMS’s content bank. You author a small web app (`Course` → `Lesson` → blocks), declare assessments in **`lessonkit.json`**, then **`lessonkit package`** for delivery.

## Find your H5P content type

Use the **[H5P capability map](../project/h5p-capability-map.md)** for the full table (machine name, display name, LessonKit id, roadmap status).

### Available today (framework 1.2.0)

| H5P name | LessonKit | Import / notes |
| --- | --- | --- |
| **Multiple Choice** (`H5P.MultiChoice`) | `Quiz` / `KnowledgeCheck` | Set `checkId`; mirror in `lessonkit.json` `assessments[]` |
| **True/False** | `TrueFalse` | `kind: "trueFalse"` in manifest; LXPack packages as 2-choice MCQ |
| **Fill in the Blanks** | `FillInTheBlanks` | SPA scoring + `assessment_completed` bridge |
| **Drag and Drop** | `DragAndDrop` | Keyboard pick-target mode; SPA + bridge scoring |
| **Drag the Words** | `DragTheWords` | Inline drop zones; SPA + bridge scoring |
| **Mark the Words** | `MarkTheWords` | Selectable tokens; SPA + bridge scoring |
| **Question Set** | `AssessmentSequence` | Aggregates child assessments by `checkId` |
| **Interactive Book** | `InteractiveBook` + `Page` | Compound navigation + session resume |
| **Accordion** | `Accordion` | Expand/collapse sections |
| **Dialog Cards** | `DialogCards` | Flip-card dialog |
| **Flashcards** | `Flashcards` | Card deck |
| **Image Hotspots** | `ImageHotspots` | Clickable regions on an image |
| **Image Slider** | `ImageSlider` | Slide carousel |
| **Find the Hotspot** | `FindHotspot` | Scored hotspot selection |
| **Find Multiple Hotspots** | `FindMultipleHotspots` | Multi-select hotspots |
| **Scenario** (narrative regions) | `Scenario` | Optional `blockId` for telemetry URNs |
| Open response / reflection | `Reflection` | Not auto-scored (like many H5P text tasks) |
| Course shell | `Course`, `Lesson` | One SPA vs one H5P activity per embed |
| Progress | `ProgressTracker` | Course-level progress, not per-iframe |
| Content text / heading / image | `Text`, `Heading`, `Image` | Framework content primitives |

### Planned (roadmap / capability map)

| H5P | LessonKit (planned) |
| --- | --- |
| Interactive Video | `InteractiveVideo` |
| Course Presentation | `SlideDeck` |
| Branching Scenario | `BranchingScenario` |

:::{admonition} Renamed on purpose
:class: important

A few LessonKit ids differ from H5P labels where we already shipped or need clearer React names: **`Quiz`** = H5P Multiple Choice; **`SlideDeck`** = Course Presentation; **`AssessmentSequence`** = Question Set. Palette labels and docs will still say “Fill in the Blanks”, “Interactive Video”, etc.
:::

## LessonKit Studio (visual authoring)

:::{admonition} H5P Hub → Studio palette
:class: tip

**H5P Hub** is where you install content types in your LMS. **LessonKit Studio** (Alpha) is the visual editor for blocks that compile to the same React runtime as hand-written courses. Studio **0.3.2** adds palette entries for framework 1.1.x P0 assessments and 1.2.x compound/Tier C/D blocks with H5P-familiar labels—see [Studio guide](studio/index.md).
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

**Runtime embedding of H5P is not planned.** A future **read-only `.h5p` import** (framework **1.6.x**) may translate a subset of activities into `StudioProjectV1` or React source—still using LessonKit components after export. Until then, rebuild high-value activities using the capability map and [block catalog](../reference/block-catalog.md).
:::

## Next steps

1. **Map your activities** — [H5P capability map](../project/h5p-capability-map.md)
2. **React path** — [Quickstart](react-developers/quickstart.md) · [Components & hooks](react-developers/components-and-hooks.md)
3. **Visual path** — [LessonKit Studio](studio/index.md)
4. **Ship to LMS** — [Packaging](../reference/packaging.md) · [Vibe coding: shipping](vibe-coding/shipping-to-lms.md)

Roadmap detail: [H5P-aligned backlog](../project/roadmap.md#h5p-aligned-capability-backlog) in the repo.
