# Documentation

Sphinx site published at **[lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)**.

| Audience | Entry |
| --- | --- |
| New users | [Start here](https://lessonkit.readthedocs.io/en/latest/guides/start-here.html) · [Prerequisites](https://lessonkit.readthedocs.io/en/latest/guides/prerequisites.html) · [FAQ](https://lessonkit.readthedocs.io/en/latest/guides/faq.html) |
| AI-assisted / non-React | [Vibe coding](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) |
| React developers | [React guides](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/index.html) |
| Evaluators | [Architecture](https://lessonkit.readthedocs.io/en/latest/guides/architecture-overview.html) · [Enterprise evaluation](https://lessonkit.readthedocs.io/en/latest/guides/enterprise-evaluation.html) |
| Runnable course demos | [Examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html) |

## Build locally

Match CI as closely as possible:

```bash
npm ci
npm run build:packages
npm run docs:api
node docs/scripts/generate-block-props-doc.mjs   # after block-catalog JSON changes
bash docs/scripts/verify-doc-includes.sh
pip install -r docs/requirements.txt
bash docs/scripts/build-docs-demos.sh   # optional: embed example course bundles
sphinx-build -W -b html docs docs/_build/html
npm run docs:verify   # after sphinx-build: includes + substitution tokens in HTML
sphinx-build -b linkcheck docs docs/_build/linkcheck   # optional: external link audit
```

Without `npm run docs:api`, [API reference](reference/api.md) TypeDoc links will be broken in the built site.

### MyST substitutions (`{{ release }}`, paths, Node versions)

Shared values live in **`conf.py`** → `release` and `myst_substitutions`. Use `{{ key }}` in Markdown **or** in `{raw} html` blocks — `conf.py` expands every token on `source-read` before Sphinx parses the page.

When adding a new substitution key, define it only in `myst_substitutions`; CI runs `verify_doc_substitutions.py`, which reads that dict and fails if any `{{ key }}` survives in built HTML.

Do **not** hard-code the framework version in the home hero badge; keep `v{{ release }}` in `index.md`.

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
| `docs/MANIFEST.md` | `reference/manifest.md` |
| `../../CHANGELOG.md` | `project/changelog.md` |
| `../../SECURITY.md` | `project/security.md` |

Standalone pages (edit directly): `guides/*`, `examples/index.md`, `reference/api.md`, `reference/lms-compatibility.md`, `reference/glossary.md`, `reference/xapi.md`.

After editing included files, run the full build command above to catch broken links and missing includes.
