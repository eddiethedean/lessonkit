# LessonKit

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](LICENSE)

**LessonKit** is a React-first framework for building accessible, trackable learning experiences—and shipping them to the LMS. Author courses as components, wire telemetry and xAPI, theme with design tokens, and export SCORM, standalone, xAPI, or cmi5 packages from the same codebase.

**Current release:** [0.7.0](CHANGELOG.md) · Published on npm as [`@lessonkit/*`](https://www.npmjs.com/org/lessonkit)

**Documentation:** [Read the Docs](https://lessonkit.readthedocs.io/) — [vibe coding guides](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) · [React developer guides](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/index.html) (build locally: [docs/READTHEDOCS.md](docs/READTHEDOCS.md))

---

## Why LessonKit

| For | You get |
| --- | --- |
| **LX / frontend developers** | Composable React primitives, TypeScript, Vite, and a real CLI (`init`, `dev`, `build`, `package`) |
| **Learning engineering** | Canonical IDs, a telemetry catalog, and xAPI mapping aligned with LMS object URNs |
| **Accessibility** | Semantic structure, focus utilities, reduced-motion helpers, and documented WCAG targets |
| **Delivery** | Dual export: modern SPA via Vite plus LMS artifacts through [`@lessonkit/lxpack`](docs/PACKAGING.md) |

LessonKit is developer tooling—not a timeline authoring tool. Think **React + telemetry + packaging**, not Storyline-in-a-box. A visual **LessonKit Studio** is planned after framework 1.0; see [ROADMAP.md](ROADMAP.md).

---

## Features

- **React authoring** — `Course`, `Lesson`, `Scenario`, `Quiz`, `Reflection`, `ProgressTracker`, and hooks for progress, tracking, and completion
- **Identity v1** — Required `courseId`, `lessonId`, and `checkId`; stable URNs for telemetry and xAPI ([IDENTITY.md](docs/IDENTITY.md))
- **Telemetry** — Session-aware events, optional batching, and a versioned event catalog ([TELEMETRY.md](docs/TELEMETRY.md))
- **xAPI** — Statement generation, in-memory queueing, and transport hooks via `@lessonkit/xapi`
- **Theming** — `ThemeProvider`, presets, and `--lk-*` CSS variables ([THEMING.md](docs/THEMING.md))
- **LXPack export** — SCORM 1.2/2004, standalone, xAPI, cmi5 from a built Vite app ([PACKAGING.md](docs/PACKAGING.md))
- **CLI** — Scaffold projects, run dev/build, and package with `lessonkit.json` ([CLI.md](docs/CLI.md))

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

Each project includes a root [`lessonkit.json`](docs/CLI.md#project-manifest-lessonkitjson) manifest (`schemaVersion: 1`) that ties React props to the LXPack course descriptor.

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

Run the interactive showcase:

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

At runtime, `@lessonkit/react` emits telemetry and xAPI (and can forward scores to an embedded LXPack bridge when packaged). See [docs/README.md](docs/README.md) for the full guide index.

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

Keep `courseId`, `lessonId`, and `checkId` in sync with `lessonkit.json` and your LXPack descriptor—`lessonkit init` patches the starter `App.tsx` for you.

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

### Reference (also in repo)

| Topic | Doc |
| --- | --- |
| CLI & `lessonkit.json` | [docs/CLI.md](docs/CLI.md) |
| LMS packaging | [docs/PACKAGING.md](docs/PACKAGING.md) |
| IDs & URNs | [docs/IDENTITY.md](docs/IDENTITY.md) |
| Telemetry events | [docs/TELEMETRY.md](docs/TELEMETRY.md) |
| Theming | [docs/THEMING.md](docs/THEMING.md) |
| Accessibility | [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) |
| LXPack interoperability | [docs/LXPACK_UPGRADES_FOR_LESSONKIT.md](docs/LXPACK_UPGRADES_FOR_LESSONKIT.md) |
| RTD setup | [docs/READTHEDOCS.md](docs/READTHEDOCS.md) |

### Project meta

- [CHANGELOG.md](CHANGELOG.md) — release history
- [RELEASING.md](RELEASING.md) — publish `@lessonkit/*` to npm
- [SECURITY.md](SECURITY.md) — vulnerability reporting
- [PLAN.md](PLAN.md) · [SPEC.md](SPEC.md) · [ROADMAP.md](ROADMAP.md) — vision, requirements, milestones
- [docs/LessonKit_Studio_PLAN.md](docs/LessonKit_Studio_PLAN.md) — future visual authoring (post–framework 1.0)

---

## Development

| Script | Purpose |
| --- | --- |
| `npm run build` | Build all packages and example apps |
| `npm test` | Run workspace tests |
| `npm run typecheck` | Typecheck packages and apps |
| `npm run coverage` | Coverage across workspaces |
| `npm run audit:ci` | Dependency audit (CI-aligned) |

Prettier is configured at the repo root. CI runs on Node 18 and 20 (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).

---

## Versioning

LessonKit follows [semver](https://semver.org/). The **0.x** line evolves quickly; see [CHANGELOG.md](CHANGELOG.md) for breaking changes (notably identity requirements in **0.5.0**).

To publish packages from this monorepo, follow [RELEASING.md](RELEASING.md).

---

## License

[MIT](LICENSE) — Copyright (c) LessonKit contributors.
