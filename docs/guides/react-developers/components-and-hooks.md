# Components and hooks

:::{admonition} Guides vs reference
:class: note

**Guides** (this page) explain how to use components in a course. **Reference** docs hold contracts and machine-readable schemas: [Block catalog](../../reference/block-catalog.md) (includes [generated prop tables](../../reference/block-catalog.md#generated-prop-reference-catalog-v3)), [Component pages](../../reference/components/index.md) (live demos + when to use each block), and [TypeDoc signatures](../../reference/api.md). Start here for workflows; open reference when implementing or validating props.
:::

:::{admonition} H5P equivalents
:class: tip

| LessonKit | H5P |
| --- | --- |
| `Quiz` / `KnowledgeCheck` | Multiple Choice |
| `TrueFalse` | True/False |
| `FillInTheBlanks` | Fill in the Blanks |
| `DragAndDrop` | Drag and Drop |
| `DragTheWords` | Drag the Words |
| `MarkTheWords` | Mark the Words |
| `AssessmentSequence` | Question Set |
| `SlideDeck` / `Slide` | Course Presentation |
| `InteractiveVideo` / `TimedCue` | Interactive Video |
| `InteractiveBook` / `Page` | Interactive Book / Column |
| `Video` | Self-hosted video (slides/pages) |
| `Summary` | Summary |
| `ImagePairing` | Image Pairing |
| `ImageSequencing` | Image Sequencing |
| `MemoryGame` | Memory Game |
| `Questionnaire` | Questionnaire |
| `Essay` | Essay |
| `ArithmeticQuiz` | Arithmetic Quiz |
| `InformationWall` | Information Wall |
| `ParallaxSlideshow` | Slideshow (parallax) |
| `BranchingScenario` / `BranchNode` / `BranchChoice` | Branching Scenario |
| `Embed` | Iframe Embedder |
| `Chart` | Chart (bar / list pie + table) |
| `Table` | Table |
| `Timeline` | Timeline |
| `Crossword` | Crossword |
| `WordSearch` | Word Search |
| `CombinationLock` | Combination Lock |
| `GameMap` / `MapStage` / `MapExit` | Game Map |
| `ImageJuxtaposition` | Image Juxtaposition |
| `ImageSequence` | Image Sequence |
| `Collage` | Collage |
| `AudioRecorder` | Audio Recorder |
| `QrContent` | QR Content |
| `AdventCalendar` | Advent Calendar |
| `SortParagraphs` | Sort the Paragraphs |
| `GuessTheAnswer` | Guess the Answer |
| `MultimediaChoice` | Multimedia Choice |
| `SingleChoiceSet` | Single Choice Set |
| `Scenario` | Scenario / narrative block |
| `Reflection` | Open response (manual scoring) |

Compound containers include `InteractiveBook`, `SlideDeck`, `InteractiveVideo`, **`BranchingScenario`** (1.5), and **`GameMap`** (1.6). See **[Coming from H5P?](../h5p-for-lessonkit-authors.md)** and the **[capability map](../../project/h5p-capability-map.md)**.

**Framework 1.6 blocks** (`Table`, `Timeline`, `Crossword`, `WordSearch`, `GameMap`, `CombinationLock`, and others): see [Block catalog — 1.6.0](../../reference/block-catalog.md#catalog-v3-additions-framework-160) and [generated prop tables](../../reference/block-catalog.md#generated-prop-reference-catalog-v3).

**Framework 1.7 blocks** (`SortParagraphs`, `GuessTheAnswer`, `MultimediaChoice`, `SingleChoiceSet`, plus Quiz multi-select/shuffle/feedback): see [Block catalog — 1.7.0](../../reference/block-catalog.md#catalog-v3-additions-framework-170) and [Migration 1.6 → 1.7](../../MIGRATION-1.6-to-1.7.md).
:::

Canonical block list, props, and contracts: [Block catalog reference](../../reference/block-catalog.md).

## Components

| Component | Required props | Role |
| --- | --- | --- |
| `Course` | `title`, `courseId` | Wraps provider; course shell |
| `Lesson` | `title`, `lessonId` | Lesson lifecycle (start/complete on mount/unmount) |
| `Scenario` | — | Semantic scenario region |
| `Quiz` / `KnowledgeCheck` | `checkId`, `question`, `choices`, `answer` | MCQ assessment (`quiz_*` telemetry) |
| `TrueFalse` | `checkId`, `question`, `answer` (boolean) | Two-option assessment (`assessment_*` telemetry) |
| `FillInTheBlanks` | `checkId`, `template` (`*blank*` syntax); optional `blanks[]` | Inline inputs; `interactionType: fillInBlanks` |
| `DragTheWords` | `checkId`, `template`, `words` | Inline drag targets; `interactionType: dragTheWords` |
| `DragAndDrop` | `checkId`, `items[]`, `targets[]` | Drag items to targets; keyboard alternative |
| `MarkTheWords` | `checkId`, `text`, `correctWords` | Select correct word tokens in running text |
| `AssessmentSequence` | `blockId?`, children with `checkId` | Question-set container; aggregates child handles |
| `SlideDeck` | `blockId`, `title`, `Slide` children | Course Presentation; keyboard slide nav; `CompoundHandle` |
| `Slide` | `blockId`, optional `title` | Single slide row inside `SlideDeck` |
| `InteractiveVideo` | `blockId`, `title`, `src`, `TimedCue` children | Interactive Video; pause on cue; `CompoundHandle` |
| `TimedCue` | `atSeconds`, optional `label`, `mustComplete?` | Single timed overlay child inside `InteractiveVideo` |
| `Video` | `blockId`, `src`, optional `poster`, `captions` | Self-hosted video primitive |
| `Summary` | `checkId`, `statements[]`, `correct[]` | Statement-bank construct task |
| `InteractiveBook` | `blockId`, `title`, `Page` children | Multi-chapter book; `CompoundHandle` |
| `BranchingScenario` | `blockId`, `title`, `startNodeId`, `BranchNode` children | Graph navigation; `CompoundHandle` |
| `Embed` | `blockId`, `src`, optional `title`, `allow`, `aspectRatio` | Sandboxed iframe |
| `Chart` | `blockId`, `type` (`bar` \| `pie`), `data[]`, optional `title` | Bar chart or list-style pie + data table |
| `Page` | `blockId`, optional `title` | Column/chapter inside `InteractiveBook` |
| `Reflection` | optional `prompt`, `blockId` | Textarea reflection block |
| `ProgressTracker` | optional `totalLessons` | Shows completed lesson count |

### Content and presentation blocks

These blocks ship in `@lessonkit/react` and appear in the [block catalog](../../reference/block-catalog.md). Props below are summaries — see [generated prop tables](../../reference/block-catalog.md#generated-prop-reference-catalog-v3) for full contracts.

| Component | Required props | Role |
| --- | --- | --- |
| `Text` | `blockId`, children or `content` | Rich text paragraph |
| `Heading` | `blockId`, `level`, children | Semantic heading (`h1`–`h6`) |
| `Image` | `blockId`, `src`, `alt` | Accessible image |
| `ImagePairing` | `checkId`, `pairs[]` | Match image pairs assessment |
| `ImageSequencing` | `checkId`, `images[]` | Order images correctly |
| `ArithmeticQuiz` | `checkId`, `problems[]` | Numeric drill assessment |
| `Essay` | `checkId`, `prompt` | Long-form text (manual scoring) |
| `Questionnaire` | `blockId`, `fields[]` | Multi-field form |
| `MemoryGame` | `blockId`, `pairs[]` | Card-matching game |
| `InformationWall` | `blockId`, `panels[]` | Searchable panel grid |
| `ParallaxSlideshow` | `blockId`, `slides[]` | Parallax image slideshow |
| `Accordion` | `blockId`, `sections[]` | Expandable sections |
| `DialogCards` | `blockId`, `cards[]` | Flip/dialog cards |
| `Flashcards` | `blockId`, `cards[]` | Study deck |
| `ImageHotspots` | `blockId`, `src`, `hotspots[]` | Clickable image regions |
| `ImageSlider` | `blockId`, `slides[]` | Before/after or image carousel |
| `FindHotspot` | `checkId`, `src`, `targets[]` | Single hotspot find task |
| `FindMultipleHotspots` | `checkId`, `src`, `targets[]` | Multiple hotspot find task |
| `Table` | `blockId`, `headers[]`, `rows[][]` | Accessible data table (1.6) |
| `Timeline` | `blockId`, `events[]` | Event list with focus tracking (1.6) |
| `Crossword` | `checkId`, `grid`, `clues[]` | Grid fill assessment (1.6) |
| `WordSearch` | `checkId`, `grid`, `words[]` | Letter grid word find (1.6) |
| `CombinationLock` | `checkId`, `digits`, `answer` | Digit entry assessment (1.6) |
| `GameMap` | `blockId`, `title`, `MapStage` / `MapExit` children | Spatial compound map (1.6) |
| `ImageJuxtaposition` | `blockId`, `before`, `after` | Before/after slider (1.6) |
| `ImageSequence` | `blockId`, `frames[]` | Stepped image frames (1.6) |
| `Collage` | `blockId`, `images[]` | Multi-image layout (1.6) |
| `AudioRecorder` | `blockId` | Browser audio capture (1.6) |
| `QrContent` | `blockId`, `payload` | QR payload with reveal (1.6) |
| `AdventCalendar` | `blockId`, `doors[]` | Door-based reveal calendar (1.6) |

Import tree-shake friendly: `import { Quiz } from "@lessonkit/react/blocks"`.

`Course` accepts `config` for tracking/xAPI and optional `sinks` (same shape as `LessonkitProvider`).

## Common optional props

Full contracts: [Block catalog](../../reference/block-catalog.md) · [Storybook gallery](../../reference/storybook-gallery.md) · [Storybook on GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/).

| Component | Optional props | Notes |
| --- | --- | --- |
| `Course` | `config` | `config`: tracking, xAPI, `lxpack.bridge`, `lxpack.allowedParentOrigins`, observability, plugins |
| `Lesson` | `autoCompleteOnUnmount` | Completes on unmount when another lesson becomes active |
| `Quiz` / `KnowledgeCheck` | `passingScore`, `enableRetry`, `enableSolutionsButton`, `autoCheck` | `KnowledgeCheck` is an alias of `Quiz`; exact string match on `answer` |
| `Scenario` | `blockId` | Enables block-level URNs on manual `interaction` events |
| `SlideDeck` | `blockId`, `title`, optional `enableSolutionsButton`, `showPathRecap` | Compound resume via `config.session.persistCompoundState` (default true). Headless APIs: [Core reference — compound state](../../reference/core.md#compound-state-and-resume) |
| `InteractiveBook` | `blockId`, `title` | Same compound resume rules as `SlideDeck`. See [Core — compound state](../../reference/core.md#compound-state-and-resume) |
| `BranchingScenario` | `blockId`, `title`, `startNodeId`, optional `showPathRecap`, `enableSolutionsButton` | Graph resume; pre-1.5 sessions restart at `startNodeId`. Branch meta: [Core — branching](../../reference/core.md#branching-scenario-meta) |
| `Embed` | `title`, `allow`, `aspectRatio` | Restrictive iframe defaults; opt in extra `allow` tokens |
| `Chart` | `title` | Accessible data table fallback for screen readers |
| `ThemeProvider` | `mode`, `preset`, `tokens` | `mode`: `light` \| `dark` \| `system` |

(lessonkitconfig-on-course-lessonkitprovider)=
### `LessonkitConfig` (on `Course` / `LessonkitProvider`)

| Field | Purpose |
| --- | --- |
| `tracking` | Sink, batch sink, `enabled: false` |
| `xapi` | Transport, client, `enabled: false` |
| `lxpack.bridge` | `"auto"` for LMS iframe; `"off"` for standalone |
| `observability` | Production monitoring hooks (required when delivery enabled) |
| `session` | `sessionId`, `user`, `persistCompoundState` |
| `plugins` | Telemetry/lifecycle plugin registry |

Errors: `assertProductionCourseConfig()` throws in production when console sinks, missing delivery, or missing observability hooks. See [production checklist](production-checklist.md).

## Storybook

Browse published stories: **[Storybook on GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/)** · [Component gallery (Storybook)](../../reference/storybook-gallery.md) on Read the Docs.

Run the gallery locally from the monorepo:

```bash
npm run storybook
```

See [packages/react/stories](https://github.com/eddiethedean/lessonkit/tree/main/packages/react/stories) for story groups (Course/Lesson layouts, Quiz states, blocks). API index: [API reference](../../reference/api.md).

## Hooks

| Hook | Returns |
| --- | --- |
| `useLessonkit()` | Full runtime (throws outside provider) |
| `useProgress()` | `progress` state |
| `useTracking()` | `{ track }` |
| `useQuizState()` | `{ answer, complete }` — MCQ helper; requires `checkId` |
| `useAssessmentState()` | Generalized assessment lifecycle + `assessment_*` telemetry |
| `useCompletion()` | `{ completeLesson, completeCourse }` |
| `useBranchingScenario()` | Active node, visited path, `navigateToNode`, `choicesLocked` (1.5) |
| `useTheme()` | Theme context from `ThemeProvider` |

## Lesson lifecycle

`Lesson` calls `setActiveLesson` on mount and `completeLesson` on unmount. SPA navigation that **unmounts** lessons emits completion and time-on-task events—design navigation accordingly (see `examples/react-vite`).

## Custom interactions

```tsx
const { track } = useTracking();

track("interaction", { kind: "branch_choice", branch: "verify" });
```

Use discriminated `data` shapes per [Telemetry reference](../../reference/telemetry.md).

## Provider-only usage

```tsx
<LessonkitProvider config={{ courseId: "my-course", tracking: { sink } }}>
  {/* custom tree */}
</LessonkitProvider>
```

Package README: [`@lessonkit/react` on GitHub](https://github.com/eddiethedean/lessonkit/tree/main/packages/react).
