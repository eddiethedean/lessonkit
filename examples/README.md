# Examples

Runnable Vite + React courses demonstrating `@lessonkit/react` patterns and LMS packaging.

**Live demos:** [lessonkit.readthedocs.io/examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html)

These workspaces use `file:../../packages/*` dependencies—they are for **monorepo development**, not copy-paste templates for external apps. For a standalone starter, use `npx @lessonkit/cli init`.

| Directory | Workspace name | Course | Highlights |
| --- | --- | --- | --- |
| [`react-vite/`](react-vite/) | `lessonkit-example-react-vite` | Cybersecurity Awareness | Dark theme · email, SMS, Teams sims · on RTD |
| [`data-privacy/`](data-privacy/) | `lessonkit-example-data-privacy` | GDPR Essentials | Compliance theme · case files, tabletop · on RTD |
| [`customer-service/`](customer-service/) | `lessonkit-example-customer-service` | De-escalation | Support theme · chat and voice coaching · on RTD |
| [`lxpack-golden/`](lxpack-golden/) | `lessonkit-example-lxpack-golden` | Warehouse Safety | Packaging reference · SCORM/xAPI smoke target · on RTD |
| [`interactive-book/`](interactive-book/) | `lessonkit-example-interactive-book` | Interactive book | Compound `Page` / `InteractiveBook` (1.2) |
| [`slide-deck/`](slide-deck/) | `lessonkit-example-slide-deck` | Onboarding presentation | Compound `Slide` / `SlideDeck` (1.3) |
| [`interactive-video/`](interactive-video/) | `lessonkit-example-interactive-video` | Safety briefing | Compound `InteractiveVideo` / `TimedCue` (1.4) |
| [`framework-11-showcase/`](framework-11-showcase/) | `lessonkit-example-framework-11-showcase` | Incident Response | **Full 1.1 catalog** — foundation + P0 assessments |
| [`framework-12-showcase/`](framework-12-showcase/) | `lessonkit-example-framework-12-showcase` | Atlas Analytics | **Full 1.2 catalog** — content, compound, Tier C/D, hotspots |
| [`assessments-p0/`](assessments-p0/) | `lessonkit-example-assessments-p0` | Assessment showcase | Minimal P0 sample (subset of 1.1) |

Each runnable app shares a modern LMS shell (`_shared/lms-ui.css`, `_shared/course-ui.tsx`) with themed variants.

## Run locally

From repo root — **build packages first** (examples link to workspace `packages/*`):

```bash
npm install && npm run build:packages
npm -w lessonkit-example-react-vite run dev
```

Swap the workspace name from the table above. Packaging requires Node **18+**.

## Docs embeds

```bash
bash docs/scripts/build-docs-demos.sh
```

See [examples guide](https://lessonkit.readthedocs.io/en/latest/examples/index.html).
