# React blocks

Use only block types listed in `@lessonkit/react/block-catalog.v3.json`. `buildBlockCatalog()` defaults to catalog v3 (framework 1.6.x).

## Layout pattern

```tsx
import { Course, Lesson, Quiz, ProgressTracker, ThemeProvider } from "@lessonkit/react";

export default function App() {
  return (
    <ThemeProvider mode="light" preset="default">
      <Course title="Title" courseId="my-course" config={{ /* tracking, xapi */ }}>
        <ProgressTracker />
        <Lesson title="Intro" lessonId="intro">
          <Quiz
            checkId="quiz-1"
            question="…"
            choices={["A", "B"]}
            answer="B"
          />
        </Lesson>
      </Course>
    </ThemeProvider>
  );
}
```

## Shell components

`Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`, `ThemeProvider`

## Assessment blocks (examples)

`TrueFalse`, `MarkTheWords`, `FillInTheBlanks`, `DragTheWords`, `DragAndDrop`, `Summary`, `ImagePairing`, `ImageSequencing`, `ArithmeticQuiz`, `Essay`, `Questionnaire`, `AssessmentSequence`, `ImageHotspots`, `FindHotspot`, `FindMultipleHotspots`

## Compound blocks

`Page`, `InteractiveBook`, `Slide`, `SlideDeck`, `TimedCue`, `InteractiveVideo`, `BranchingScenario`, `BranchNode`, `BranchChoice`

## Content blocks (1.5+)

`Embed`, `Chart`, `Text`, `Heading`, `Image`, `Video`, `Accordion`, `DialogCards`, `Flashcards`, `MemoryGame`, `InformationWall`, `ParallaxSlideshow`, `ImageSlider`

## Hooks

- `useProgress`, `useTracking`, `useQuizState`, `useAssessmentState`, `useCompletion`, `useLessonkit`, `useTheme`, `useBranchingScenario`

## Multiple lessons mounted

- `<Quiz>` and `<KnowledgeCheck>` **must** be inside `<Lesson>` (required for telemetry; throws in dev if missing).
- All `<Lesson>` children may be mounted (tabs, scroll). Quiz events use the **enclosing** lesson’s `lessonId`.
- Only one `<Lesson>` should be active at a time; use `autoCompleteOnUnmount={false}` for routed layouts.

Human reference: https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html  
Block catalog: https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html
