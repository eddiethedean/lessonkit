# `@lessonkit/react`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml)
[![npm](https://img.shields.io/npm/v/@lessonkit/react.svg)](https://www.npmjs.com/package/@lessonkit/react)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../../LICENSE)

React components and hooks for building learning experiences in LessonKit.

## Install

```bash
npm install @lessonkit/react react react-dom
```

## Quick example

```tsx
import type { TelemetryEvent } from "@lessonkit/core";
import { Course, Lesson, Quiz, Scenario, ProgressTracker } from "@lessonkit/react";
import { createXAPIClient } from "@lessonkit/xapi";

export default function App() {
  return (
    <Course
      title="Cybersecurity Basics"
      courseId="cyber-basics"
      config={{
        tracking: {
          sink: (event: TelemetryEvent) => console.log(event),
        },
        xapi: {
          client: createXAPIClient({
            transport: (statement) => console.log(statement),
          }),
        },
      }}
    >
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

## API (0.2.0)

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
- `Course` accepts a `config` prop that is passed through to `LessonkitProvider` (tracking sink,
  xAPI client, session metadata).

