# LessonKit

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)
[![npm org](https://img.shields.io/npm/v/@lessonkit/react?label=%40lessonkit%2Freact)](https://www.npmjs.com/org/lessonkit)

**LessonKit** is a React-first framework for building accessible, trackable learning experiences—and shipping them to the LMS. Author courses as components, wire telemetry and xAPI, theme with design tokens, and export **SCORM**, **standalone**, **xAPI**, or **cmi5** packages from the same codebase.

LessonKit solves: *"We want custom React learning UX with LMS completion and xAPI—not another WYSIWYG authoring tool."*

Developer tooling, not a timeline authoring tool: **React + telemetry + packaging**, not Storyline-in-a-box.

> **Building a course?** You do not need to clone this repo. Run `npx @lessonkit/cli init my-course` and follow the [5-minute getting started guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html). Clone only if you are [contributing](CONTRIBUTING.md) or running [examples](examples/README.md).

| | |
| --- | --- |
| **Release** | [1.6.0](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md#160---2026-06-07) |
| **npm** | [`@lessonkit/*`](https://www.npmjs.com/org/lessonkit) |
| **Docs** | [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/) |
| **Node.js** | **18+** minimum; **20.19+** recommended (CLI scaffold uses Vite 8; monorepo CI and e2e use Node 20) |

---

## Choose your path

| Path | Start here |
| --- | --- |
| **Not sure?** | [Start here](https://lessonkit.readthedocs.io/en/latest/guides/start-here.html) on Read the Docs |
| **New course (CLI)** | `npx @lessonkit/cli init` → [5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) · [First LMS export](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/first-lms-export.html) |
| **AI-assisted authoring** | [Vibe coding](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) · [Library Skills](https://lessonkit.readthedocs.io/en/latest/guides/library-skills.html) |
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

Core building blocks for courses, assessments, compound layouts (books, decks, video, branching), telemetry, xAPI, theming, and LMS export via the CLI.

| Area | Examples |
| --- | --- |
| **Structure** | `Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `ProgressTracker` |
| **Compound** | `InteractiveBook`, `SlideDeck`, `InteractiveVideo`, `BranchingScenario`, `AssessmentSequence` |
| **Assessments** | `TrueFalse`, `FillInTheBlanks`, `DragAndDrop`, `Summary`, and more |
| **Delivery** | SCORM 1.2/2004, standalone, xAPI, cmi5 from one Vite app |

Full component list with props and H5P mappings: [block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html) · [components & hooks](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html). Tier labels (A/B/C/D) in the catalog map to [H5P capability priorities](https://lessonkit.readthedocs.io/en/latest/project/h5p-capability-map.html). H5P is a **pattern reference only**—LessonKit does not import `.h5p` packages or integrate with H5P Hub.

- **Identity v1** — Required `courseId`, `lessonId`, and `checkId`; stable URNs for telemetry and xAPI
- **Telemetry & xAPI** — Session-aware events, batching, pluggable sinks; statement mapping via `@lessonkit/xapi`
- **Theming** — `ThemeProvider`, presets, and `--lk-*` CSS design tokens
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

Open the URL Vite prints. Follow the [5-minute getting started guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) to edit your first quiz.

When you are ready to export to an LMS, continue with [First LMS export](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/first-lms-export.html).

(`init` runs `npm install` by default.) Use `npx lessonkit dev` or a global CLI (`npm install -g @lessonkit/cli`) if you prefer.

Each project includes [`lessonkit.json`](https://lessonkit.readthedocs.io/en/latest/reference/manifest.html) (`schemaVersion: 1`) that ties React props to the LXPack course descriptor.

### Existing React app

```bash
npm install @lessonkit/react react react-dom
npm install -D @lessonkit/cli @lessonkit/xapi
```

You need `@lessonkit/cli` to run `lessonkit build` and `lessonkit package`. See the [quickstart for existing Vite apps](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html#add-to-an-existing-vite-react-app).

Optional: `@lessonkit/themes`, `@lessonkit/accessibility`, `@lessonkit/core` (headless APIs).

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
import {
  Course,
  Lesson,
  Quiz,
  Scenario,
  ProgressTracker,
  ThemeProvider,
} from "@lessonkit/react";

export default function SecurityTraining() {
  // Disable telemetry for this minimal example. For dev/prod wiring, use the CLI
  // template `src/courseConfig.ts` or the [quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html).
  const config = useMemo(
    () => ({ tracking: { enabled: false }, xapi: { enabled: false } }),
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

See the [Upgrade guide](https://lessonkit.readthedocs.io/en/latest/guides/upgrading-lessonkit.html) for migration guides by version.

---

## Packages

Index: [packages/README.md](packages/README.md)

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
npm ci
npm run build:packages
npm test
```

Full contributor setup (Playwright, scoped loops, CI checklist): [CONTRIBUTING.md](CONTRIBUTING.md). Most PRs do **not** need the full monorepo build. Use scoped loops from CONTRIBUTING:

| Change type | Usually enough |
| --- | --- |
| `docs/` only | See [CONTRIBUTING.md](CONTRIBUTING.md) — docs build requires `docs:api`, include verification, and block-props generation before Sphinx |
| Single package | `npm run build -w @lessonkit/react` then `npm test -w @lessonkit/react` |
| Examples after API change | `npm run build:packages` then `npm -w lessonkit-example-react-vite run dev` |
| Release / wide refactor | `npm run build` (all packages + examples) |

| Script | Purpose |
| --- | --- |
| `npm run build:packages` | Build `@lessonkit/*` workspaces only |
| `npm run build` | Full build (packages + all example apps) |
| `npm test` / `npm run coverage` | Unit tests (`pretest` runs `build:packages`) |
| `npm run lint` / `npm run typecheck` | Quality gates |
| `npm run test:integration` | CLI init → build → package |
| `npm run test:e2e` | Playwright export parity (Node 20+) |
| `npm run storybook` | Component gallery |

Run an example (after `npm run build:packages`): `npm -w lessonkit-example-react-vite run dev` — see [examples/README.md](examples/README.md) for the tiered “start here” table.

Package index: [packages/README.md](packages/README.md)

Contributors: [CONTRIBUTING.md](CONTRIBUTING.md) · [monorepo guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/contributing-to-the-monorepo.html) · [Architecture & design docs](ARCHITECTURE.md) · [RELEASING.md](RELEASING.md) · [ROADMAP.md](ROADMAP.md)

---

## License

[Apache-2.0](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE) — Copyright (c) LessonKit contributors.
