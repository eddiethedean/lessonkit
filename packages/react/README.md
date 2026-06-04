# @lessonkit/react

[![npm](https://img.shields.io/npm/v/@lessonkit/react.svg)](https://www.npmjs.com/package/@lessonkit/react)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

React components and hooks for authoring LessonKit courses.

## Install

```bash
npm install @lessonkit/react react react-dom
```

Optional: `@lessonkit/xapi`, `@lessonkit/themes`, `@lessonkit/accessibility`

## Usage

`Course` wraps `LessonkitProvider`—pass `config` on `Course` unless you need a custom provider tree.

```tsx
import { useMemo } from "react";
import { Course, Lesson, Quiz, ProgressTracker, ThemeProvider } from "@lessonkit/react";

export default function App() {
  const config = useMemo(() => ({ tracking: { sink: console.log } }), []);

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

## API

**Structure:** `Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`, `ThemeProvider`, `LessonkitProvider`

**Compound:** `Page`, `InteractiveBook`, `AssessmentSequence` — types: `CompoundHandle`, `CompoundResumeState`, `CompoundBaseProps`

**Content:** `Text`, `Heading`, `Image`

**Assessments:** `TrueFalse`, `MarkTheWords`, `FillInTheBlanks`, `DragTheWords`, `DragAndDrop`, `FindHotspot`, `FindMultipleHotspots`

**Presentation:** `Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider`

**Hooks:** `useProgress`, `useTracking`, `useQuizState`, `useAssessmentState`, `useCompletion`, `useLessonkit`, `useTheme`

**Runtime (re-exported from `@lessonkit/core`):** `createLessonkitRuntime`, `buildTelemetryEvent`, `createPluginRegistry`, `defineAssessmentPlugin`, `defineLifecyclePlugin`, `defineTelemetryPlugin` — use `@lessonkit/core` directly for headless runtimes.

**Catalog:** `buildBlockCatalog()` defaults to **v3** in 1.2.0 (`{ version: 2 }` for the 1.1.x shape). JSON: `@lessonkit/react/block-catalog.v1.json`, `.v2.json`, `.v3.json` — `getBlockCatalogEntry()`, `BLOCK_CATALOG_V3`, etc.

## Tips

- Hoist `config` with `useMemo` so tracking/xAPI clients are not recreated every render.
- xAPI is on by default; provide `xapi.transport` or statements queue in memory.
- Lessons complete on unmount or when another lesson becomes active via `setActiveLesson`.
- Compound resume: use a unique `blockId` when `persistCompoundState` is enabled; see [SECURITY.md](https://github.com/eddiethedean/lessonkit/blob/main/SECURITY.md) for shared-device guidance.

## Docs

[Components & hooks](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html) · [5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) · [Block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html) · [Theming](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) · [Storybook](https://eddiethedean.github.io/lessonkit/storybook/) · [API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0
