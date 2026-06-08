# Examples

Runnable Vite + React courses demonstrating `@lessonkit/react` patterns and LMS packaging.

> **Production config:** Monorepo examples use **console telemetry sinks** for demos (`examples/_shared/docsDemoConfig.ts`). For LMS go-live, copy patterns from the CLI template **`src/courseConfig.ts`** (`npx @lessonkit/cli init`) and complete the [production checklist](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/production-checklist.html)—do not copy example telemetry wiring into production.

**Live demos:** [lessonkit.readthedocs.io/examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html)

## Quick try (no clone)

```bash
npx @lessonkit/cli init my-course
cd my-course
npm run dev
```

See the [5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html).

## Start here (pick one path)

**Full picker (embedded vs local, framework version):** [Examples on Read the Docs](https://lessonkit.readthedocs.io/en/latest/examples/index.html#example-picker)

| Tier | Example | When to use |
| --- | --- | --- |
| **Start** | [`npx @lessonkit/cli init`](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) (external) or [`react-vite/`](react-vite/README.md) | First course, full UX patterns, or monorepo smoke test |
| **Blocks** | [`framework-11-showcase/`](framework-11-showcase/) · [`framework-12-showcase/`](framework-12-showcase/) | Block catalog coverage (1.1 P0 assessments vs 1.2+ compound + Tier C/D + **1.6.x content wave**) |
| **Compound** | [`interactive-book/`](interactive-book/README.md) · [`slide-deck/`](slide-deck/) · [`interactive-video/`](interactive-video/) · [`branching-scenario/`](branching-scenario/) | Books, decks, timed video, branching graphs (1.2–1.5) |
| **Packaging** | [`lxpack-golden/`](lxpack-golden/) | SCORM/xAPI export reference and validation smoke target |

**Not sure?** Use the CLI template or `react-vite`—avoid copying `file:../../packages/*` into your own repo.

## Monorepo examples (full table)

These workspaces use `file:../../packages/*` dependencies—they are for **monorepo development**, not copy-paste templates for external apps.

| Directory | Workspace name | Course | Highlights |
| --- | --- | --- | --- |
| [`react-vite/`](react-vite/README.md) | `lessonkit-example-react-vite` | Cybersecurity Awareness | Dark theme · email, SMS, Teams sims · on RTD |
| [`data-privacy/`](data-privacy/README.md) | `lessonkit-example-data-privacy` | GDPR Essentials | Compliance theme · case files, tabletop · on RTD |
| [`customer-service/`](customer-service/README.md) | `lessonkit-example-customer-service` | De-escalation | Support theme · chat and voice coaching · on RTD |
| [`lxpack-golden/`](lxpack-golden/) | `lessonkit-example-lxpack-golden` | Warehouse Safety | Packaging reference · SCORM/xAPI smoke target · on RTD |
| [`interactive-book/`](interactive-book/README.md) | `lessonkit-example-interactive-book` | Interactive book | Compound `Page` / `InteractiveBook` (1.2) · on RTD |
| [`slide-deck/`](slide-deck/) | `lessonkit-example-slide-deck` | Onboarding presentation | Compound `Slide` / `SlideDeck` (1.3) · on RTD |
| [`interactive-video/`](interactive-video/) | `lessonkit-example-interactive-video` | Safety briefing | Compound `InteractiveVideo` / `TimedCue` (1.4) |
| [`branching-scenario/`](branching-scenario/) | `lessonkit-example-branching-scenario` | Resolution paths | Compound `BranchingScenario` / graph branches (1.5) |
| [`framework-11-showcase/`](framework-11-showcase/) | `lessonkit-example-framework-11-showcase` | Incident Response | **Full 1.1 catalog** — foundation + P0 assessments |
| [`framework-12-showcase/`](framework-12-showcase/) | `lessonkit-example-framework-12-showcase` | Atlas Analytics | **1.2 catalog + 1.6.x content wave** — compound, Tier C/D, `Table`/`Timeline`/… lesson |
| [`assessments-p0/`](assessments-p0/README.md) | `lessonkit-example-assessments-p0` | Assessment showcase | Minimal P0 sample (subset of 1.1) · on RTD |

Each runnable app shares a modern LMS shell (`_shared/lms-ui.css`, `_shared/course-ui.tsx`) with themed variants.

## Run locally

From repo root — **build packages first** (examples link to workspace `packages/*`):

```bash
npm install && npm run build:packages
npm -w lessonkit-example-react-vite run dev
```

Swap the workspace name from the table above. Node **20.19+** recommended; **18+** minimum for package commands. See [Prerequisites](../docs/guides/prerequisites.md).

## Docs embeds

```bash
bash docs/scripts/build-docs-demos.sh
```

See [examples guide](https://lessonkit.readthedocs.io/en/latest/examples/index.html).
