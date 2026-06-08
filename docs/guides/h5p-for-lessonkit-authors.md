# Coming from H5P?

:::{admonition} H5P authors
:class: tip

If you already use **[H5P](https://h5p.org/content-types-and-applications)** in Moodle, WordPress, or another LMS, LessonKit offers the **same kinds of interactions** as native **React components**—with one course app, stable IDs, and SCORM/xAPI/cmi5 export via the CLI.

**Policy:** LessonKit does **not** embed H5P, import `.h5p` files, connect to H5P Hub, or consume H5P `semantics.json`. You **reimplement** familiar activity types using LessonKit blocks.
:::

LessonKit is **React-first**, not a plugin inside your LMS’s content bank. You author a small web app (`Course` → `Lesson` → blocks), declare assessments in **`lessonkit.json`**, then **`lessonkit package`** for delivery.

## Find your H5P content type

Use the **[H5P capability map](../project/h5p-capability-map.md)** for the full table (machine name, display name, LessonKit id, roadmap status). Shipped blocks link to **[component pages](../reference/components/index.md)** with live demos.

### Available today (framework 1.6.x)

| H5P name | LessonKit | Notes |
| --- | --- | --- |
| **Multiple Choice** (`H5P.MultiChoice`) | [`Quiz`](../reference/components/quiz.md) / [`KnowledgeCheck`](../reference/components/knowledge-check.md) | Set `checkId`; mirror in `lessonkit.json` `assessments[]` |
| **True/False** | [`TrueFalse`](../reference/components/true-false.md) | `kind: "trueFalse"` in manifest; LXPack packages as 2-choice MCQ |
| **Fill in the Blanks** | [`FillInTheBlanks`](../reference/components/fill-in-the-blanks.md) | SPA scoring + `assessment_completed` bridge |
| **Drag and Drop** | [`DragAndDrop`](../reference/components/drag-and-drop.md) | Keyboard pick-target mode; SPA + bridge scoring |
| **Drag the Words** | [`DragTheWords`](../reference/components/drag-the-words.md) | Inline drop zones; SPA + bridge scoring |
| **Mark the Words** | [`MarkTheWords`](../reference/components/mark-the-words.md) | Selectable tokens; SPA + bridge scoring |
| **Question Set** | [`AssessmentSequence`](../reference/components/assessment-sequence.md) | Aggregates child assessments; children use `checkId` |
| **Interactive Book** | [`InteractiveBook`](../reference/components/interactive-book.md) + [`Page`](../reference/components/page.md) | Compound navigation + session resume (`blockId` only) |
| **Course Presentation** | [`SlideDeck`](../reference/components/slide-deck.md) + [`Slide`](../reference/components/slide.md) | Slide navigation + keyboard controls + session resume |
| **Interactive Video** | [`InteractiveVideo`](../reference/components/interactive-video.md) + [`TimedCue`](../reference/components/timed-cue.md) | Timeline cues; pause on interaction; session resume |
| **Branching Scenario** | [`BranchingScenario`](../reference/components/branching-scenario.md) + [`BranchNode`](../reference/components/branch-node.md) + [`BranchChoice`](../reference/components/branch-choice.md) | Graph navigation; visited-path scoring; session resume |
| **Summary** | [`Summary`](../reference/components/summary.md) | Statement-bank construct task |
| **Image Pairing** | [`ImagePairing`](../reference/components/image-pairing.md) | Match image pairs |
| **Image Sequencing** | [`ImageSequencing`](../reference/components/image-sequencing.md) | Order images |
| **Arithmetic Quiz** | [`ArithmeticQuiz`](../reference/components/arithmetic-quiz.md) | Timed math prompts |
| **Essay** | [`Essay`](../reference/components/essay.md) | Open text; plugin grading |
| **Questionnaire** | [`Questionnaire`](../reference/components/questionnaire.md) | Unscored survey |
| **Memory Game** | [`MemoryGame`](../reference/components/memory-game.md) | Card flip pairs |
| **Information Wall** | [`InformationWall`](../reference/components/information-wall.md) | Searchable panels |
| **Slideshow (parallax)** | [`ParallaxSlideshow`](../reference/components/parallax-slideshow.md) | Parallax slides with reduced-motion fallback |
| **Video** (self-hosted) | [`Video`](../reference/components/video.md) | Native `<video>` on slides and pages |
| **Iframe Embedder** | [`Embed`](../reference/components/embed.md) | Sandboxed iframe; opt-in `allow` sandbox tokens |
| **Chart** | [`Chart`](../reference/components/chart.md) | Bar/pie with accessible data table |
| **Accordion** | [`Accordion`](../reference/components/accordion.md) | Expand/collapse sections |
| **Dialog Cards** | [`DialogCards`](../reference/components/dialog-cards.md) | Flip-card dialog |
| **Flashcards** | [`Flashcards`](../reference/components/flashcards.md) | Card deck |
| **Image Hotspots** | [`ImageHotspots`](../reference/components/image-hotspots.md) | Clickable regions on an image |
| **Image Slider** | [`ImageSlider`](../reference/components/image-slider.md) | Slide carousel |
| **Find the Hotspot** | [`FindHotspot`](../reference/components/find-hotspot.md) | Scored hotspot selection |
| **Find Multiple Hotspots** | [`FindMultipleHotspots`](../reference/components/find-multiple-hotspots.md) | Multi-select hotspots |
| **Scenario** (narrative regions) | [`Scenario`](../reference/components/scenario.md) | Optional `blockId` for telemetry URNs |
| Open response / reflection | [`Reflection`](../reference/components/reflection.md) | Not auto-scored (like many H5P text tasks) |
| Course shell | [`Course`](../reference/components/course-structure.md), [`Lesson`](../reference/components/course-structure.md) | One SPA vs one H5P activity per embed |
| Progress | [`ProgressTracker`](../reference/components/course-structure.md) | Course-level progress, not per-iframe |
| Content text / heading / image | [`Text`](../reference/components/text-and-heading.md), [`Heading`](../reference/components/text-and-heading.md), [`Image`](../reference/components/image.md) | Framework content primitives |
| **Game Map** | [`GameMap`](../reference/components/game-map.md) + [`MapStage`](../reference/components/map-stage.md) + [`MapExit`](../reference/components/map-exit.md) | Spatial compound navigation; optional non-scored stages (**1.6.6**) |
| **Table** | [`Table`](../reference/components/table.md) | Accessible data table (**1.6.x**) |
| **Crossword** / **Word search** | [`Crossword`](../reference/components/crossword.md), [`WordSearch`](../reference/components/word-search.md) | Puzzle blocks (**1.6.x**) |

### Planned (roadmap / capability map)

See the [capability map](../project/h5p-capability-map.md) for Tier A–E blocks not yet shipped (e.g. `SortParagraphs`, `VirtualTour`).

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
