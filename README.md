# LessonKit

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

**LessonKit** is a React-first framework for building accessible, trackable learning experiences—and shipping them to the LMS. Author courses as components, wire telemetry and xAPI, theme with design tokens, and export SCORM, standalone, xAPI, or cmi5 packages from the same codebase.

**Current release:** [1.0.0](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md) · Published on npm as [`@lessonkit/*`](https://www.npmjs.com/org/lessonkit)

**Documentation:** [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/) — [vibe coding](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) · [React developers](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/index.html) · [live examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html) (contributors: [docs/README.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/README.md) · [Read the Docs setup](https://github.com/eddiethedean/lessonkit/blob/main/docs/READTHEDOCS.md))

---

## Why LessonKit

| For | You get |
| --- | --- |
| **LX / frontend developers** | Composable React primitives, TypeScript, Vite, and a real CLI (`init`, `dev`, `build`, `package`) |
| **Learning engineering** | Canonical IDs, a telemetry catalog, and xAPI mapping aligned with LMS object URNs |
| **Accessibility** | Semantic structure, focus utilities, reduced-motion helpers, and documented WCAG targets |
| **Delivery** | Dual export: modern SPA via Vite plus LMS artifacts through [`@lessonkit/lxpack`](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) |

LessonKit is developer tooling—not a timeline authoring tool. Think **React + telemetry + packaging**, not Storyline-in-a-box. **LessonKit Studio** (visual authoring) is unblocked after framework 1.0; see the [roadmap](https://lessonkit.readthedocs.io/en/latest/project/roadmap.html) ([ROADMAP.md](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md)).

---

## Features

- **React authoring** — `Course`, `Lesson`, `Scenario`, `Quiz`, `Reflection`, `ProgressTracker`, and hooks for progress, tracking, and completion
- **Identity v1** — Required `courseId`, `lessonId`, and `checkId`; stable URNs for telemetry and xAPI ([identity reference](https://lessonkit.readthedocs.io/en/latest/reference/identity.html))
- **Telemetry** — Session-aware events, optional batching, and a versioned event catalog ([telemetry reference](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html))
- **xAPI** — Statement generation, in-memory queueing, and transport hooks via `@lessonkit/xapi` ([telemetry & xAPI guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/telemetry-and-xapi.html))
- **Theming** — `ThemeProvider`, presets, and `--lk-*` CSS variables ([theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html))
- **LXPack export** — SCORM 1.2/2004, standalone, xAPI, cmi5 from a built Vite app ([packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html))
- **CLI** — Scaffold projects, run dev/build, and package with `lessonkit.json` ([CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html))

---

## Quick start

**Requirements:** Node.js **18+** for dev/build; **20+** for LMS packaging targets.

### New project (recommended)

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

Each project includes a root [`lessonkit.json`](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) manifest (`schemaVersion: 1`) that ties React props to the LXPack course descriptor. See the [packaging & CLI guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html).

### Add to an existing React app

```bash
npm install @lessonkit/react @lessonkit/core react react-dom
```

Optional: `@lessonkit/xapi`, `@lessonkit/themes`, `@lessonkit/accessibility`.

### Monorepo (contributors)

```bash
git clone https://github.com/eddiethedean/lessonkit.git
cd lessonkit
npm install
npm run build
npm test
```

Run the interactive showcases ([live demos](https://lessonkit.readthedocs.io/en/latest/examples/index.html)):

```bash
npm -w lessonkit-example-react-vite run dev
```

Package the golden LXPack example:

```bash
npm -w lessonkit-example-lxpack-golden run build
npm -w lessonkit-example-lxpack-golden run package:scorm12
```

---

## How it fits together

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

At runtime, `@lessonkit/react` emits telemetry and xAPI (and can forward scores to an embedded LXPack bridge when packaged). Browse the [full documentation](https://lessonkit.readthedocs.io/en/latest/) or the [components & hooks guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/components-and-hooks.html).

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

Keep `courseId`, `lessonId`, and `checkId` in sync with `lessonkit.json` and your LXPack descriptor—`lessonkit init` patches the starter `App.tsx` for you. See [identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) and [project structure](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/project-structure.html).

---

## Packages

| Package | Version | Description |
| --- | --- | --- |
| [`@lessonkit/react`](https://www.npmjs.com/package/@lessonkit/react) | [![npm](https://img.shields.io/npm/v/@lessonkit/react.svg)](https://www.npmjs.com/package/@lessonkit/react) | Components, hooks, `ThemeProvider`, and runtime provider |
| [`@lessonkit/core`](https://www.npmjs.com/package/@lessonkit/core) | [![npm](https://img.shields.io/npm/v/@lessonkit/core.svg)](https://www.npmjs.com/package/@lessonkit/core) | Types, identity helpers, telemetry catalog, and tracking client |
| [`@lessonkit/xapi`](https://www.npmjs.com/package/@lessonkit/xapi) | [![npm](https://img.shields.io/npm/v/@lessonkit/xapi.svg)](https://www.npmjs.com/package/@lessonkit/xapi) | xAPI statements, queueing, and telemetry-to-xAPI mapping |
| [`@lessonkit/lxpack`](https://www.npmjs.com/package/@lessonkit/lxpack) | [![npm](https://img.shields.io/npm/v/@lessonkit/lxpack.svg)](https://www.npmjs.com/package/@lessonkit/lxpack) | Course descriptors, validation, and LMS packaging (Node 20+) |
| [`@lessonkit/cli`](https://www.npmjs.com/package/@lessonkit/cli) | [![npm](https://img.shields.io/npm/v/@lessonkit/cli.svg)](https://www.npmjs.com/package/@lessonkit/cli) | `lessonkit init`, `dev`, `build`, `package` |
| [`@lessonkit/accessibility`](https://www.npmjs.com/package/@lessonkit/accessibility) | [![npm](https://img.shields.io/npm/v/@lessonkit/accessibility.svg)](https://www.npmjs.com/package/@lessonkit/accessibility) | Focus trap, roving tabindex, reduced motion, visually hidden styles |
| [`@lessonkit/themes`](https://www.npmjs.com/package/@lessonkit/themes) | [![npm](https://img.shields.io/npm/v/@lessonkit/themes.svg)](https://www.npmjs.com/package/@lessonkit/themes) | Theme presets and design tokens |

---

## Repository layout

```text
lessonkit/
├── packages/
│   ├── core/            # telemetry, identity
│   ├── react/           # components + hooks
│   ├── xapi/
│   ├── accessibility/
│   ├── themes/
│   ├── lxpack/          # SCORM / standalone / xAPI / cmi5 export
│   └── cli/             # lessonkit CLI + bundled template
├── examples/
│   ├── react-vite/         # InfoSec annual (email, smishing, Teams)
│   ├── data-privacy/       # GDPR compliance (outline nav, tabletop)
│   ├── customer-service/   # contact center (stepper, chat & voice)
│   └── lxpack-golden/      # warehouse safety + LXPack packaging
├── templates/
│   └── vite-react/      # source for lessonkit init
└── docs/                # guides (CLI, packaging, identity, …)
```

---

## Documentation

Full site (Sphinx + Read the Docs): **[lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/)**

| Audience | Start |
| --- | --- |
| Vibe coding (AI-assisted, no React required) | [guides/vibe-coding](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) |
| React developers | [guides/react-developers](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/index.html) |
| Live compiled examples | [examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html) |

### Reference

| Topic | Documentation |
| --- | --- |
| CLI & `lessonkit.json` | [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) |
| Core runtime & telemetry pipeline | [Core reference](https://lessonkit.readthedocs.io/en/latest/reference/core.html) |
| Plugins | [Plugins](https://lessonkit.readthedocs.io/en/latest/reference/plugins.html) |
| LMS packaging | [Packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) |
| LXPack bridge (embedded LMS) | [LXPack bridge](https://lessonkit.readthedocs.io/en/latest/reference/lxpack-bridge.html) |
| IDs & URNs | [Identity reference](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) |
| Telemetry events | [Telemetry reference](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) |
| Theming | [Theming reference](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) |
| Accessibility | [Accessibility reference](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) |
| LXPack interoperability | [LXPack upgrades](https://lessonkit.readthedocs.io/en/latest/reference/lxpack-upgrades.html) |

Source markdown for reference pages lives under [`docs/`](https://github.com/eddiethedean/lessonkit/tree/main/docs) (also see [contributing to the monorepo](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/contributing-to-the-monorepo.html)).

### Project meta

- [Changelog](https://lessonkit.readthedocs.io/en/latest/project/changelog.html) · [CHANGELOG.md](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md) — release history
- [RELEASING.md](https://github.com/eddiethedean/lessonkit/blob/main/RELEASING.md) — publish `@lessonkit/*` to npm
- [Security](https://lessonkit.readthedocs.io/en/latest/project/security.html) · [SECURITY.md](https://github.com/eddiethedean/lessonkit/blob/main/SECURITY.md) — vulnerability reporting
- [Roadmap](https://lessonkit.readthedocs.io/en/latest/project/roadmap.html) · [PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md) · [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md) · [ROADMAP.md](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md)
- [docs/LessonKit_Studio_PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/LessonKit_Studio_PLAN.md) — visual authoring (framework 1.0 gate met)

---

## Development

| Script | Purpose |
| --- | --- |
| `npm run build` | Build all packages and example apps |
| `npm test` | Run workspace tests |
| `npm run typecheck` | Typecheck packages and apps |
| `npm run coverage` | Coverage across workspaces |
| `npm run audit:ci` | Dependency audit (CI-aligned) |
| `npm run test:integration` | Vitest CLI pipeline integration (Node 20+) |
| `npm run test:e2e` | Playwright export-parity tests (Node 20+; run `npm exec -w @lessonkit/e2e -- playwright install --with-deps chromium` once after `npm ci`) |

Prettier is configured at the repo root. CI runs on Node 18 and 20 (see [.github/workflows/ci.yml](https://github.com/eddiethedean/lessonkit/blob/main/.github/workflows/ci.yml)).

---

## Versioning

LessonKit follows [semver](https://semver.org/). The **1.0** line is the stable public API; see [CHANGELOG.md](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md) and [MIGRATION-0.x-to-1.0.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/MIGRATION-0.x-to-1.0.md) for breaking changes from 0.9.x.

To publish packages from this monorepo, follow [RELEASING.md](https://github.com/eddiethedean/lessonkit/blob/main/RELEASING.md).

---

## License

[Apache-2.0](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE) — Copyright (c) LessonKit contributors.
