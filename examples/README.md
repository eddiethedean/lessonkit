# LessonKit examples

[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/examples/index.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Runnable Vite + React courses with a **shared modern LMS shell** (`_shared/lms-ui.css`, `_shared/course-ui.tsx`): top bar with progress ring, curriculum sidebar, lesson cards, and themed variants. Each demo still uses different scenarios and content patterns with `@lessonkit/react`.

Browse **[live compiled demos](https://lessonkit.readthedocs.io/en/latest/examples/index.html)** on Read the Docs (built from this folder on each docs deploy).

| Directory | Course | Theme & highlights |
| --- | --- | --- |
| `react-vite/` | Cybersecurity Awareness (InfoSec) | Security (dark) · inbox triage, SMS device frame, Teams chat simulation |
| `data-privacy/` | Data Privacy & GDPR Essentials | Compliance (light) · lawful-basis lab, case files, incident tabletop |
| `customer-service/` | Customer Care: De-escalation | Support (light) · channel briefing, live-chat coaching, branching resolution |
| `lxpack-golden/` | Workplace Safety: Warehouse Briefing | Field (compact) · PPE sign-off, hazard photos, near-miss form |

Each example includes a root [`lessonkit.json`](https://lessonkit.readthedocs.io/en/latest/reference/cli.html). In the monorepo, build with `npm run build -w lessonkit-example-<name>` or `node ../../packages/cli/dist/bin.js build` from an example directory after `npm run build:packages`. Demos with multiple in-app steps use `layout: "single-spa"` with one LMS shell lesson in the manifest; additional step ids live only in React (see [`lxpack-golden/README.md`](lxpack-golden/README.md)). Full LMS packaging smoke tests target `lxpack-golden`; other demos are primarily UI showcases but can use `lessonkit package` after a production build (Node 18+).

## Run locally

```bash
npm install
npm run build:packages
npm -w lessonkit-example-react-vite run dev
```

Swap the workspace name for any example. See the [React quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html) and [packaging guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html).

## Docs embeds

```bash
bash docs/scripts/build-docs-demos.sh
```

Then open [examples on Read the Docs](https://lessonkit.readthedocs.io/en/latest/examples/index.html) or build Sphinx locally per [docs/README.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/README.md).
