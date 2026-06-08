# Component pages

Each page renders the **real `@lessonkit/react` component** in an embedded demo, explains **when to use it**, and shows copy-paste examples you can adapt into a course.

**Coverage:** **55 component pages** — one for every block type in `block-catalog.v3.json`, including graph children (`BranchNode`, `BranchChoice`, `MapStage`, `MapExit`) and the [`KnowledgeCheck`](knowledge-check.md) alias of [`Quiz`](quiz.md). Multi-block guides: [Course structure](course-structure.md), [Text & Heading](text-and-heading.md).

**Try it tabs:** **Live demo**, **React** example, copy-paste **AI prompt** (for vibe coding), and **Manifest** / **Packaging** notes — synced from `page-copy.json` and `manifest-snippets.json`.

:::{admonition} Related references
:class: tip

| Need | Page |
| --- | --- |
| Full prop contracts and nesting rules | [Block catalog](../block-catalog.md) |
| Copy-paste snippets only (no live demo) | [Block cookbook](../../guides/react-developers/block-cookbook.md) |
| Visual states in isolation | [Storybook gallery](../storybook-gallery.md) |
| Full courses | [Live examples](../../examples/index.md) |
:::

:::{admonition} Local preview
:class: tip

From the repo root: `bash docs/scripts/build-component-demos.sh`, then open `docs/_static/component-demos/index.html#/true-false` in a browser. Run `npm -w lessonkit-docs-component-demos run dev` for a fast edit loop.
:::

## Component picker

<!-- component-picker:start -->
| Component | Category | H5P-style name |
| --- | --- | --- |
| [`Accordion`](accordion.md) | Content | Accordion |
| [`AdventCalendar`](advent-calendar.md) | Content | Advent Calendar |
| [`ArithmeticQuiz`](arithmetic-quiz.md) | Assessment | Arithmetic Quiz |
| [`AssessmentSequence`](assessment-sequence.md) | Compound | Question Set |
| [`AudioRecorder`](audio-recorder.md) | Content | Audio Recorder |
| [`BranchChoice`](branch-choice.md) | Compound child | Branching Scenario (choice) |
| [`BranchingScenario`](branching-scenario.md) | Compound | Branching Scenario |
| [`BranchNode`](branch-node.md) | Compound child | Branching Scenario (node) |
| [`Chart`](chart.md) | Content | Chart |
| [`Collage`](collage.md) | Content | Collage |
| [`CombinationLock`](combination-lock.md) | Assessment | Combination Lock |
| [`Course structure`](course-structure.md) | Container | — |
| [`Crossword`](crossword.md) | Assessment | Crossword |
| [`DialogCards`](dialog-cards.md) | Content | Dialog Cards |
| [`DragAndDrop`](drag-and-drop.md) | Assessment | Drag and Drop |
| [`DragTheWords`](drag-the-words.md) | Assessment | Drag the Words |
| [`Embed`](embed.md) | Content | Iframe Embedder |
| [`Essay`](essay.md) | Assessment | Essay |
| [`FillInTheBlanks`](fill-in-the-blanks.md) | Assessment | Fill in the Blanks |
| [`FindHotspot`](find-hotspot.md) | Assessment | Find the Hotspot |
| [`FindMultipleHotspots`](find-multiple-hotspots.md) | Assessment | Find Multiple Hotspots |
| [`Flashcards`](flashcards.md) | Content | Flashcards |
| [`GameMap`](game-map.md) | Compound | Game Map |
| [`Image`](image.md) | Content | Image |
| [`ImageHotspots`](image-hotspots.md) | Content | Image Hotspots |
| [`ImageJuxtaposition`](image-juxtaposition.md) | Content | Image Juxtaposition |
| [`ImagePairing`](image-pairing.md) | Assessment | Image Pairing |
| [`ImageSequence`](image-sequence.md) | Content | Image Sequencing (frames) |
| [`ImageSequencing`](image-sequencing.md) | Assessment | Image Sequencing |
| [`ImageSlider`](image-slider.md) | Content | Image Slider |
| [`InformationWall`](information-wall.md) | Content | Information Wall |
| [`InteractiveBook`](interactive-book.md) | Compound | Interactive Book |
| [`InteractiveVideo`](interactive-video.md) | Compound | Interactive Video |
| [`KnowledgeCheck`](knowledge-check.md) | Assessment | Multiple Choice |
| [`MapExit`](map-exit.md) | Compound child | Game Map (exit) |
| [`MapStage`](map-stage.md) | Compound child | Game Map (stage) |
| [`MarkTheWords`](mark-the-words.md) | Assessment | Mark the Words |
| [`MemoryGame`](memory-game.md) | Content | Memory Game |
| [`Page`](page.md) | Compound child | Interactive Book (page) |
| [`ParallaxSlideshow`](parallax-slideshow.md) | Content | Parallax |
| [`QrContent`](qr-content.md) | Content | KewAr Code |
| [`Questionnaire`](questionnaire.md) | Content | Questionnaire |
| [`Quiz`](quiz.md) | Assessment | Multiple Choice |
| [`Reflection`](reflection.md) | Content | — |
| [`Scenario`](scenario.md) | Content | — |
| [`Slide`](slide.md) | Compound child | Course Presentation (slide) |
| [`SlideDeck`](slide-deck.md) | Compound | Course Presentation |
| [`Summary`](summary.md) | Assessment | Summary |
| [`Table`](table.md) | Content | Table |
| [`Text & Heading`](text-and-heading.md) | Content | — |
| [`TimedCue`](timed-cue.md) | Compound child | Interactive Video (cue) |
| [`Timeline`](timeline.md) | Content | Timeline |
| [`TrueFalse`](true-false.md) | Assessment | True/False |
| [`Video`](video.md) | Content | Self-hosted video |
| [`WordSearch`](word-search.md) | Assessment | Find the words |
<!-- component-picker:end -->

