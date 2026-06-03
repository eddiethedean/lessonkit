# LessonKit

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)
[![npm org](https://img.shields.io/npm/v/@lessonkit/react?label=%40lessonkit%2Freact)](https://www.npmjs.com/org/lessonkit)

**LessonKit** is a React-first framework for building accessible, trackable learning experiences—and shipping them to the LMS. Author courses as components, wire telemetry and xAPI, theme with design tokens, and export **SCORM**, **standalone**, **xAPI**, or **cmi5** packages from the same codebase.

Developer tooling, not a timeline authoring tool: **React + telemetry + packaging**, not Storyline-in-a-box.

| | |
| --- | --- |
| **Release** | Framework [1.1.0](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md#110---2026-06-03) · Studio [0.3.1](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md#studio-v031---2026-06-03) (tags pending on npm) |
| **npm** | [`@lessonkit/*`](https://www.npmjs.com/org/lessonkit) |
| **Docs** | [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/) |
| **Node.js** | 18+ (dev, build, LMS packaging) |

---

## Table of contents

- [Why LessonKit](#why-lessonkit)
- [Features](#features)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Example](#example)
- [Packages](#packages)
- [Documentation](#documentation)
- [Development](#development)
- [License](#license)

---

## Why LessonKit

| Audience | What you get |
| --- | --- |
| **Frontend / LX developers** | Composable React primitives, TypeScript, Vite, and a CLI (`init`, `dev`, `build`, `package`) |
| **Learning engineering** | Canonical IDs, a versioned telemetry catalog, and xAPI mapping aligned with LMS object URNs |
| **Accessibility** | Semantic structure, focus utilities, reduced-motion helpers, documented WCAG targets |
| **Delivery teams** | Modern SPA via Vite plus LMS artifacts through [`@lessonkit/lxpack`](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) |

Migrating from 0.9.x? See [MIGRATION-0.x-to-1.0.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/MIGRATION-0.x-to-1.0.md). From 1.0.x? See [MIGRATION-1.0-to-1.1.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/MIGRATION-1.0-to-1.1.md).

---

## Features

- **React authoring** — `Course`, `Lesson`, `Scenario`, `Quiz`, `Reflection`, `ProgressTracker`, and hooks for progress, tracking, and completion
- **Identity v1** — Required `courseId`, `lessonId`, and `checkId`; stable URNs for telemetry and xAPI
- **Telemetry** — Session-aware events, optional batching, pluggable pipeline sinks
- **xAPI** — Statement generation, in-memory queueing, and transport hooks via `@lessonkit/xapi`
- **Theming** — `ThemeProvider`, presets, and `--lk-*` CSS design tokens
- **LMS export** — SCORM 1.2/2004, standalone, xAPI, cmi5 from a built Vite app
- **CLI** — Scaffold projects and package with a root `lessonkit.json` manifest
- **Agent skills** — [Library Skills](https://github.com/eddiethedean/lessonkit/tree/main/library-skills) for Cursor, Claude Code, and compatible assistants

---

## Quick start

### New project

```bash
npx @lessonkit/cli init my-course
cd my-course
lessonkit dev
```

Build and package for an LMS:

```bash
lessonkit build
lessonkit package --target scorm12
```

Each project includes [`lessonkit.json`](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) (`schemaVersion: 1`) that ties React props to the LXPack course descriptor.

### Existing React app

```bash
npm install @lessonkit/react @lessonkit/core react react-dom
```

Optional: `@lessonkit/xapi`, `@lessonkit/themes`, `@lessonkit/accessibility`.

### Guides

| Audience | Start here |
| --- | --- |
| React developers | [Quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html) |
| AI-assisted authoring | [Vibe coding](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) |
| Live demos | [Examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html) |

---

## How it works

```text
  Author (React + lessonkit.json)
           │
           ▼
    lessonkit build  ──►  dist/  (Vite SPA)
           │
           ▼
    lessonkit package ──►  SCORM / standalone / xAPI / cmi5
           │
           ▼
         LMS upload
```

At runtime, `@lessonkit/react` emits telemetry and xAPI, and forwards scores to an embedded LXPack bridge when packaged.

---

## Example

```tsx
import { useMemo } from "react";
import type { TelemetryEvent } from "@lessonkit/core";
import {
  Course,
  Lesson,
  Quiz,
  Scenario,
  ProgressTracker,
  ThemeProvider,
} from "@lessonkit/react";
import type { XAPIStatement } from "@lessonkit/xapi";

export default function SecurityTraining() {
  const config = useMemo(
    () => ({
      tracking: {
        sink: (event: TelemetryEvent) => console.log("[telemetry]", event),
      },
      xapi: {
        transport: (statement: XAPIStatement) => console.log("[xapi]", statement),
      },
    }),
    [],
  );

  return (
    <ThemeProvider mode="light" preset="default">
      <Course title="Cybersecurity Basics" courseId="cyber-basics" config={config}>
        <ProgressTracker />

        <Lesson title="Phishing Awareness" lessonId="phishing-101">
          <Scenario>
            <p>You receive a suspicious email asking you to reset your password.</p>
          </Scenario>

          <Quiz
            checkId="verify-sender"
            question="What should you do first?"
            choices={["Open the attachment", "Verify the sender"]}
            answer="Verify the sender"
          />
        </Lesson>
      </Course>
    </ThemeProvider>
  );
}
```

Keep `courseId`, `lessonId`, and `checkId` in sync with `lessonkit.json`—`lessonkit init` patches the starter template for you. See [identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) and [project structure](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/project-structure.html).

---

## Packages

| Package | npm | Description |
| --- | --- | --- |
| [`@lessonkit/react`](https://github.com/eddiethedean/lessonkit/tree/main/packages/react) | [![npm](https://img.shields.io/npm/v/@lessonkit/react.svg)](https://www.npmjs.com/package/@lessonkit/react) | Components, hooks, `ThemeProvider`, runtime provider |
| [`@lessonkit/core`](https://github.com/eddiethedean/lessonkit/tree/main/packages/core) | [![npm](https://img.shields.io/npm/v/@lessonkit/core.svg)](https://www.npmjs.com/package/@lessonkit/core) | Types, identity, telemetry catalog, headless runtime |
| [`@lessonkit/xapi`](https://github.com/eddiethedean/lessonkit/tree/main/packages/xapi) | [![npm](https://img.shields.io/npm/v/@lessonkit/xapi.svg)](https://www.npmjs.com/package/@lessonkit/xapi) | xAPI statements, queueing, telemetry mapping |
| [`@lessonkit/lxpack`](https://github.com/eddiethedean/lessonkit/tree/main/packages/lxpack) | [![npm](https://img.shields.io/npm/v/@lessonkit/lxpack.svg)](https://www.npmjs.com/package/@lessonkit/lxpack) | Course descriptors, validation, LMS packaging |
| [`@lessonkit/cli`](https://github.com/eddiethedean/lessonkit/tree/main/packages/cli) | [![npm](https://img.shields.io/npm/v/@lessonkit/cli.svg)](https://www.npmjs.com/package/@lessonkit/cli) | `lessonkit init`, `dev`, `build`, `package` |
| [`@lessonkit/themes`](https://github.com/eddiethedean/lessonkit/tree/main/packages/themes) | [![npm](https://img.shields.io/npm/v/@lessonkit/themes.svg)](https://www.npmjs.com/package/@lessonkit/themes) | Theme presets and design tokens |
| [`@lessonkit/accessibility`](https://github.com/eddiethedean/lessonkit/tree/main/packages/accessibility) | [![npm](https://img.shields.io/npm/v/@lessonkit/accessibility.svg)](https://www.npmjs.com/package/@lessonkit/accessibility) | Focus trap, roving tabindex, reduced motion |

**LessonKit Studio (Alpha)** (publish with `studio-v*` tags): [`@lessonkit/studio-schema`](packages/studio-schema) · [`@lessonkit/studio-renderer`](packages/studio-renderer) · [`@lessonkit/studio-builder`](packages/studio-builder) · [`@lessonkit/studio-codegen`](packages/studio-codegen) · [`@lessonkit/studio-ui`](packages/studio-ui) · [project format v1](docs/guides/studio/project-format-v1.md) · [visual editor](docs/guides/studio/editor.md) (`apps/studio-web`)

Studio is **Alpha**: expect breaking changes to the editor UI, exported output, and `StudioProjectV1` format between Studio releases. Pin `@lessonkit/studio-*` versions and review the changelog before upgrading.

---

## Documentation

Full site: **[lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)**

| Topic | Link |
| --- | --- |
| CLI & `lessonkit.json` | [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) |
| Components & hooks | [React guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html) |
| LMS packaging | [Packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) |
| Identity & URNs | [Identity reference](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) |
| Telemetry & xAPI | [Telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) · [xAPI](https://lessonkit.readthedocs.io/en/latest/reference/xapi.html) |
| Theming & accessibility | [Theming](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) · [Accessibility](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) |
| Coming from H5P | [H5P → LessonKit guide](https://lessonkit.readthedocs.io/en/latest/guides/h5p-for-lessonkit-authors.html) · [Capability map](https://lessonkit.readthedocs.io/en/latest/project/h5p-capability-map.html) |

Source markdown: [`docs/`](https://github.com/eddiethedean/lessonkit/tree/main/docs) · Changelog: [CHANGELOG.md](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md) · Security: [SECURITY.md](https://github.com/eddiethedean/lessonkit/blob/main/SECURITY.md)

---

## Development

```bash
git clone https://github.com/eddiethedean/lessonkit.git
cd lessonkit
npm install
npm run build
npm test
```

| Script | Purpose |
| --- | --- |
| `npm run build` | Build all packages and example apps |
| `npm test` / `npm run coverage` | Unit tests |
| `npm run lint` / `npm run typecheck` | Quality gates |
| `npm run test:integration` | CLI init → build → package |
| `npm run test:e2e` | Playwright export parity |
| `npm run storybook` | Component gallery |

Run an example: `npm -w lessonkit-example-react-vite run dev`

Contributors: [monorepo guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/contributing-to-the-monorepo.html) · [RELEASING.md](https://github.com/eddiethedean/lessonkit/blob/main/RELEASING.md) · [ROADMAP.md](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md)

---

## License

[Apache-2.0](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE) — Copyright (c) LessonKit contributors.
