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
import { useMemo } from "react";
import type { TelemetryEvent } from "@lessonkit/core";
import { Course, Lesson, Quiz, Scenario, ProgressTracker } from "@lessonkit/react";
import type { XAPIStatement } from "@lessonkit/xapi";

export default function App() {
  const config = useMemo(
    () => ({
      tracking: {
        sink: (event: TelemetryEvent) => console.log(event),
      },
      xapi: {
        transport: (statement: XAPIStatement) => console.log(statement),
      },
    }),
    [],
  );

  return (
    <Course title="Cybersecurity Basics" courseId="cyber-basics" config={config}>
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

## API (0.2.1)

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
  optional `xapi.transport` or custom `xapi.client`, session metadata). Hoist `config` with `useMemo`
  so tracking/xAPI clients are not recreated every render.
- When a `<Lesson>` unmounts (for example, wizard navigation), it automatically calls `completeLesson`
  for that lesson. Use stable `lessonId` values so completion and time-on-task telemetry stay consistent.
- If you omit `session.sessionId`, the provider reuses a tab-scoped id via `sessionStorage` so React
  Strict Mode remounts do not split analytics sessions in development.

