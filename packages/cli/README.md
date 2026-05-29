# `@lessonkit/cli`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![npm](https://img.shields.io/npm/v/@lessonkit/cli.svg)](https://www.npmjs.com/package/@lessonkit/cli)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../../LICENSE)

LessonKit CLI — scaffold, dev, build, and package learning experiences.

**Docs:** [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) · [Packaging & CLI guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html) · [Vibe coding: shipping to LMS](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/shipping-to-lms.html)

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

Projects include a `lessonkit.json` at the root. See the [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) for the schema, flags, exit codes, and JSON output mode.

## Related

- [Packaging reference](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) — LXPack output layout
- [React quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html)
- [`templates/vite-react`](../../templates/vite-react) — starter template
