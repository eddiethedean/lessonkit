# LessonKit

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](LICENSE)

[![npm](https://img.shields.io/npm/v/@lessonkit/react.svg?label=@lessonkit/react)](https://www.npmjs.com/package/@lessonkit/react)
[![npm](https://img.shields.io/npm/v/@lessonkit/core.svg?label=@lessonkit/core)](https://www.npmjs.com/package/@lessonkit/core)
[![npm](https://img.shields.io/npm/v/@lessonkit/xapi.svg?label=@lessonkit/xapi)](https://www.npmjs.com/package/@lessonkit/xapi)
[![npm](https://img.shields.io/npm/v/@lessonkit/lxpack.svg?label=@lessonkit/lxpack)](https://www.npmjs.com/package/@lessonkit/lxpack)
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
│   ├── accessibility/
│   ├── themes/
│   ├── lxpack/          (SCORM / xAPI / cmi5 / standalone export)
│   └── cli/
├── examples/
├── docs/
└── templates/
```

## Quick start

```bash
npx @lessonkit/cli init my-course
cd my-course
lessonkit dev
```

Or work from the monorepo:

```bash
npm install
npm run build
```

## Try the example

```bash
npm -w lessonkit-example-react-vite run dev
```

Package for LMS delivery (Node 20+):

```bash
lessonkit build
lessonkit package --target scorm12
```

Or from the monorepo golden example:

```bash
npm -w lessonkit-example-lxpack-golden run build
npm -w lessonkit-example-lxpack-golden run package:scorm12
```

## Key docs

- [`docs/CLI.md`](docs/CLI.md): `lessonkit` commands, `lessonkit.json` schema, exit codes
- [`SECURITY.md`](SECURITY.md): reporting vulnerabilities and supported versions
- [`CHANGELOG.md`](CHANGELOG.md): release history
- [`RELEASING.md`](RELEASING.md): how to publish `@lessonkit/*` to npm
- [`docs/THEMING.md`](docs/THEMING.md): design tokens, `--lk-*` CSS variables, and `ThemeProvider`
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md): keyboard and screen reader standards
- [`PLAN.md`](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md): product vision and MVP scope
- [`SPEC.md`](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md): technical spec and requirements
- [`ROADMAP.md`](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md): phased delivery plan
- [`docs/PACKAGING.md`](docs/PACKAGING.md): export React courses to SCORM / standalone via `@lessonkit/lxpack`
- [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](https://github.com/eddiethedean/lessonkit/blob/main/docs/LXPACK_UPGRADES_FOR_LESSONKIT.md): LXPack interoperability checklist

## Example (React)

```tsx
import { useMemo } from "react";
import type { TelemetryEvent } from "@lessonkit/core";
import { Course, Lesson, Quiz, Scenario, ThemeProvider } from "@lessonkit/react";
import type { XAPIStatement } from "@lessonkit/xapi";

export default function SecurityTraining() {
  const config = useMemo(
    () => ({
      tracking: {
        sink: (event: TelemetryEvent) => {
          console.log("[telemetry]", event);
        },
      },
      xapi: {
        transport: (statement: XAPIStatement) => {
          console.log("[xapi]", statement);
        },
      },
    }),
    [],
  );

  return (
    <ThemeProvider mode="light" preset="default">
    <Course
      title="Cybersecurity Basics"
      courseId="cyber-basics"
      config={config}
    >
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

## Packages

- `@lessonkit/react`: authoring primitives (components + hooks)
- `@lessonkit/core`: shared types and telemetry primitives
- `@lessonkit/xapi`: xAPI statement generation and transports
- `@lessonkit/accessibility`: accessibility utilities (growing)
- `@lessonkit/themes`: theming primitives (growing)
- `@lessonkit/lxpack`: LXPack export adapter (SCORM, standalone, xAPI, cmi5)
- `@lessonkit/cli`: `lessonkit init`, `dev`, `build`, `package` (dual export)

## Versioning

Current monorepo release: **0.7.0** (see [CHANGELOG.md](CHANGELOG.md)).

LessonKit follows semver. The **0.x** series is expected to evolve quickly; breaking changes may
still happen between minor releases.

