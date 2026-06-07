# LessonKit Technical Specification

> **Maintainer note (framework 1.5.x):** This file is a **historical design spec**. For current shipped API, use [Read the Docs](https://lessonkit.readthedocs.io/en/latest/reference/) — especially [block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html), [CLI](https://lessonkit.readthedocs.io/en/latest/reference/cli.html), and [architecture overview](https://lessonkit.readthedocs.io/en/latest/guides/architecture-overview.html). Execution status: [ROADMAP.md](ROADMAP.md) · [CHANGELOG.md](CHANGELOG.md).

## Monorepo Structure

```text
lessonkit/
├── packages/          # @lessonkit/* (core, react, xapi, accessibility, themes, cli, lxpack)
├── examples/          # Runnable demo courses (11 workspaces)
├── templates/         # vite-react mirror for monorepo dev
├── e2e/               # Playwright export parity + LXPack conformance
├── integration/       # CLI init → build → package smoke tests
├── docs/              # Sphinx site (lessonkit.readthedocs.io)
└── library-skills/    # Agent skills for AI-assisted authoring
```

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite

## Documentation

- Storybook (`@lessonkit/react`)
- [Read the Docs](https://lessonkit.readthedocs.io/) (Sphinx; source in `docs/`)

## Testing

- Vitest
- React Testing Library
- Playwright

## Packaging

- tsup
- npm workspaces
- Changesets
- LXPack (for SCORM/xAPI/cmi5/standalone packaging via adapter)

---

# Core Component API

## Example

```tsx
import {
  Course,
  Lesson,
  Quiz,
  Scenario,
} from "@lessonkit/react";

export default function SecurityTraining() {
  return (
    <Course title="Cybersecurity Basics" courseId="cyber-basics">
      <Lesson title="Phishing Awareness" lessonId="phishing-101">
        <Scenario>
          <p>You receive a suspicious email.</p>
        </Scenario>

        <Quiz
          checkId="first-step"
          question="What should you do first?"
          choices={[
            "Open attachment",
            "Verify sender"
          ]}
          answer="Verify sender"
        />
      </Lesson>
    </Course>
  );
}
```

Identity rules (`courseId`, `lessonId`, `checkId`, URNs): [`docs/IDENTITY.md`](docs/IDENTITY.md).

---

# Assessment contract (framework 1.1.x — **shipped**)

**Status:** Shipped in framework **1.1.0+** and expanded through **1.5.x**. See [block catalog](docs/reference/block-catalog.md) and [H5P capability map](docs/project/h5p-capability-map.md) for current coverage.

Aligns with H5P's [question type contract](https://h5p.org/documentation/developers/contracts) but is implemented in React, not `H5P.Question`. H5P platform interop (`.h5p` import, Hub, `semantics.json`) is out of scope—see [H5P capability map](docs/project/h5p-capability-map.md).

## Scored blocks

All assessment components require `checkId` and sync with `lessonkit.json` `assessments[]` (same as `Quiz` today).

## Runtime interface (shipped)

Parent containers (`AssessmentSequence`, `SlideDeck`, `InteractiveVideo`, `BranchingScenario`, `TimedCue`) expose `CompoundHandle`:

| Method | Purpose |
| --- | --- |
| `getScore()` / `getMaxScore()` | Aggregate scoring |
| `getAnswerGiven()` | Whether the learner may submit or advance |
| `resetTask()` | Clear attempt for retry |
| `showSolutions()` | Reveal correct answers when enabled |
| `getXAPIData()` | Statement payload for `@lessonkit/xapi` |

Behaviour props (aligned with H5P): `enableRetry`, `enableSolutionsButton`, optional `autoCheck`.

## Framework 1.1.x P0 components

| Component | H5P analog |
| --- | --- |
| `TrueFalse` | True/False |
| `FillInTheBlanks` | Fill in the Blanks |
| `DragAndDrop` | Drag and Drop |
| `DragTheWords` | Drag the Words |
| `MarkTheWords` | Mark the Words |
| `AssessmentSequence` | Question Set |

`Quiz` / `KnowledgeCheck` remain the reference MCQ implementation. Default catalog: `blockCatalogVersion = 3` (`block-catalog.v3.json`).

## Requirements

- WCAG 2.1 AA for every interaction mode (including keyboard alternatives to drag-and-drop).
- Telemetry catalog v2 entries for each new interaction type.
- Export parity: standalone + SCORM + xAPI for golden-path courses using P0 blocks.
- Machine-readable catalog: `block-catalog.v2.json` must list contract fields per block.
- **H5P documentation:** each new block completes the [H5P documentation checklist](ROADMAP.md#h5p-documentation-checklist-per-block) (capability map, block catalog, authors guide, Storybook H5P subtitle).

---

# Accessibility Requirements

## WCAG Support

- WCAG 2.1 AA target

## Required Features

- Keyboard navigation
- Semantic HTML
- ARIA support
- Screen reader compatibility
- Focus management
- Reduced motion support

---

# Analytics System

## Tracking Goals

- Course completion
- Quiz scoring
- Interaction telemetry
- Time-on-task
- Branching analytics

---

# xAPI Integration

## Features

- xAPI statement generation
- LRS support
- Session tracking
- Offline queueing

## Example

Telemetry and xAPI share one path via `LessonkitProvider` and `track()`:

```tsx
import { LessonkitProvider } from "@lessonkit/react";
import type { XAPIStatement } from "@lessonkit/xapi";

<LessonkitProvider
  config={{
    courseId: "cyber-basics",
    xapi: {
      transport: (statement: XAPIStatement) => {
        // send to your LRS
      },
    },
  }}
>
  {/* Course / Lesson children */}
</LessonkitProvider>
```

Canonical mapping: `telemetryEventToXAPIStatement()` from `@lessonkit/xapi` (see [`docs/TELEMETRY.md`](docs/TELEMETRY.md)).

---

# SCORM Support

## Shipped formats (via `@lessonkit/lxpack`)

- SCORM 1.2
- SCORM 2004
- xAPI, cmi5, standalone

Default SCORM 1.2 artifact (project root): **`.lxpack/course/.lxpack/out/course-scorm12.zip`**. See [packaging reference](docs/reference/packaging.md).

## Features

- packaged via LXPack (preferred) through `@lessonkit/lxpack`
- bookmarking
- suspend/resume
- score reporting

---

# Theme System

## Goals

- Organizational branding
- Custom layouts
- Shared design systems
- Reusable internal themes

---

# Plugin Architecture

**Shipped:** telemetry, assessment, lifecycle, and analytics plugins via `defineTelemetryPlugin` and related helpers. See [plugins reference](docs/reference/plugins.md).

## Extension areas (ongoing)

- AI integrations
- LMS connectors
- Analytics providers
- Assessment engines
- Custom interactions

---

# CLI Roadmap

```bash
lessonkit init
lessonkit dev
lessonkit build
lessonkit package --target scorm12
lessonkit publish
```

---

# Generator-friendly authoring (AI/dev)

LessonKit should be straightforward for software developers and safe for AI code generators to emit.

Key requirements:

- **Stable contracts**: component/hook APIs are documented and versioned.
- **Deterministic identities**: stable `courseId` / `lessonId` / assessment ids (no hidden randomness) so regeneration yields minimal diffs.
- **Machine-readable block catalog**: the set of supported runtime primitives is exportable as JSON so generators can validate inputs and avoid unsupported combinations.
- **Dual export parity**: React/Vite and LXPack-packaged artifacts match behavior and theming for the same course.

---

# Suggested npm Structure

- lessonkit
- @lessonkit/core
- @lessonkit/react
- @lessonkit/xapi
- @lessonkit/lxpack
- @lessonkit/cli

---

# MVP Recommendation

Initial release should focus on:
- React components
- Accessibility
- xAPI support
- Developer experience
- Documentation
- Vite starter templates

