# Publishing on Read the Docs

This repository includes a [Sphinx](https://www.sphinx-doc.org/) site under `docs/` using the **[Furo](https://pradyunsg.me/furo/)** theme (light/dark mode, modern layout) with two guide tracks:

- **Vibe coding** — non-technical, AI-assisted workflow
- **React developers** — technical integration guides

Reference pages **include** existing markdown from `docs/*.md` and the repo root so there is a single source of truth.

## Connect Read the Docs

1. Sign in at [readthedocs.org](https://readthedocs.org/) with your GitHub account.
2. **Import a project** → select `eddiethedean/lessonkit` (or your fork).
3. RTD should detect [`.readthedocs.yaml`](../.readthedocs.yaml) automatically.
4. Set the default branch to `main` and enable **PDF/Epub** if desired (configured in the YAML).
5. Save and trigger a build.

Default configuration:

| Setting | Value |
| --- | --- |
| Config file | `.readthedocs.yaml` |
| Sphinx config | `docs/conf.py` |
| Python requirements | `docs/requirements.txt` |

## Local preview

```bash
cd docs
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
sphinx-build -b html . _build/html
open _build/html/index.html   # macOS; or open the folder in a browser
```

Or use the Makefile (builds examples, then Sphinx):

```bash
cd docs && make html
```

Compiled demos are produced by `docs/scripts/build-docs-demos.sh` (Node 18+ at repo root):

- **Course examples** — [examples/index.md](examples/index.md)

The Makefile and `.readthedocs.yaml` run that script before Sphinx.

Embedded demo bundles are **smoke-tested with Playwright in GitHub Actions only** (`.github/workflows/checks.yml`, `docs` job — runs on pull requests, pushes to `main`, and release tags). Read the Docs builds the static bundles but does not run Playwright.

## Custom domain (optional)

In the RTD project → **Admin** → **Domains**, add e.g. `docs.lessonkit.dev` and configure DNS per RTD instructions.

## CI

GitHub Actions runs the full docs pipeline (demo builds, Playwright smoke tests, Sphinx `-W`) on pull requests, pushes to `main`, and release tags — see `.github/workflows/checks.yml`, `docs` job. Read the Docs publishes the built site without Playwright.

## Editing guides

| Audience | Path |
| --- | --- |
| Vibe coding | `docs/guides/vibe-coding/` |
| React | `docs/guides/react-developers/` |
| Shared reference | `docs/CLI.md`, `docs/PACKAGING.md`, … (included under `docs/reference/`) |

Update `docs/index.md` toctree when adding new pages.
