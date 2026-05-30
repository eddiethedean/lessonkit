# React blocks

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

## Hooks

- `useProgress`, `useTracking`, `useQuizState`, `useCompletion`, `useLessonkit`

## Multiple lessons mounted

All `<Lesson>` children may be mounted (tabs, scroll). Quiz events use the **enclosing** lesson’s `lessonId`.

Human reference: https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html
