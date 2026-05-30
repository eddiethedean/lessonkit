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

**Components:** `Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`, `ThemeProvider`

**Hooks:** `useProgress`, `useTracking`, `useQuizState`, `useCompletion`, `useTheme`

**Catalog:** `@lessonkit/react/block-catalog.v1.json` · `buildBlockCatalog()`, `getBlockCatalogEntry()`

## Tips

- Hoist `config` with `useMemo` so tracking/xAPI clients are not recreated every render.
- xAPI is on by default; provide `xapi.transport` or statements queue in memory.
- Lessons complete on unmount or when another lesson becomes active via `setActiveLesson`.

## Docs

[Components & hooks](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html) · [Block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html) · [Theming](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) · [Storybook](https://github.com/eddiethedean/lessonkit/blob/main/docs/storybook/README.md) (`npm run storybook` from repo root)

## License

Apache-2.0
