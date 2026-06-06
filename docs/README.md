# Documentation

Sphinx site published at **[lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)**.

| Audience | Entry |
| --- | --- |
| New users | [FAQ](https://lessonkit.readthedocs.io/en/latest/guides/faq.html) · [5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) |
| AI-assisted / non-React | [Vibe coding](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) |
| React developers | [React guides](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/index.html) |
| Evaluators | [Architecture](https://lessonkit.readthedocs.io/en/latest/guides/architecture-overview.html) · [Enterprise evaluation](https://lessonkit.readthedocs.io/en/latest/guides/enterprise-evaluation.html) |
| Runnable course demos | [Examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html) |

## Build locally

```bash
pip install -r docs/requirements.txt
bash docs/scripts/build-docs-demos.sh   # embed example course bundles
sphinx-build -b html docs docs/_build/html
```

## Source layout

- `guides/` — tutorials and how-tos
- `reference/` — Sphinx wrappers that `{include}` root markdown (see below)
- `storybook/` — component gallery notes
- `conf.py` — Sphinx config (`release` matches current framework version)

Publishing: [READTHEDOCS.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/READTHEDOCS.md) · [`.readthedocs.yaml`](https://github.com/eddiethedean/lessonkit/blob/main/.readthedocs.yaml)

## Single-source policy (contributors)

Edit the **canonical markdown at `docs/` root**, not the thin wrapper pages under `reference/`:

| Edit this file | Wrapper (do not duplicate) |
| --- | --- |
| `docs/CLI.md` | `reference/cli.md` |
| `docs/PACKAGING.md` | `reference/packaging.md` |
| `docs/IDENTITY.md` | `reference/identity.md` |
| `docs/TELEMETRY.md` | `reference/telemetry.md` |
| `docs/THEMING.md` | `reference/theming.md` |
| `docs/ACCESSIBILITY.md` | `reference/accessibility.md` |
| `docs/BLOCK_CATALOG.md` | `reference/block-catalog.md` |
| `docs/CORE.md` | `reference/core.md` |
| `docs/PLUGINS.md` | `reference/plugins.md` |
| `docs/LXPACK_BRIDGE.md` | `reference/lxpack-bridge.md` |
| `../../CHANGELOG.md` | `project/changelog.md` |
| `../../SECURITY.md` | `project/security.md` |

Standalone pages (edit directly): `guides/*`, `examples/index.md`, `reference/api.md`, `reference/lms-compatibility.md`, `reference/glossary.md`.

After editing included files, run `sphinx-build -W -b html docs docs/_build/html` to catch broken links.
