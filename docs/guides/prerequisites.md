# Prerequisites

Install these before following any LessonKit tutorial.

## Node.js and npm

| Task | Node.js |
| --- | --- |
| **`npx @lessonkit/cli init`** (Vite 8 scaffold) | **{{ node_recommended }}** recommended |
| `lessonkit dev`, `build`, `package` in an existing course | **{{ node_minimum }}** minimum |
| Monorepo CI and Playwright e2e | **{{ node_recommended }}** (CI runs Node 20 only) |

**Node.js {{ node_recommended }} is recommended** for new projects. Node {{ node_minimum }} may work for packaging-only workflows on an existing course but is not tested in CI.

Install [Node.js LTS](https://nodejs.org/) and npm (bundled with Node).

## React and TypeScript (developer path)

LessonKit courses are **Vite + React + TypeScript** apps. Basic familiarity with JSX, components, and `npm run dev` is enough for the [5-minute guide](react-developers/getting-started-in-5-minutes.md).

If you are new to React, see [Learn React first](react-developers/index.md#new-to-react) or use [vibe coding](vibe-coding/index.md) instead — you do not need to study React first on that path.

## Clone vs init

| Goal | What to do |
| --- | --- |
| Build a course | `npx @lessonkit/cli init my-course` — **no clone required** |
| Run monorepo examples or contribute | Clone [github.com/eddiethedean/lessonkit](https://github.com/eddiethedean/lessonkit) |

Monorepo examples use `file:../../packages/*` workspace links. Do not copy that pattern into your own course repo.

## Optional tooling

| Tool | When you need it |
| --- | --- |
| Git | Version control for your course repo |
| LMS staging environment | SCORM smoke test after [First LMS export](react-developers/first-lms-export.md) |
| Python 3.12 + pip | Building LessonKit docs locally ([contributor docs on GitHub](https://github.com/eddiethedean/lessonkit/blob/main/docs/README.md)) |

## Next steps

- [Start here](start-here.md) — pick your path
- [Getting started in 5 minutes](react-developers/getting-started-in-5-minutes.md)
- [FAQ](faq.md)
