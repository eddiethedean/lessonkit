# Documentation

Sphinx site published at **[lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)**.

| Audience | Entry |
| --- | --- |
| AI-assisted / non-React | [Vibe coding](https://lessonkit.readthedocs.io/en/latest/guides/vibe-coding/index.html) |
| React developers | [React guides](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/index.html) |
| Runnable demos | [Examples](https://lessonkit.readthedocs.io/en/latest/examples/index.html) |

## Build locally

```bash
pip install -r docs/requirements.txt
bash docs/scripts/build-docs-demos.sh   # optional: embed example apps
sphinx-build -b html docs docs/_build/html
```

## Source layout

- `guides/` — tutorials and how-tos
- `reference/` — Sphinx wrappers pointing at root markdown (`CLI.md`, `PACKAGING.md`, etc.)
- `storybook/` — component gallery notes
- `conf.py` — Sphinx config (`release = "1.0.1"`)

Publishing: [READTHEDOCS.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/READTHEDOCS.md) · [`.readthedocs.yaml`](https://github.com/eddiethedean/lessonkit/blob/main/.readthedocs.yaml)

Edit the markdown source files; reference pages import them automatically.
