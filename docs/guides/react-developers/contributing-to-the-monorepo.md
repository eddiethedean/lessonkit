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
| `npm run test:integration` | CLI pipeline integration (Node 18+) |

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

## E2E and conformance

Export parity between React/Vite and LMS artifacts is enforced by Playwright and packaging scripts in [`e2e/`](https://github.com/eddiethedean/lessonkit/tree/main/e2e). See the [export parity guide](export-parity.md) for the full matrix.

**Prerequisites:** Node.js **20+**; after `npm ci`, install Playwright once:

```bash
npm exec -w @lessonkit/e2e -- playwright install --with-deps chromium
```

**Commands:**

| Command | When to run |
|---------|-------------|
| `npm run test:integration` | Changes to `packages/cli`, `packages/lxpack`, `lessonkit.json`, or CLI template |
| `npm run test:e2e` | Changes to `packages/react`, `e2e/`, `examples/lxpack-golden`, or packaging |
| `npm run test:e2e:ui` | Debugging flaky Playwright specs locally |
| `npm run conformance:lxpack` | Changes to `@lessonkit/lxpack` or LXPack dependency pins |
| `npm run conformance:golden` | Golden example packaging or `lessonkit.json` descriptor |
| `E2E_FORCE_REBUILD=1 npm run test:e2e` | After changing global-setup artifact paths or harness fixture |

Details: [`e2e/README.md`](https://github.com/eddiethedean/lessonkit/blob/main/e2e/README.md).
