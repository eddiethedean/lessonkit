# LessonKit

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)
[![npm org](https://img.shields.io/npm/v/@lessonkit/react?label=%40lessonkit%2Freact)](https://www.npmjs.com/org/lessonkit)

**LessonKit** is a React-first framework for building accessible, trackable learning experiences—and shipping them to the LMS. Author courses as components, wire telemetry and xAPI, theme with design tokens, and export **SCORM**, **standalone**, **xAPI**, or **cmi5** packages from the same codebase.

Developer tooling, not a timeline authoring tool: **React + telemetry + packaging**, not Storyline-in-a-box.

> **Building a course?** You do not need to clone this repo. Run `npx @lessonkit/cli init my-course` and follow the [5-minute getting started guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html). Clone only if you are [contributing](CONTRIBUTING.md) or running [examples](examples/README.md).

| | |
| --- | --- |
| **Release** | [1.4.0](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md#140---2026-06-05) |
| **npm** | [`@lessonkit/*`](https://www.npmjs.com/org/lessonkit) |
| **Docs** | [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/) |
| **Node.js** | 18+ (dev, build, LMS packaging); **20+** for Playwright e2e when [contributing](CONTRIBUTING.md) |

---

## Choose your path

| Path | Start here |
| --- | --- |
| **New course (CLI)** | `npx @lessonkit/cli init` → [5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) · [Quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html#cli-scaffold) |
| **Existing React app** | `npm install @lessonkit/react` (+ CLI as devDep) → [Quickstart — add to Vite](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html#add-to-an-existing-vite-react-app) |
| **Contribute** | Clone this repo → [Contributing](CONTRIBUTING.md) |

**Live demos:** [Examples on Read the Docs](https://lessonkit.readthedocs.io/en/latest/examples/index.html) · **Block catalogs:** [1.1](examples/framework-11-showcase) · [1.2](examples/framework-12-showcase)

---

## Table of contents

- [Choose your path](#choose-your-path)
- [Why LessonKit](#why-lessonkit)
- [Which packages do I need?](#which-packages-do-i-need)
- [Features](#features)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Example](#example)
- [Upgrading from an older version](#upgrading-from-an-older-version)
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

---

## Features

- **Structure** — `Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`, `LessonkitProvider`; hooks for progress, tracking, and completion
- **Compound & resume** — `Page`, `InteractiveBook`, `Slide`, `SlideDeck`, `InteractiveVideo`, `TimedCue`, `AssessmentSequence` (`CompoundHandle`, session resume)
- **Content** — `Text`, `Heading`, `Image`, `Video`
- **Assessments (P0 + 1.4)** — `TrueFalse`, `MarkTheWords`, `FillInTheBlanks`, `DragTheWords`, `DragAndDrop`, `FindHotspot`, `FindMultipleHotspots`, `Summary`, `ImagePairing`, `ImageSequencing`, `ArithmeticQuiz`, `Essay`
- **Presentation (Tier C/D)** — `Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider`, `MemoryGame`, `InformationWall`, `ParallaxSlideshow`, `Questionnaire`
- **Identity v1** — Required `courseId`, `lessonId`, and `checkId`; stable URNs for telemetry and xAPI
- **Telemetry** — Session-aware events, optional batching, pluggable pipeline sinks
- **xAPI** — Statement generation, in-memory queueing, and transport hooks via `@lessonkit/xapi`
- **Theming** — `ThemeProvider`, presets, and `--lk-*` CSS design tokens
- **LMS export** — SCORM 1.2/2004, standalone, xAPI, cmi5 from a built Vite app
- **CLI** — Scaffold projects and package with a root `lessonkit.json` manifest
- **Agent skills** — [Library Skills](https://github.com/eddiethedean/lessonkit/tree/main/library-skills) for Cursor, Claude Code, and compatible assistants

---

## Which packages do I need?

| Goal | Install |
| --- | --- |
| Course UI in React | `@lessonkit/react` (pulls in core, themes, xapi, lxpack) |
| Scaffold, dev, build, package | `@lessonkit/cli` as a **devDependency** (or use `npx @lessonkit/cli`) |
| Custom headless runtime / telemetry types | `@lessonkit/core` |
| Custom LRS transport or statement helpers | `@lessonkit/xapi` |
| Custom theme presets | `@lessonkit/themes` |
| Focus utilities in custom UI | `@lessonkit/accessibility` |
| Packaging without the CLI | `@lessonkit/lxpack` (bundles `@lxpack/*` as direct dependencies) |

See the [glossary](https://lessonkit.readthedocs.io/en/latest/reference/glossary.html) for terms like LXPack and `LessonkitProvider`.

---

## Quick start

### New project

```bash
npx @lessonkit/cli init my-course
cd my-course
npm run dev
```

(`init` runs `npm install` by default.) Use `npx lessonkit dev` or a global CLI (`npm install -g @lessonkit/cli`) if you prefer.

Build and package for an LMS:

```bash
npm run build
npm run package:scorm12
# or: npx lessonkit build && npx lessonkit package --target scorm12
```

SCORM zip output path: see [getting started in 5 minutes](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html#package-for-your-lms).

Each project includes [`lessonkit.json`](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) (`schemaVersion: 1`) that ties React props to the LXPack course descriptor.

### Existing React app

```bash
npm install @lessonkit/react react react-dom
```

Optional: `@lessonkit/xapi` (typed helpers), `@lessonkit/themes`, `@lessonkit/accessibility`, `@lessonkit/core` (headless APIs).

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

`Course` wraps `LessonkitProvider` internally—pass `config` on `Course` unless you need a custom provider tree. Keep `courseId`, `lessonId`, and `checkId` in sync with `lessonkit.json`—`lessonkit init` patches the starter template for you. See [identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html), [ID parity](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html#keep-react-ids-in-sync-with-lessonkitjson), and [project structure](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/project-structure.html).

Component gallery: [Storybook on GitHub Pages](https://eddiethedean.github.io/lessonkit/storybook/) (also `npm run storybook` in this repo).

---

## Upgrading from an older version

<details>
<summary>Migration guides (skip if you used <code>npx @lessonkit/cli init</code> recently)</summary>

| From | Guide |
| --- | --- |
| 1.3.x | [MIGRATION-1.3-to-1.4.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/MIGRATION-1.3-to-1.4.md) — `InteractiveVideo`, `Video`, Tier B/C/D blocks |
| 1.2.x | [MIGRATION-1.2-to-1.3.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/MIGRATION-1.2-to-1.3.md) — `SlideDeck`, production transport helpers |
| 1.1.x | [MIGRATION-1.1-to-1.2.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/MIGRATION-1.1-to-1.2.md) — catalog v3 default, compound persistence, `AssessmentSequence` scores |
| 1.0.x | [MIGRATION-1.0-to-1.1.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/MIGRATION-1.0-to-1.1.md) |
| 0.9.x | [MIGRATION-0.x-to-1.0.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/MIGRATION-0.x-to-1.0.md) |

**1.1.x → 1.2.x highlights:** `buildBlockCatalog()` defaults to catalog v3; `persistCompoundState` defaults to `true`; set a unique `blockId` on compound containers.

</details>

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

---

## Documentation

Full site: **[lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)**

| Topic | Link |
| --- | --- |
| CLI & `lessonkit.json` | [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) |
| Components & hooks | [React guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html) · [Storybook](https://eddiethedean.github.io/lessonkit/storybook/) |
| Glossary | [Terms (LXPack, IDs, catalogs)](https://lessonkit.readthedocs.io/en/latest/reference/glossary.html) |
| LMS packaging | [Packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) |
| Identity & URNs | [Identity reference](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) |
| Telemetry & xAPI | [Telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) · [xAPI](https://lessonkit.readthedocs.io/en/latest/reference/xapi.html) · [Production checklist](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/production-checklist.html) |
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

Run an example (after `npm run build:packages`): `npm -w lessonkit-example-react-vite run dev` — see [examples/README.md](examples/README.md)

Contributors: [CONTRIBUTING.md](CONTRIBUTING.md) · [monorepo guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/contributing-to-the-monorepo.html) · [Architecture & design docs](ARCHITECTURE.md) · [RELEASING.md](RELEASING.md) · [ROADMAP.md](ROADMAP.md)

---

## License

[Apache-2.0](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE) — Copyright (c) LessonKit contributors.
