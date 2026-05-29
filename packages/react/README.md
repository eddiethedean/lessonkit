# `@lessonkit/react`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![npm](https://img.shields.io/npm/v/@lessonkit/react.svg)](https://www.npmjs.com/package/@lessonkit/react)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

React components and hooks for building learning experiences in LessonKit.

**Docs:** [Components & hooks](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html) · [Block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html) · [Quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html) · [Theming & accessibility](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/theming-and-accessibility.html)

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

## API (0.8.0)

### Block catalog

- **JSON:** `@lessonkit/react/block-catalog.v1.json`
- **Schema:** `@lessonkit/react/block-contract.v1.json`
- **API:** `buildBlockCatalog()`, `getBlockCatalogEntry(type)`, `BLOCK_CATALOG`, `blockCatalogVersion`
- [Block catalog reference](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html)

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

- `ThemeProvider` — injects `--lk-*` CSS variables ([theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html))
- Props: `preset`, `mode` (`light` | `dark` | `system`), `theme` (partial override), `target` (`document` | `element`)

## Notes

- `@lessonkit/react` ships **framework primitives**, not content. You bring your own layout/content
  and compose interactions as React components.
- `Course` accepts a `config` prop that is passed through to `LessonkitProvider` (tracking sink,
  optional `xapi.transport` or custom `xapi.client`, session metadata). Hoist `config` with `useMemo`
  so tracking/xAPI clients are not recreated every render.
- xAPI is enabled by default unless `xapi.enabled: false`. Provide `xapi.transport` or `xapi.client`
  or statements are queued in memory and never sent (dev warns once).
- A lesson is marked complete when its `<Lesson>` unmounts (for example, wizard navigation) or when
  another lesson becomes active via `setActiveLesson`. Use stable `lessonId` values so completion and
  time-on-task telemetry stay consistent.
- `<Lesson>` defers completion on unmount so React Strict Mode remounts in development do not emit
  spurious `lesson_completed` events; completion runs after the component leaves the tree.
- If you omit `session.sessionId`, the provider reuses a tab-scoped id via `sessionStorage` so React
  Strict Mode remounts do not split analytics sessions in development.
- In development, invalid `courseId` / `lessonId` / `checkId` values log a one-time `console.warn`.
- [Accessibility reference](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) — keyboard and screen-reader guidance.
- [Theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) — token catalog and overrides.
- [Identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) · [Telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) · [Block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html) — IDs, events, and supported blocks.
