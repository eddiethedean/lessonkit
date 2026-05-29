# Contributing to the monorepo

## Setup

```bash
git clone https://github.com/eddiethedean/lessonkit.git
cd lessonkit
npm install
npm run build
npm test
```

## Common scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Packages + examples |
| `npm test` | All workspace tests |
| `npm run typecheck` | Typecheck (builds packages first) |
| `npm run coverage` | Coverage report |
| `npm run audit:ci` | Dependency audit |

## Package build order

Root `build:packages` builds `core` → `xapi` → `accessibility` → `themes` → `lxpack` → `react` → `cli`.

## Docs site (this site)

```bash
cd docs
pip install -r requirements.txt
sphinx-build -b html . _build/html
open _build/html/index.html
```

Read the Docs uses [`.readthedocs.yaml`](https://github.com/eddiethedean/lessonkit/blob/main/.readthedocs.yaml) at the repo root. CI validates docs via the `docs` job in [`.github/workflows/checks.yml`](https://github.com/eddiethedean/lessonkit/blob/main/.github/workflows/checks.yml). Setup: [READTHEDOCS.md](https://github.com/eddiethedean/lessonkit/blob/main/docs/READTHEDOCS.md).

## Releases

Tag-based npm publish — [RELEASING.md](https://github.com/eddiethedean/lessonkit/blob/main/RELEASING.md).

## Roadmap

Studio and 1.0 API stability are tracked in [ROADMAP.md](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md).
