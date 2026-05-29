# Documentation

LessonKit documentation is built with **Sphinx** and published on **Read the Docs**.

| Audience | Start here |
| --- | --- |
| Non-technical / AI-assisted (“vibe coding”) | [guides/vibe-coding/index.md](guides/vibe-coding/index.md) |
| React developers | [guides/react-developers/index.md](guides/react-developers/index.md) |

## Build locally

```bash
cd docs
pip install -r requirements.txt
make html
open _build/html/index.html
```

## Publish on Read the Docs

See [READTHEDOCS.md](READTHEDOCS.md). Configuration lives at the repo root: [`.readthedocs.yaml`](../.readthedocs.yaml).

## Source markdown (single source of truth)

Technical reference pages under `reference/` include these files:

- [CLI.md](CLI.md)
- [PACKAGING.md](PACKAGING.md)
- [IDENTITY.md](IDENTITY.md)
- [TELEMETRY.md](TELEMETRY.md)
- [THEMING.md](THEMING.md)
- [ACCESSIBILITY.md](ACCESSIBILITY.md)
- [LXPACK_UPGRADES_FOR_LESSONKIT.md](LXPACK_UPGRADES_FOR_LESSONKIT.md)

Edit those files for reference content; the Sphinx site pulls them in automatically.

## Other folders

- [storybook/](storybook/) — planned component gallery
- [site/](site/) — legacy Docusaurus placeholder (superseded by Read the Docs)
