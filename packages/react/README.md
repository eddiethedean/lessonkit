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
import { Course, Lesson, Quiz, Scenario, ProgressTracker, ThemeProvider } from "@lessonkit/react";
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
    <ThemeProvider mode="light">
    <Course title="Cybersecurity Basics" courseId="cyber-basics" config={config}>
      <ProgressTracker />

      <Lesson title="Phishing Awareness" lessonId="phishing-101">
        <Scenario>
          <p>You receive a suspicious email.</p>
        </Scenario>

        <Quiz
          checkId="first-step"
          question="What should you do first?"
          choices={["Open attachment", "Verify sender"]}
          answer="Verify sender"
        />
      </Lesson>
    </Course>
    </ThemeProvider>
  );
}
```

## API (0.5.0)

### Components

- `Course` — requires `courseId`
- `Lesson` — requires `lessonId`
- `Scenario` — optional `blockId`
- `Quiz` / `KnowledgeCheck` — require `checkId`
- `Reflection` — optional `blockId`
- `ProgressTracker`

### Hooks

- `useProgress`
- `useTracking`
- `useQuizState`
- `useCompletion`
- `useTheme`

### Theming

- `ThemeProvider` — injects `--lk-*` CSS variables (see [`docs/THEMING.md`](../../docs/THEMING.md))
- Props: `preset`, `mode` (`light` | `dark` | `system`), `theme` (partial override), `target` (`document` | `element`)

## Notes

- `@lessonkit/react` ships **framework primitives**, not content. You bring your own layout/content
  and compose interactions as React components.
- `Course` accepts a `config` prop that is passed through to `LessonkitProvider` (tracking sink,
  optional `xapi.transport` or custom `xapi.client`, session metadata). Hoist `config` with `useMemo`
  so tracking/xAPI clients are not recreated every render.
- A lesson is marked complete when its `<Lesson>` unmounts (for example, wizard navigation) or when
  another lesson becomes active via `setActiveLesson`. Use stable `lessonId` values so completion and
  time-on-task telemetry stay consistent.
- `<Lesson>` defers completion on unmount so React Strict Mode remounts in development do not emit
  spurious `lesson_completed` events; completion runs after the component leaves the tree.
- If you omit `session.sessionId`, the provider reuses a tab-scoped id via `sessionStorage` so React
  Strict Mode remounts do not split analytics sessions in development.
- In development, invalid `courseId` / `lessonId` / `checkId` values log a one-time `console.warn`.
- Accessibility guidance lives in [`docs/ACCESSIBILITY.md`](../../docs/ACCESSIBILITY.md).
- Theming and token catalog: [`docs/THEMING.md`](../../docs/THEMING.md).
- Identity and telemetry: [`docs/IDENTITY.md`](../../docs/IDENTITY.md), [`docs/TELEMETRY.md`](../../docs/TELEMETRY.md).

