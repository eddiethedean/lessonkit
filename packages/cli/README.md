# @lessonkit/cli

[![npm](https://img.shields.io/npm/v/@lessonkit/cli.svg)](https://www.npmjs.com/package/@lessonkit/cli)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/cli.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Scaffold, develop, build, and package LessonKit courses.

## Install

```bash
npm install -g @lessonkit/cli
# or one-shot (recommended for new courses):
npx @lessonkit/cli init my-course
```

**Node.js:** **20.19+** recommended for `init` (Vite 8 scaffold). **18+** minimum for `dev`, `build`, and `package`.

## Commands

```bash
lessonkit init my-course    # scaffold Vite + React project (runs npm install)
lessonkit dev               # Vite dev server
lessonkit build             # production build → dist/
lessonkit package --target scorm12   # LMS artifact
```

### Init flags

| Flag | Purpose |
| --- | --- |
| `--here` | Scaffold in the current directory |
| `--force` | Overwrite existing files in the target directory |
| `--skip-install` | Skip `npm install` after copying the template |

### Package targets

| Target | Output |
| --- | --- |
| `react-vite` | Vite build only |
| `scorm12`, `scorm2004` | SCORM package |
| `standalone` | Self-contained web bundle |
| `xapi`, `cmi5` | xAPI / cmi5 packages |

Every project includes a root `lessonkit.json` manifest (`schemaVersion: 1`).

Subprocess timeout defaults to **30 minutes** (`LESSONKIT_CMD_TIMEOUT_MS`).

## Common issues

| Symptom | Fix |
| --- | --- |
| `lessonkit: command not found` | Use `npx @lessonkit/cli` or `npm run dev` in a scaffolded project |
| `init` fails on Node version | Use Node **20.19+** for Vite 8 scaffold |
| SCORM zip not at project root | Default path: `.lxpack/course/.lxpack/out/course-scorm12.zip` — trust CLI stdout |
| ID parity errors on `package` | Align `courseId`, `lessonId`, `checkId` between React and `lessonkit.json` |

## Docs

[5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) · [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) · [Ship to LMS checklist](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/ship-to-lms.html) · [Packaging guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html) · [Published template](https://github.com/eddiethedean/lessonkit/tree/main/packages/cli/template/vite-react) (monorepo source: [`templates/vite-react`](https://github.com/eddiethedean/lessonkit/tree/main/templates/vite-react))

## License

Apache-2.0
