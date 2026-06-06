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
| `Scenario` | Scenario / narrative block |
| `Reflection` | Open response (manual scoring) |

More types (`BranchingScenario`, …) are on the roadmap. See **[Coming from H5P?](../h5p-for-lessonkit-authors.md)** and the **[capability map](../../project/h5p-capability-map.md)**.
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
| `FillInTheBlanks` | `checkId`, `question`, `blanks[]` | Inline inputs; `interactionType: fillInBlanks` |
| `DragTheWords` | `checkId`, `question`, `zones[]`, `pool[]` | Inline drag targets |
| `DragAndDrop` | `checkId`, `question`, `items[]`, `targets[]` | Drag items to targets; keyboard alternative |
| `MarkTheWords` | `checkId`, `question`, `tokens[]` | Select correct word tokens |
| `AssessmentSequence` | `checkId`, children with `checkId` | Question-set container; aggregates child handles |
| `SlideDeck` | `blockId`, `title`, `Slide` children | Course Presentation; keyboard slide nav; `CompoundHandle` |
| `Slide` | `blockId`, optional `title` | Single slide row inside `SlideDeck` |
| `InteractiveVideo` | `blockId`, `title`, `src`, `TimedCue` children | Interactive Video; pause on cue; `CompoundHandle` |
| `TimedCue` | `atSeconds`, optional `label`, `mustComplete?` | Single timed overlay child inside `InteractiveVideo` |
| `Video` | `blockId`, `src`, optional `poster`, `captions` | Self-hosted video primitive |
| `Summary` | `checkId`, `statements[]`, `correct[]` | Statement-bank construct task |
| `InteractiveBook` | `blockId`, `title`, `Page` children | Multi-chapter book; `CompoundHandle` |
| `Page` | `blockId`, optional `title` | Column/chapter inside `InteractiveBook` |
| `Reflection` | optional `prompt`, `blockId` | Textarea reflection block |
| `ProgressTracker` | — | Shows completed lesson count |

`Course` accepts `config` for tracking/xAPI and optional `sinks` (same shape as `LessonkitProvider`).

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
