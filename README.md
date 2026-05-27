# LessonKit

LessonKit is a React-first framework for building accessible, trackable learning experiences with
modern frontend tooling.

## What you get (MVP)

- **Composable React primitives** for courses, lessons, scenarios, and checks
- **Accessibility-first defaults** (semantic structure, keyboard-friendly patterns)
- **Telemetry and xAPI foundations** for analytics and LMS interoperability
- **Developer-friendly workflow** using TypeScript, Vite, and workspace tooling

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

## Quick start

```bash
npm install
npm run build
```

## Try the example

```bash
npm -w lessonkit-example-react-vite run dev
```

## Key docs

- [`PLAN.md`](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md): product vision and MVP scope
- [`SPEC.md`](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md): technical spec and requirements
- [`ROADMAP.md`](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md): phased delivery plan
- [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](https://github.com/eddiethedean/lessonkit/blob/main/docs/LXPACK_UPGRADES_FOR_LESSONKIT.md): proposed LXPack improvements for interoperability

## Example (React)

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

- `@lessonkit/react`: authoring primitives (components + hooks)
- `@lessonkit/core`: shared types and telemetry primitives
- `@lessonkit/xapi`: xAPI statement generation and transports
- `@lessonkit/accessibility`: accessibility utilities (growing)
- `@lessonkit/themes`: theming primitives (growing)
- `@lessonkit/cli`: `lessonkit` commands (stub)

## Versioning

LessonKit follows semver. The **0.x** series is expected to evolve quickly; breaking changes may
still happen between minor releases.

