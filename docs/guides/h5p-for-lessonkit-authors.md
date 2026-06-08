# Coming from H5P?

:::{admonition} H5P authors
:class: tip

If you already use **[H5P](https://h5p.org/content-types-and-applications)** in Moodle, WordPress, or another LMS, LessonKit offers the **same kinds of interactions** as native **React components**—with one course app, stable IDs, and SCORM/xAPI/cmi5 export via the CLI.

**Policy:** LessonKit does **not** embed H5P, import `.h5p` files, connect to H5P Hub, or consume H5P `semantics.json`. You **reimplement** familiar activity types using LessonKit blocks.
:::

LessonKit is **React-first**, not a plugin inside your LMS’s content bank. You author a small web app (`Course` → `Lesson` → blocks), declare assessments in **`lessonkit.json`**, then **`lessonkit package`** for delivery.

## Find your H5P content type

Use the **[H5P capability map](../project/h5p-capability-map.md)** for the full table (machine name, display name, LessonKit id, roadmap status).

### Available today (framework 1.5.0)

| H5P name | LessonKit | Notes |
| --- | --- | --- |
| **Multiple Choice** (`H5P.MultiChoice`) | `Quiz` / `KnowledgeCheck` | Set `checkId`; mirror in `lessonkit.json` `assessments[]` |
| **True/False** | `TrueFalse` | `kind: "trueFalse"` in manifest; LXPack packages as 2-choice MCQ |
| **Fill in the Blanks** | `FillInTheBlanks` | SPA scoring + `assessment_completed` bridge |
| **Drag and Drop** | `DragAndDrop` | Keyboard pick-target mode; SPA + bridge scoring |
| **Drag the Words** | `DragTheWords` | Inline drop zones; SPA + bridge scoring |
| **Mark the Words** | `MarkTheWords` | Selectable tokens; SPA + bridge scoring |
| **Question Set** | `AssessmentSequence` | Aggregates child assessments; children use `checkId` |
| **Interactive Book** | `InteractiveBook` + `Page` | Compound navigation + session resume |
| **Course Presentation** | `SlideDeck` + `Slide` | Slide navigation + keyboard controls + session resume |
| **Interactive Video** | `InteractiveVideo` + `TimedCue` | Timeline cues; pause on interaction; session resume |
| **Branching Scenario** | `BranchingScenario` + `BranchNode` + `BranchChoice` | Graph navigation; visited-path scoring; session resume |
| **Summary** | `Summary` | Statement-bank construct task |
| **Image Pairing** | `ImagePairing` | Match image pairs |
| **Image Sequencing** | `ImageSequencing` | Order images |
| **Arithmetic Quiz** | `ArithmeticQuiz` | Timed math prompts |
| **Essay** | `Essay` | Open text; plugin grading |
| **Questionnaire** | `Questionnaire` | Unscored survey |
| **Memory Game** | `MemoryGame` | Card flip pairs |
| **Information Wall** | `InformationWall` | Searchable panels |
| **Slideshow (parallax)** | `ParallaxSlideshow` | Parallax slides with reduced-motion fallback |
| **Video** (self-hosted) | `Video` | Native `<video>` on slides and pages |
| **Iframe Embedder** | `Embed` | Sandboxed iframe; opt-in `allow` sandbox tokens |
| **Chart** | `Chart` | Bar/pie with accessible data table |
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

See the [capability map](../project/h5p-capability-map.md) for Tier A–E blocks not yet shipped (e.g. `SortParagraphs`, `VirtualTour`). `GameMap` and Tier C–E puzzle blocks shipped in **1.6.x**.

:::{admonition} Renamed on purpose
:class: important

A few LessonKit ids differ from H5P labels where we already shipped or need clearer React names: **`Quiz`** = H5P Multiple Choice; **`SlideDeck`** = Course Presentation; **`AssessmentSequence`** = Question Set. Docs still use H5P display names where helpful (e.g. “Fill in the Blanks”, “Interactive Video”).
:::

## Wiring differences (H5P vs LessonKit)

| Topic | H5P | LessonKit |
| --- | --- | --- |
| Package | `.h5p` zip + libraries | Vite `dist/` + `lessonkit package` → SCORM/xAPI/cmi5 |
| IDs | Per-content params | Required `courseId`, `lessonId`, `checkId` |
| Analytics | xAPI from library | Telemetry catalog + `@lessonkit/xapi` |
| Theming | Per content-type CSS | Global `--lk-*` via `@lessonkit/themes` |
| Nesting | Curated sub-content lists | Same idea via compound blocks + catalog allowlists (shipped in 1.2.x+) |

## Migrating from existing H5P content

:::{admonition} Rebuild only — no H5P interop
:class: important

There is **no** `.h5p` import, H5P Hub integration, `semantics.json` bridge, or H5P runtime embedding. Migration means mapping each legacy activity to a LessonKit block in the [capability map](../project/h5p-capability-map.md), authoring it in React, and syncing `courseId` / `lessonId` / `checkId` with `lessonkit.json`.

Framework **1.6.x** adds **`.lkcourse`** export for sharing LessonKit projects between teams—not for reading H5P packages.
:::

## Next steps

1. **Map your activities** — [H5P capability map](../project/h5p-capability-map.md)
2. **React path** — [Quickstart](react-developers/quickstart.md) · [Components & hooks](react-developers/components-and-hooks.md)
3. **Ship to LMS** — [Packaging](../reference/packaging.md) · [Vibe coding: shipping](vibe-coding/shipping-to-lms.md)

Roadmap detail: [H5P-aligned backlog](../project/roadmap.md#h5p-aligned-capability-backlog) in the repo.
