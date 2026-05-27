# LessonKit

LessonKit is a React-first learning experience development framework for building accessible,
trackable learning experiences with modern frontend tooling.

## Repository layout

```text
lessonkit/
├── packages/
│   ├── core/
│   ├── react/
│   ├── xapi/
│   ├── scorm/           (planned)
│   ├── accessibility/
│   ├── themes/
│   └── cli/
├── examples/
├── docs/
└── templates/
```

## Quick start (workspace)

```bash
npm install
npm run build
```

## Try the example

```bash
npm -w lessonkit-example-react-vite run dev
```

## Spec example (React)

```tsx
import { Course, Lesson, Quiz, Scenario } from "@lessonkit/react";

export default function SecurityTraining() {
  return (
    <Course title="Cybersecurity Basics" courseId="cyber-basics">
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

## Packages

- `@lessonkit/core` (0.1.0): shared types + telemetry primitives
- `@lessonkit/react` (0.1.0): React components + hooks (MVP)
- `@lessonkit/xapi` (0.1.0): xAPI statement generation (MVP)
- `@lessonkit/accessibility` (0.1.0): accessibility helpers (stub)
- `@lessonkit/themes` (0.1.0): theming primitives (stub)
- `@lessonkit/cli` (0.1.0): `lessonkit` commands (stub)

