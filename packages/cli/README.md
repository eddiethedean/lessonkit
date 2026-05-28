# `@lessonkit/cli`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@lessonkit/cli.svg)](https://www.npmjs.com/package/@lessonkit/cli)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../../LICENSE)

LessonKit CLI — scaffold, dev, build, and package learning experiences.

## Install

```bash
npm install -g @lessonkit/cli
# or
npx @lessonkit/cli init my-course
```

**Node.js:** dev/build on Node 18+. LMS packaging targets require **Node.js 20+**.

## Quick start

```bash
lessonkit init my-course
cd my-course
lessonkit dev
lessonkit build
lessonkit package --target scorm12
```

## Commands

| Command | Description |
|---------|-------------|
| `lessonkit init [name]` | Scaffold a Vite + React project |
| `lessonkit dev` | Run Vite dev server |
| `lessonkit build` | Production Vite build |
| `lessonkit package --target <target>` | Build or package for web / LMS |
| `lessonkit publish` | Stub — see [`RELEASING.md`](../../RELEASING.md) |

### Package targets

- `react-vite` — Vite production build → `dist/`
- `scorm12`, `scorm2004`, `xapi`, `cmi5`, `standalone` — via `@lessonkit/lxpack`

## Project manifest

Projects include a `lessonkit.json` at the root. See [`docs/CLI.md`](../../docs/CLI.md) for the schema, flags, exit codes, and JSON output mode.

## Related

- [`docs/CLI.md`](../../docs/CLI.md) — full CLI reference
- [`docs/PACKAGING.md`](../../docs/PACKAGING.md) — LXPack output layout
- [`templates/vite-react`](../../templates/vite-react) — starter template
