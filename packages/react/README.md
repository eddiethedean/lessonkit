# `@lessonkit/react`

React components and hooks for building learning experiences in LessonKit.

## Install

```bash
npm install @lessonkit/react react react-dom
```

## Quick example

```tsx
import { Course, Lesson, Quiz, Scenario, ProgressTracker } from "@lessonkit/react";

export default function App() {
  return (
    <Course title="Cybersecurity Basics" courseId="cyber-basics">
      <ProgressTracker />

      <Lesson title="Phishing Awareness" lessonId="phishing-101">
        <Scenario>
          <p>You receive a suspicious email.</p>
        </Scenario>

        <Quiz
          question="What should you do first?"
          choices={["Open attachment", "Verify sender"]}
          answer="Verify sender"
        />
      </Lesson>
    </Course>
  );
}
```

## API (0.1.x)

### Components

- `Course`
- `Lesson`
- `Scenario`
- `Quiz`
- `Reflection`
- `KnowledgeCheck`
- `ProgressTracker`

### Hooks

- `useProgress`
- `useTracking`
- `useQuizState`
- `useCompletion`

## Notes

- `@lessonkit/react` ships **framework primitives**, not content. You bring your own layout/content
  and compose interactions as React components.

