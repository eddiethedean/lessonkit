# H5P → LessonKit capability map

:::{admonition} For H5P authors
:class: tip

Use this page as a **lookup table**: H5P display name and machine name → LessonKit component. Narrative guide: **[Coming from H5P?](../guides/h5p-for-lessonkit-authors.md)**.
:::

Traceability matrix for adopting [H5P](https://h5p.org/content-types-and-applications) interaction patterns as native LessonKit blocks.

**Not in scope:** H5P Hub, `.h5p` import/merge, H5P `semantics.json` transport, H5P Core, or iframe runtimes. Rebuild activities in React using this map.

**Roadmap:** [ROADMAP.md — H5P-aligned backlog](roadmap.md#h5p-aligned-capability-backlog)  
**Runtime catalog (today):** [Block catalog](../reference/block-catalog.md) (`blockCatalogV3Version = 3` — default since framework 1.2; 1.5 adds `BranchingScenario`, `Embed`, `Chart`; 1.6.x adds content-wave blocks including `Table`, `Timeline`, `Crossword`, `GameMap`; **1.7.x** adds Tier B P1 assessments including `SortParagraphs`, `GuessTheAnswer`, `MultimediaChoice`, `SingleChoiceSet`, and Quiz multi-select variants)  
**Live demos:** [Component pages](../reference/components/index.md) — embedded React demos with when-to-use guidance (generated index below).
**Catalog expansion (shipped 1.1.0):** framework **1.1.x** (`blockCatalogV2Version = 2`)

## Status legend

| Symbol | Meaning |
| --- | --- |
| ✅ | Shipped in framework |
| 🟡 | Partial (subset of H5P behavior) |
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

### H5P documentation checklist (per block)

Required when a row moves to ✅ — full gate in [ROADMAP](roadmap.md#h5p-documentation-checklist-per-block):

1. Update **Status** (and milestone columns) in the master table below.
2. Add or extend **block catalog** entry with H5P display + machine name.
3. Refresh [Coming from H5P?](../guides/h5p-for-lessonkit-authors.md) tables (shipped vs planned).
4. Storybook subtitle references H5P display name.
6. Set `h5pMachineName` / `h5pAlias` on catalog JSON when 1.1.x catalog fields ship.

---

## Master traceability table

H5P **machine names** follow common library ids (e.g. `H5P.MultiChoice`). Display names match [h5p.org/content-types-and-applications](https://h5p.org/content-types-and-applications).

| H5P machine name | H5P display name | LessonKit id | Tier | Priority | Status | Framework |
| --- | --- | --- | --- | --- | --- | --- |
| `H5P.MultiChoice` | Multiple Choice | `Quiz` / `KnowledgeCheck` | B | — | ✅ | 1.7.0 (multi-select, shuffle, feedback) |
| `H5P.TrueFalse` | True/False | `TrueFalse` | B | P0 | ✅ | 1.1.x |
| `H5P.Blanks` | Fill in the Blanks | `FillInTheBlanks` | B | P0 | ✅ | 1.1.x |
| `H5P.DragQuestion` | Drag and Drop | `DragAndDrop` | B | P0 | ✅ | 1.1.x |
| `H5P.DragText` | Drag the Words | `DragTheWords` | B | P0 | ✅ | 1.1.x |
| `H5P.MarkTheWords` | Mark the Words | `MarkTheWords` | B | P0 | ✅ | 1.1.x |
| `H5P.SingleChoiceSet` | Single Choice Set | `SingleChoiceSet` | B | P1 | ✅ | 1.7.0 |
| `H5P.Summary` | Summary | `Summary` | B | P1 | ✅ | 1.4.0 |
| `H5P.SortParagraphs` | Sort the Paragraphs | `SortParagraphs` | B | P1 | ✅ | 1.7.0 |
| `H5P.GuessTheAnswer` | Guess the Answer | `GuessTheAnswer` | B | P1 | ✅ | 1.7.0 |
| `H5P.ImageMultipleHotspotQuestion` | Multimedia Choice | `MultimediaChoice` | B | P1 | ✅ | 1.7.0 |
| `H5P.SpeakTheWords` | Speak the Words | `SpeakTheWords` | B | P2 | ⬜ | 1.2.x |
| `H5P.SpeakTheWordsSet` | Speak the Words Set | `SpeakTheWordsSet` | B | P2 | ⬜ | 1.2.x |
| `H5P.Dictation` | Dictation | `Dictation` | B | P2 | ⬜ | 1.2.x |
| `H5P.AdvancedBlanks` / `H5P.ComplexQuestion` | Complex Fill in the Blanks | `AdvancedBlanks` | B | P2 | ⬜ | 1.3.x |
| `H5P.ArithmeticQuiz` | Arithmetic Quiz | `ArithmeticQuiz` | B | P3 | ✅ | 1.4.0 |
| `H5P.Essay` | Essay | `Essay` | B | P3 | ✅ | 1.4.0 |
| `H5P.Questionnaire` | Questionnaire | `Questionnaire` | B | P3 | ✅ | 1.4.0 |
| `H5P.QuestionSet` | Question Set (Quiz) | `AssessmentSequence` | A | P1 | ✅ | 1.1.x |
| — | Scenario (narrative) | `Scenario` | — | — | ✅ | 1.0 |
| — | Reflection (open text) | `Reflection` | — | — | ✅ | 1.0 |
| `H5P.InteractiveBook` | Interactive Book | `InteractiveBook` | A | P0 | ✅ | 1.2.x |
| `H5P.CoursePresentation` | Course Presentation | `SlideDeck` | A | P0 | ✅ | 1.3.x |
| `H5P.InteractiveVideo` | Interactive Video | `InteractiveVideo` | A | P0 | ✅ | 1.4.0 |
| `H5P.BranchingScenario` | Branching Scenario | `BranchingScenario` | A | P0 | ✅ | 1.5.0 |
| `H5P.Column` | Column / Page | `Page` | A | P1 | ✅ | 1.2.x |
| `H5P.GameMap` | Game Map | `GameMap` | A | P2 | ✅ | 1.6.x |
| `H5P.ThreeSixty` | Virtual Tour (360) | `VirtualTour` | A | P2 | ⬜ | 1.8.x |
| `H5P.DocumentationTool` | Documentation Tool | `DocumentationTool` | A | P3 | ⬜ | 2.x |
| `H5P.StructureStrip` | Interactive Structure Strip | `StructureStrip` | A | P3 | ⬜ | 2.x |
| `H5P.ImageHotspots` | Image Hotspots | `ImageHotspots` | C | P1 | ✅ | 1.2.x |
| `H5P.ImageHotspotQuestion` | Find the Hotspot | `FindHotspot` | C | P1 | ✅ | 1.2.x |
| `H5P.ImageMultipleHotspotQuestion` | Find Multiple Hotspots | `FindMultipleHotspots` | C | P1 | ✅ | 1.2.x |
| `H5P.ImageSlider` | Image Slider | `ImageSlider` | C | P1 | ✅ | 1.2.x |
| `H5P.ImageJuxtaposition` | Image Juxtaposition | `ImageJuxtaposition` | C | P2 | ✅ | 1.6.0 |
| `H5P.Agamotto` | Agamotto (Image Blender) | `ImageSequence` | C | P2 | ✅ | 1.6.0 |
| `H5P.Collage` | Collage | `Collage` | C | P2 | ✅ | 1.6.0 |
| `H5P.ImagePair` | Image Pairing | `ImagePairing` | C | P2 | ✅ | 1.4.0 |
| `H5P.ImageSequencing` | Image Sequencing | `ImageSequencing` | C | P2 | ✅ | 1.4.0 |
| `H5P.MemoryGame` | Memory Game | `MemoryGame` | C | P2 | ✅ | 1.4.0 |
| `H5P.IFrameEmbed` | Iframe Embedder | `Embed` | C | P3 | ✅ | 1.5.0 |
| `H5P.Chart` | Chart | `Chart` | C | P3 | ✅ | 1.5.0 |
| `H5P.Accordion` | Accordion | `Accordion` | D | P1 | ✅ | 1.2.x |
| `H5P.Dialogcards` | Dialog Cards | `DialogCards` | D | P1 | ✅ | 1.2.x |
| `H5P.Flashcards` | Flashcards | `Flashcards` | D | P1 | ✅ | 1.2.x |
| `H5P.Timeline` | Timeline | `Timeline` | D | P2 | ✅ | 1.6.0 |
| `H5P.Table` | Table | `Table` | D | P2 | ✅ | 1.6.0 |
| `H5P.InformationWall` | Information Wall | `InformationWall` | D | P2 | ✅ | 1.4.0 |
| `H5P.AudioRecorder` | Audio Recorder | `AudioRecorder` | D | P1 | ✅ | 1.6.0 |
| `H5P.ImpressivePresentation` | Slideshow (parallax) | `ParallaxSlideshow` | D | P2 | ✅ | 1.4.0 |
| `H5P.ExportableTextArea` | Exportable Text Area | `ExportableNotes` | D | P3 | ⬜ | 2.x |
| `H5P.PersonalityQuiz` | Personality Quiz | `PersonalityQuiz` | D | P3 | ⬜ | 2.x |
| `H5P.Crossword` | Crossword | `Crossword` | E | P3 | ✅ | 1.6.0 |
| `H5P.FindTheWords` | Find the Words | `WordSearch` | E | P3 | ✅ | 1.6.0 |
| `H5P.CombinationLock` | Combination Lock | `CombinationLock` | E | P3 | ✅ | 1.6.0 |
| `H5P.KewArCode` | KewAr Code | `QrContent` | E | P3 | ✅ | 1.6.0 |
| `H5P.AdventCalendar` | Advent Calendar | `AdventCalendar` | E | P3 | ✅ | 1.6.0 |
| `H5P.AgoraWorld` | Agora World | `AugmentedReality` | E | P4 | ⬜ | research |
| — | Course / lesson shell | `Course`, `Lesson` | — | — | ✅ | 1.0 |
| — | Progress UI | `ProgressTracker` | — | — | ✅ | 1.0 |
| `H5P.TwitterUserFeed` | Twitter User Feed | — | — | — | 🚫 | — |
| `H5P.AppearIn` | appear.in | — | — | — | 🚫 | — |

### Platform capabilities (LessonKit-native; H5P analogues for reference)

| H5P analogue (not integrated) | LessonKit approach | Status | Milestone |
| --- | --- | --- | --- |
| Content Type Hub | Block registry + `lessonkit blocks list` | ✅ | CLI 1.6.0 |
| `.h5p` transport | `.lkcourse` portable zip | ✅ | 1.6.0 |
| `.h5p` import / Hub | — | 🚫 | Out of scope |
| H5P `semantics.json` editor | — | 🚫 | Out of scope (future inspector uses LessonKit block catalog only) |
| Question type contract | `Assessment` interface | ✅ | 1.1.x |
| Compound allowlists | `allowedChildTypes` in catalog | ✅ | 1.2.x |
| Resume state | `getCurrentState` / session v2 | ✅ | 1.2.x |
| OER Hub reuse | Template gallery | ⬜ | 1.x |
| Per-library CSS | Global `--lk-*` tokens | ✅ | 0.4.x / themes |

```{include} ../_generated/h5p-component-pages.md
```

---

## Compound nesting (allowlists)

Mirrors H5P maintainer curation ([why sub-content differs](https://snordian.de/2023/11/16/why-isnt-h5p-content-type-x-available-as-a-subcontent-option-in-content-type-y/)). Exact lists ship with each compound in **1.2.x+**.

| Parent (LessonKit) | Child blocks (shipped) |
| --- | --- |
| `Page` | Text, Heading, Image, Video, assessments, Tier C/D content blocks, … |
| `InteractiveBook` | `Page` chapters + same assessment set as H5P Interactive Book launch set |
| `SlideDeck` | Per-slide: text, image, `Video`, assessments, `Summary`, `MemoryGame`, … |
| `InteractiveVideo` | `TimedCue` only; each cue wraps one allowed block (`Quiz`, `TrueFalse`, `Summary`, `ImagePairing`, …). Excludes `ParallaxSlideshow`, `InformationWall`, `Video`. |
| `TimedCue` | Single child from `TIMED_CUE_ALLOWED_CHILD_TYPES` in `@lessonkit/core` |
| `BranchingScenario` | Scored nodes + `Scenario` content; branch telemetry (**1.5.0** ✅) |
| `AssessmentSequence` | All **Assessment contract** blocks |

**Shipped in 1.4.0:** `Video`, `TimedCue`, `InteractiveVideo`, `Summary`, `ImagePairing`, `ImageSequencing`, `MemoryGame`, `InformationWall`, `ParallaxSlideshow`, `Questionnaire`, `Essay`, `ArithmeticQuiz`. See [ROADMAP — 1.4.x](roadmap.md#14x--interactivevideo--bundled-blocks).

**Excluded from nesting (initial policy):** `WordSearch` (keyboard), nested `Accordion`, unrestricted `Embed`, unmaintained H5P third-party types.

---

## Migration from H5P (rebuild only)

LessonKit does **not** import, merge, or sync with H5P Hub, `.h5p` packages, or H5P `semantics.json`. Use this map to **rebuild** each activity as a native `@lessonkit/react` block and wire IDs in `lessonkit.json`. Guide: [Coming from H5P?](../guides/h5p-for-lessonkit-authors.md).

---

## Maintenance

- When a block ships: complete the [H5P documentation checklist](#h5p-documentation-checklist-per-block) in the same release (do not merge implementation-only PRs without doc updates).
- Update **Status** and **Framework** column in the master table.
- Bump [block catalog](../reference/block-catalog.md) version section when `block-catalog.v2.json` lands.
- Keep [ROADMAP.md](roadmap.md#h5p-aligned-capability-backlog) tiers in sync with this table.
