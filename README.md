# LessonKit

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](LICENSE)

[![npm](https://img.shields.io/npm/v/@lessonkit/react.svg?label=@lessonkit/react)](https://www.npmjs.com/package/@lessonkit/react)
[![npm](https://img.shields.io/npm/v/@lessonkit/core.svg?label=@lessonkit/core)](https://www.npmjs.com/package/@lessonkit/core)
[![npm](https://img.shields.io/npm/v/@lessonkit/xapi.svg?label=@lessonkit/xapi)](https://www.npmjs.com/package/@lessonkit/xapi)
[![npm](https://img.shields.io/npm/v/@lessonkit/cli.svg?label=@lessonkit/cli)](https://www.npmjs.com/package/@lessonkit/cli)
[![npm](https://img.shields.io/npm/v/@lessonkit/accessibility.svg?label=@lessonkit/accessibility)](https://www.npmjs.com/package/@lessonkit/accessibility)
[![npm](https://img.shields.io/npm/v/@lessonkit/themes.svg?label=@lessonkit/themes)](https://www.npmjs.com/package/@lessonkit/themes)

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

- [`CHANGELOG.md`](CHANGELOG.md): release history
- [`RELEASING.md`](RELEASING.md): how to publish `@lessonkit/*` to npm
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md): keyboard and screen reader standards
- [`PLAN.md`](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md): product vision and MVP scope
- [`SPEC.md`](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md): technical spec and requirements
- [`ROADMAP.md`](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md): phased delivery plan
- [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](https://github.com/eddiethedean/lessonkit/blob/main/docs/LXPACK_UPGRADES_FOR_LESSONKIT.md): proposed LXPack improvements for interoperability

## Example (React)

```tsx
import type { TelemetryEvent } from "@lessonkit/core";
import { Course, Lesson, Quiz, Scenario } from "@lessonkit/react";
import { createXAPIClient } from "@lessonkit/xapi";

export default function SecurityTraining() {
  return (
    <Course
      title="Cybersecurity Basics"
      courseId="cyber-basics"
      config={{
        tracking: {
          sink: (event: TelemetryEvent) => {
            console.log("[telemetry]", event);
          },
        },
        xapi: {
          client: createXAPIClient({
            transport: (statement) => {
              console.log("[xapi]", statement);
            },
          }),
        },
      }}
    >
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

Current monorepo release: **0.3.1** (see [CHANGELOG.md](CHANGELOG.md)).

LessonKit follows semver. The **0.x** series is expected to evolve quickly; breaking changes may
still happen between minor releases.

