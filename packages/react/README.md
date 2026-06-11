# @lessonkit/react

[![npm](https://img.shields.io/npm/v/@lessonkit/react.svg)](https://www.npmjs.com/package/@lessonkit/react)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

React components and hooks for authoring LessonKit courses.

## Install

```bash
npm install @lessonkit/react react react-dom
```

Optional: `@lessonkit/xapi`, `@lessonkit/themes`, `@lessonkit/accessibility`, `@lessonkit/cli` (devDependency for packaging)

**Touch / mobile:** Import `@lessonkit/themes/base.css` in your app for 44px touch targets, quiz choice rows, compound navigation, and drag pick-and-place hints. See [Touch and mobile](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/touch-and-mobile.html).

## Usage

`Course` wraps `LessonkitProvider`—pass `config` on `Course` unless you need a custom provider tree.

```tsx
import { useMemo } from "react";
import { Course, Lesson, Quiz, ProgressTracker, ThemeProvider } from "@lessonkit/react";

export default function App() {
  const config = useMemo(
    () => ({ tracking: { enabled: false }, xapi: { enabled: false } }),
    [],
  );

  return (
    <ThemeProvider mode="light">
      <Course title="My Course" courseId="my-course" config={config}>
        <ProgressTracker />
        <Lesson title="Lesson 1" lessonId="lesson-1">
          <Quiz
            checkId="check-1"
            question="Ready?"
            choices={["No", "Yes"]}
            answer="Yes"
          />
        </Lesson>
      </Course>
    </ThemeProvider>
  );
}
```

For telemetry and xAPI in dev and production, use `npx @lessonkit/cli init` (includes `src/courseConfig.ts`) or follow the [quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html). Before LMS upload, complete [LMS Go-Live](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/lms-go-live.html)—production builds reject console-only sinks unless you wire real transports.

## API

**Structure:** `Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`, `ThemeProvider`, `LessonkitProvider`

**Compound:** `Page`, `InteractiveBook`, `Slide`, `SlideDeck`, `InteractiveVideo`, `TimedCue`, `BranchingScenario`, `BranchNode`, `BranchChoice`, `AssessmentSequence` — types: `CompoundHandle`, `CompoundResumeState`, `CompoundBaseProps`

**Content:** `Text`, `Heading`, `Image`, `Video`

**Assessments:** `TrueFalse`, `MarkTheWords`, `FillInTheBlanks`, `DragTheWords`, `DragAndDrop`, `FindHotspot`, `FindMultipleHotspots`, `Summary`, `ImagePairing`, `ImageSequencing`, `ArithmeticQuiz`, `Essay`

**Presentation:** `Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider`, `MemoryGame`, `InformationWall`, `ParallaxSlideshow`, `Questionnaire`, `Embed`, `Chart`

**Tree-shake friendly blocks:** `import { Quiz } from "@lessonkit/react/blocks"`

**Hooks:** `useProgress`, `useTracking`, `useQuizState`, `useAssessmentState`, `useCompletion`, `useLessonkit`, `useTheme`, `useBranchingScenario`

**Runtime (re-exported from `@lessonkit/core`):** `createLessonkitRuntime`, `buildTelemetryEvent`, `createPluginRegistry`, `defineAssessmentPlugin`, `defineLifecyclePlugin`, `defineTelemetryPlugin` — use `@lessonkit/core` directly for headless runtimes.

**Catalog:** `buildBlockCatalog()` defaults to **v3** in 1.2.0+. JSON: `@lessonkit/react/block-catalog.v3.json` — `getBlockCatalogEntry()`, `BLOCK_CATALOG_V3`, etc.

## Tips

- Hoist `config` with `useMemo` so tracking/xAPI clients are not recreated every render.
- Tracking is enabled by default when `config.tracking` is omitted—provide a sink or set `tracking: { enabled: false }`.
- xAPI is on by default; provide `xapi.transport` or set `xapi: { enabled: false }`.
- Lessons complete on unmount or when another lesson becomes active via `setActiveLesson`.
- Compound resume: use a unique `blockId` when `persistCompoundState` is enabled; see [SECURITY.md](https://github.com/eddiethedean/lessonkit/blob/main/SECURITY.md) for shared-device guidance.

## Docs

[Components & hooks](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html) · [5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) · [LMS Go-Live](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/lms-go-live.html) · [Block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html) · [API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0
