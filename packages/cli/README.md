# @lessonkit/cli

[![npm](https://img.shields.io/npm/v/@lessonkit/cli.svg)](https://www.npmjs.com/package/@lessonkit/cli)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/cli.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Scaffold, develop, build, and package LessonKit courses. Node.js **18+**.

## Install

```bash
npm install -g @lessonkit/cli
# or one-shot:
npx @lessonkit/cli init my-course
```

## Commands

```bash
lessonkit init my-course    # scaffold Vite + React project
lessonkit dev               # Vite dev server
lessonkit build             # production build → dist/
lessonkit package --target scorm12   # LMS artifact
```

| Target | Output |
| --- | --- |
| `react-vite` | Vite build only |
| `scorm12`, `scorm2004` | SCORM package |
| `standalone` | Self-contained web bundle |
| `xapi`, `cmi5` | xAPI / cmi5 packages |

Every project includes a root `lessonkit.json` manifest (`schemaVersion: 1`).

Subprocess timeout defaults to **30 minutes** (`LESSONKIT_CMD_TIMEOUT_MS`; set `0` to disable).

## Docs

[CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) · [Packaging guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html) · [Template source](https://github.com/eddiethedean/lessonkit/tree/main/templates/vite-react)

## License

Apache-2.0