## Adding a component page (contributors)

1. Add a focused demo to `docs/component-demos/src/registry.tsx` (or `src/demos/batch*.tsx`) and an entry in `docs/component-demos/manifest.json` with `blockType` set to the catalog id.
2. Add copy to `docs/component-demos/page-copy.json`, then run `node docs/scripts/scaffold-component-pages.mjs` (or edit `docs/reference/components/<slug>.md` by hand).
3. Add packaging copy to `docs/component-demos/manifest-snippets.json` — assessment JSON for scored blocks, note-only entries for compound containers (`blockId`, resume).
4. Run `node docs/scripts/generate-component-ai-prompts.mjs` (optional review) and `node docs/scripts/sync-component-try-it-tabs.mjs` to refresh **Try it** tabs (Live demo | React | AI prompt | Manifest/Packaging).
5. Run `node docs/scripts/generate-component-pages-index.mjs`, `node docs/scripts/sync-component-toctree.mjs`, `node docs/scripts/generate-block-props-doc.mjs`, and `node docs/scripts/generate-h5p-component-page-index.mjs`.
6. Verify: `bash docs/scripts/build-component-demos.sh && bash docs/scripts/verify-component-demos.sh`.

Demos may compose supporting blocks (for example `TrueFalse` inside `SlideDeck`) when that makes the primary component easier to understand.

<!-- component-toctree:start -->
```{toctree}
:maxdepth: 1
:hidden:

accordion
advent-calendar
arithmetic-quiz
assessment-sequence
audio-recorder
branch-choice
branch-node
branching-scenario
chart
collage
combination-lock
course-structure
crossword
dialog-cards
drag-and-drop
drag-the-words
embed
essay
fill-in-the-blanks
find-hotspot
find-multiple-hotspots
flashcards
game-map
image
image-hotspots
image-juxtaposition
image-pairing
image-sequence
image-sequencing
image-slider
information-wall
interactive-book
interactive-video
knowledge-check
map-exit
map-stage
mark-the-words
memory-game
page
parallax-slideshow
qr-content
questionnaire
quiz
reflection
scenario
slide
slide-deck
summary
table
text-and-heading
timed-cue
timeline
true-false
video
word-search
```
<!-- component-toctree:end -->
