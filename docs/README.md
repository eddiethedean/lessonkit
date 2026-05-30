# Documentation

[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

LessonKit documentation is built with **Sphinx** and published on **[Read the Docs](https://lessonkit.readthedocs.io/en/latest/)**.

| Audience | Start here |
| --- | --- |
| Non-technical / AI-assisted (“vibe coding”) | [Vibe coding guides](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) |
| React developers | [React developer guides](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/index.html) |
| Runnable demos | [Live examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html) |

## Build locally

```bash
cd docs
pip install -r requirements.txt
bash ../docs/scripts/build-docs-demos.sh   # optional: embed example apps
make html
open _build/html/index.html
```

## Publish on Read the Docs

See [READTHEDOCS.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/READTHEDOCS.md). Configuration lives at the repo root: [`.readthedocs.yaml`](https://github.com/eddiethedean/lessonkit/blob/main/.readthedocs.yaml).

## Reference (published pages)

| Topic | Read the Docs | Source markdown |
| --- | --- | --- |
| CLI | [reference/cli](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) | [CLI.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/CLI.md) |
| Packaging | [reference/packaging](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) | [PACKAGING.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/PACKAGING.md) |
| Identity | [reference/identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) | [IDENTITY.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/IDENTITY.md) |
| Telemetry | [reference/telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) | [TELEMETRY.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/TELEMETRY.md) |
| Theming | [reference/theming](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) | [THEMING.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/THEMING.md) |
| Accessibility | [reference/accessibility](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) | [ACCESSIBILITY.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/ACCESSIBILITY.md) |
| LXPack interoperability | [reference/lxpack-upgrades](https://lessonkit.readthedocs.io/en/latest/reference/lxpack-upgrades.html) | [LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md) · [historical checklist](https://github.com/eddiethedean/lessonkit/blob/main/docs/LXPACK_UPGRADES_FOR_LESSONKIT.md) |

Edit the source markdown files; Sphinx pulls them in via `reference/*` wrappers.

## Other folders

- [storybook/](https://github.com/eddiethedean/lessonkit/tree/main/docs/storybook) — component gallery (`npm run storybook` from repo root)
- [site/](https://github.com/eddiethedean/lessonkit/tree/main/docs/site) — legacy Docusaurus placeholder (superseded by Read the Docs)
