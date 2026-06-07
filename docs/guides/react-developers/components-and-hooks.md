# Components and hooks

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
| `Scenario` | Scenario / narrative block |
| `Reflection` | Open response (manual scoring) |

Compound containers include `InteractiveBook`, `SlideDeck`, `InteractiveVideo`, and **`BranchingScenario`** (1.5). See **[Coming from H5P?](../h5p-for-lessonkit-authors.md)** and the **[capability map](../../project/h5p-capability-map.md)**.
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
| `AssessmentSequence` | `checkId`, children with `checkId` | Question-set container; aggregates child handles |
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

`Course` accepts `config` for tracking/xAPI and optional `sinks` (same shape as `LessonkitProvider`).

## Common optional props

Full contracts: [Block catalog](../../reference/block-catalog.md) · [Storybook](https://eddiethedean.github.io/lessonkit/storybook/).

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

Browse published stories: **[Storybook on GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/)**.

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
