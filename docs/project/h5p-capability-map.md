# H5P → LessonKit capability map

:::{admonition} For H5P authors
:class: tip

Use this page as a **lookup table**: H5P display name and machine name → LessonKit component or Studio block. Narrative guide: **[Coming from H5P?](../guides/h5p-for-lessonkit-authors.md)**.
:::

Traceability matrix for adopting [H5P](https://h5p.org/content-types-and-applications) interaction patterns as native LessonKit blocks—not as embedded H5P runtimes.

**Roadmap:** [ROADMAP.md — H5P-aligned backlog](roadmap.md#h5p-aligned-capability-backlog)  
**Runtime catalog (today):** [Block catalog](../reference/block-catalog.md) (`blockCatalogVersion = 1`)  
**Catalog expansion (shipped 1.1.0):** framework **1.1.x** (`blockCatalogVersion = 2`)

## Status legend

| Symbol | Meaning |
| --- | --- |
| ✅ | Shipped in framework and/or Studio |
| 🟡 | Partial (subset of H5P behavior or Studio-only) |
| ⬜ | Planned (see milestone columns) |
| 🚫 | Out of scope (discontinued, unmaintained, or explicit non-goal) |

## Assessment contract (framework 1.1.x)

H5P question types implement the [question type contract](https://h5p.org/documentation/developers/contracts) (`getScore`, `getMaxScore`, `getAnswerGiven`, `resetTask`, `showSolutions`, `getXAPIData`, behaviour flags). LessonKit **1.1.x** defines an equivalent **`Assessment` runtime contract** on scored blocks:

| Method / surface | Purpose |
| --- | --- |
| `getScore()` / `getMaxScore()` | Parent compounds (`AssessmentSequence`, `SlideDeck`, …) aggregate scores |
| `getAnswerGiven()` | Gate “Check answer” and completion |
| `resetTask()` / `showSolutions()` | Retry and solution modes (`enableRetry`, `enableSolutionsButton`) |
| `getXAPIData()` | Canonical xAPI via `@lessonkit/xapi` |
| `getCurrentState()` / `resume(state)` | Resume inside compounds (1.2.x compounds) |
| `checkId` | Required on all scored blocks; sync with `lessonkit.json` |

`Quiz` / `KnowledgeCheck` (v1) are the baseline implementation; **1.1.x P0** blocks must implement the same contract.

### Framework 1.1.x — P0 checklist

| # | LessonKit block | H5P analog | Deliverable |
| --- | --- | --- | --- |
| 1 | `Assessment` (contract) | `H5P.Question` base | Shared types in `@lessonkit/core`; enforced in `block-contract.v2.json` |
| 2 | `TrueFalse` | True/False | Component + catalog entry + Storybook + unit tests |
| 3 | `FillInTheBlanks` | Fill in the Blanks | xAPI `fill-in`; keyboard-accessible blanks |
| 4 | `DragAndDrop` | Drag and Drop | Keyboard alternative to drag; image + text modes |
| 5 | `DragTheWords` | Drag the Words | Extends drag model for inline text |
| 6 | `MarkTheWords` | Mark the Words | Token select via keyboard + pointer |
| 7 | `Quiz` (extend) | Multiple Choice variants | Document v1 as MCQ subset; optional shuffle / multi-select in 1.1.1 |
| 8 | Telemetry catalog v2 | — | Events for new interaction types (e.g. `blank_filled`, `item_dropped`) |
| 9 | `block-catalog.v2.json` | — | Machine-readable entries for all above; semver bump `@lessonkit/react` |
| 10 | Export parity | — | Golden example + e2e: each P0 block scores in standalone + SCORM |
| 11 | H5P docs (each block) | — | [ROADMAP H5P documentation checklist](roadmap.md#h5p-documentation-checklist-per-block) |

**Studio 0.8.x (paired):** schema types + renderer + palette for 1.1.x P0 blocks; H5P-familiar palette labels per checklist.

### H5P documentation checklist (per block)

Required when a row moves to ✅ — full gate in [ROADMAP](roadmap.md#h5p-documentation-checklist-per-block):

1. Update **Status** (and milestone columns) in the master table below.
2. Add or extend **block catalog** entry with H5P display + machine name.
3. Refresh [Coming from H5P?](../guides/h5p-for-lessonkit-authors.md) tables (shipped vs planned).
4. Storybook subtitle references H5P display name.
5. Studio palette label matches H5P display name where the block is authored visually.
6. Set `h5pMachineName` / `h5pAlias` on catalog JSON when 1.1.x catalog fields ship.

---

## Master traceability table

H5P **machine names** follow common library ids (e.g. `H5P.MultiChoice`). Display names match [h5p.org/content-types-and-applications](https://h5p.org/content-types-and-applications).

| H5P machine name | H5P display name | LessonKit id | Tier | Priority | Status | Framework | Studio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `H5P.MultiChoice` | Multiple Choice | `Quiz` / `KnowledgeCheck` | B | — | ✅ | 1.0 | 0.1+ |
| `H5P.TrueFalse` | True/False | `TrueFalse` | B | P0 | ✅ | 1.1.x | 0.8.x |
| `H5P.Blanks` | Fill in the Blanks | `FillInTheBlanks` | B | P0 | ✅ | 1.1.x | 0.8.x |
| `H5P.DragQuestion` | Drag and Drop | `DragAndDrop` | B | P0 | ✅ | 1.1.x | 0.8.x |
| `H5P.DragText` | Drag the Words | `DragTheWords` | B | P0 | ✅ | 1.1.x | 0.8.x |
| `H5P.MarkTheWords` | Mark the Words | `MarkTheWords` | B | P0 | ✅ | 1.1.x | 0.8.x |
| `H5P.SingleChoiceSet` | Single Choice Set | `SingleChoiceSet` | B | P1 | ⬜ | 1.1.1+ | 0.8.x |
| `H5P.Summary` | Summary | `Summary` | B | P1 | ⬜ | 1.1.1+ | 0.8.x |
| `H5P.SortParagraphs` | Sort the Paragraphs | `SortParagraphs` | B | P1 | ⬜ | 1.1.1+ | 0.8.x |
| `H5P.GuessTheAnswer` | Guess the Answer | `GuessTheAnswer` | B | P1 | ⬜ | 1.1.1+ | 0.9.x |
| `H5P.ImageMultipleHotspotQuestion` | Multimedia Choice | `MultimediaChoice` | B | P1 | ⬜ | 1.1.1+ | 0.9.x |
| `H5P.SpeakTheWords` | Speak the Words | `SpeakTheWords` | B | P2 | ⬜ | 1.2.x | 0.10.x |
| `H5P.SpeakTheWordsSet` | Speak the Words Set | `SpeakTheWordsSet` | B | P2 | ⬜ | 1.2.x | 0.10.x |
| `H5P.Dictation` | Dictation | `Dictation` | B | P2 | ⬜ | 1.2.x | 0.10.x |
| `H5P.AdvancedBlanks` / `H5P.ComplexQuestion` | Complex Fill in the Blanks | `AdvancedBlanks` | B | P2 | ⬜ | 1.3.x | 0.10.x |
| `H5P.ArithmeticQuiz` | Arithmetic Quiz | `ArithmeticQuiz` | B | P3 | ⬜ | 1.4.x | — |
| `H5P.Essay` | Essay | `Essay` | B | P3 | ⬜ | 1.4.x | 0.11.x |
| `H5P.Questionnaire` | Questionnaire | `Questionnaire` | B | P3 | ⬜ | 1.4.x | — |
| `H5P.QuestionSet` | Question Set (Quiz) | `AssessmentSequence` | A | P1 | ✅ | 1.1.x | 0.8.x |
| — | Scenario (narrative) | `Scenario` | — | — | ✅ | 1.0 | 0.1+ |
| — | Reflection (open text) | `Reflection` | — | — | ✅ | 1.0 | — |
| `H5P.InteractiveBook` | Interactive Book | `InteractiveBook` | A | P0 | ✅ | 1.2.x | 0.8.x |
| `H5P.CoursePresentation` | Course Presentation | `SlideDeck` | A | P0 | ⬜ | 1.3.x | 0.9.x |
| `H5P.InteractiveVideo` | Interactive Video | `InteractiveVideo` | A | P0 | ⬜ | 1.4.x | 0.10.x |
| `H5P.BranchingScenario` | Branching Scenario | `BranchingScenario` | A | P0 | ⬜ | 1.5.x | 0.11.x |
| `H5P.Column` | Column / Page | `Page` | A | P1 | ✅ | 1.2.x | 0.8.x (`container`) |
| `H5P.GameMap` | Game Map | `GameMap` | A | P2 | ⬜ | 1.7.x | — |
| `H5P.ThreeSixty` | Virtual Tour (360) | `VirtualTour` | A | P2 | ⬜ | 1.9.x | — |
| `H5P.DocumentationTool` | Documentation Tool | `DocumentationTool` | A | P3 | ⬜ | 2.x | — |
| `H5P.StructureStrip` | Interactive Structure Strip | `StructureStrip` | A | P3 | ⬜ | 2.x | — |
| `H5P.ImageHotspots` | Image Hotspots | `ImageHotspots` | C | P1 | ✅ | 1.2.x | 0.8.x |
| `H5P.ImageHotspotQuestion` | Find the Hotspot | `FindHotspot` | C | P1 | ✅ | 1.2.x | 0.8.x |
| `H5P.ImageMultipleHotspotQuestion` | Find Multiple Hotspots | `FindMultipleHotspots` | C | P1 | ✅ | 1.2.x | 0.8.x |
| `H5P.ImageSlider` | Image Slider | `ImageSlider` | C | P1 | ✅ | 1.2.x | 0.8.x |
| `H5P.ImageJuxtaposition` | Image Juxtaposition | `ImageJuxtaposition` | C | P2 | ⬜ | 1.3.x | — |
| `H5P.Agamotto` | Agamotto (Image Blender) | `ImageSequence` | C | P2 | ⬜ | 1.3.x | — |
| `H5P.Collage` | Collage | `Collage` | C | P2 | ⬜ | 1.3.x | 0.9.x |
| `H5P.ImagePair` | Image Pairing | `ImagePairing` | C | P2 | ⬜ | 1.4.x | — |
| `H5P.ImageSequencing` | Image Sequencing | `ImageSequencing` | C | P2 | ⬜ | 1.4.x | — |
| `H5P.MemoryGame` | Memory Game | `MemoryGame` | C | P2 | ⬜ | 1.4.x | — |
| `H5P.IFrameEmbed` | Iframe Embedder | `Embed` | C | P3 | ⬜ | 1.5.x | — |
| `H5P.Chart` | Chart | `Chart` | C | P3 | ⬜ | 1.5.x | — |
| `H5P.Accordion` | Accordion | `Accordion` | D | P1 | ✅ | 1.2.x | 0.8.x |
| `H5P.Dialogcards` | Dialog Cards | `DialogCards` | D | P1 | ✅ | 1.2.x | 0.8.x |
| `H5P.Flashcards` | Flashcards | `Flashcards` | D | P1 | ✅ | 1.2.x | 0.8.x |
| `H5P.Timeline` | Timeline | `Timeline` | D | P2 | ⬜ | 1.3.x | — |
| `H5P.Table` | Table | `Table` | D | P2 | ⬜ | 1.2.x | 0.8.x |
| `H5P.InformationWall` | Information Wall | `InformationWall` | D | P2 | ⬜ | 1.4.x | — |
| `H5P.AudioRecorder` | Audio Recorder | `AudioRecorder` | D | P1 | ⬜ | 1.2.x | 0.9.x |
| `H5P.ImpressivePresentation` | Slideshow (parallax) | `ParallaxSlideshow` | D | P2 | ⬜ | 1.4.x | — |
| `H5P.ExportableTextArea` | Exportable Text Area | `ExportableNotes` | D | P3 | ⬜ | 2.x | — |
| `H5P.PersonalityQuiz` | Personality Quiz | `PersonalityQuiz` | D | P3 | ⬜ | 2.x | — |
| `H5P.Crossword` | Crossword | `Crossword` | E | P3 | ⬜ | 1.6.x | — |
| `H5P.FindTheWords` | Find the Words | `WordSearch` | E | P3 | ⬜ | 1.6.x | — |
| `H5P.CombinationLock` | Combination Lock | `CombinationLock` | E | P3 | ⬜ | 1.6.x | — |
| `H5P.KewArCode` | KewAr Code | `QrContent` | E | P3 | ⬜ | 1.6.x | — |
| `H5P.AdventCalendar` | Advent Calendar | `AdventCalendar` | E | P3 | ⬜ | 1.7.x | — |
| `H5P.AgoraWorld` | Agora World | `AugmentedReality` | E | P4 | ⬜ | research | — |
| — | Course / lesson shell | `Course`, `Lesson` | — | — | ✅ | 1.0 | — |
| — | Progress UI | `ProgressTracker` | — | — | ✅ | 1.0 | — |
| — | Text | `text` (Studio) | D | — | 🟡 | — | 0.1+ |
| — | Heading | `heading` (Studio) | D | — | 🟡 | — | 0.1+ |
| — | Image | `image` (Studio) | D | — | 🟡 | — | 0.1+ |
| — | Video | `video` (Studio) | D | — | 🟡 | — | 0.2+ |
| — | Audio / Link | `audio`, `link` (Studio) | D | P1 | ⬜ | 1.2.x | 0.8.x |
| `H5P.TwitterUserFeed` | Twitter User Feed | — | — | — | 🚫 | — | Discontinued |
| `H5P.AppearIn` | appear.in | — | — | — | 🚫 | — | Discontinued |

### Platform capabilities (not content types)

| H5P capability | LessonKit target | Status | Milestone |
| --- | --- | --- | --- |
| Content Type Hub | Block registry + `lessonkit blocks list` | ⬜ | Studio 0.8.x, CLI 1.6.x |
| `.h5p` package | `.lkcourse` zip + optional import adapter | ⬜ | 1.6.x |
| `semantics.json` editor | JSON Schema–driven Studio inspector | ⬜ | Studio 0.9.x |
| Question type contract | `Assessment` interface | ✅ | 1.1.x |
| Compound allowlists | `allowedChildTypes` in catalog | ✅ | 1.2.x |
| Resume state | `getCurrentState` / session v2 | ✅ | 1.2.x |
| OER Hub reuse | Template gallery | ⬜ | Studio 0.6.x+ |
| Per-library CSS | Global `--lk-*` tokens | ✅ | 0.4.x / themes |

---

## Compound nesting (planned allowlists)

Mirrors H5P maintainer curation ([why sub-content differs](https://snordian.de/2023/11/16/why-isnt-h5p-content-type-x-available-as-a-subcontent-option-in-content-type-y/)). Exact lists ship with each compound in **1.2.x+**.

| Parent (LessonKit) | Planned child blocks (initial) |
| --- | --- |
| `Page` | text, heading, image, video, audio, link, accordion, `TrueFalse`, `FillInTheBlanks`, `Quiz`, … |
| `InteractiveBook` | `Page` chapters + same assessment set as H5P Interactive Book launch set |
| `SlideDeck` | Per-slide: text, image, video, assessments, `Summary`, … |
| `InteractiveVideo` | Timed: `Quiz`, `TrueFalse`, `FillInTheBlanks`, text, image, … |
| `BranchingScenario` | Scored nodes + `Scenario` content; branch telemetry |
| `AssessmentSequence` | All **Assessment contract** blocks |

**Excluded from nesting (initial policy):** `WordSearch` (keyboard), nested `Accordion`, unrestricted `Embed`, unmaintained H5P third-party types.

---

## H5P import adapter (research, 1.6.x)

Read-only mapping for a **subset** of `.h5p` content into `StudioProjectV1` / React codegen—not runtime embedding.

| H5P type | Import priority | Notes |
| --- | --- | --- |
| `H5P.MultiChoice` | P0 | Maps to `Quiz` |
| `H5P.TrueFalse` | P0 | Maps to `TrueFalse` |
| `H5P.Blanks` | P0 | Text normalization |
| `H5P.InteractiveBook` | P1 | Chapter → pages |
| `H5P.CoursePresentation` | P2 | Slide → `SlideDeck` |
| `H5P.InteractiveVideo` | P2 | Timeline complexity |
| Branching / games | P3+ | Manual rewrite likely |

---

## Maintenance

- When a block ships: complete the [H5P documentation checklist](#h5p-documentation-checklist-per-block) in the same release (do not merge implementation-only PRs without doc updates).
- Update **Status** and **Framework** / **Studio** columns in the master table.
- Bump [block catalog](../reference/block-catalog.md) version section when `block-catalog.v2.json` lands.
- Keep [ROADMAP.md](roadmap.md#h5p-aligned-capability-backlog) tiers in sync with this table.
