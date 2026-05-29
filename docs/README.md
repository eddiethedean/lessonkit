# Documentation

[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../LICENSE)

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

See [READTHEDOCS.md](READTHEDOCS.md). Configuration lives at the repo root: [`.readthedocs.yaml`](../.readthedocs.yaml).

## Reference (published pages)

| Topic | Read the Docs | Source markdown |
| --- | --- | --- |
| CLI | [reference/cli](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) | [CLI.md](CLI.md) |
| Packaging | [reference/packaging](https://lessonkit.readthedocs.io/en/latest/reference/packaging.html) | [PACKAGING.md](PACKAGING.md) |
| Identity | [reference/identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) | [IDENTITY.md](IDENTITY.md) |
| Telemetry | [reference/telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) | [TELEMETRY.md](TELEMETRY.md) |
| Theming | [reference/theming](https://lessonkit.readthedocs.io/en/latest/reference/theming.html) | [THEMING.md](THEMING.md) |
| Accessibility | [reference/accessibility](https://lessonkit.readthedocs.io/en/latest/reference/accessibility.html) | [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| LXPack upgrades | [reference/lxpack-upgrades](https://lessonkit.readthedocs.io/en/latest/reference/lxpack-upgrades.html) | [LXPACK_UPGRADES_FOR_LESSONKIT.md](LXPACK_UPGRADES_FOR_LESSONKIT.md) |

Edit the source markdown files; Sphinx pulls them in via `reference/*` wrappers.

## Other folders

- [storybook/](storybook/) — planned component gallery
- [site/](site/) — legacy Docusaurus placeholder (superseded by Read the Docs)
