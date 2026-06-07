# Contributing to the monorepo

## Setup

Canonical first-time setup (same as [CONTRIBUTING.md](https://github.com/eddiethedean/lessonkit/blob/main/CONTRIBUTING.md)):

```bash
git clone https://github.com/eddiethedean/lessonkit.git
cd lessonkit
npm ci
npm run build:packages
npm test
```

Use `npm install` only when you change workspace dependencies (commit the updated `package-lock.json`). Run `npm run build` (packages + all examples) before wide refactors or release validation—not for every PR.

## Common scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Packages + examples |
| `npm test` | All workspace tests (runs `pretest` → `build:packages` first so `@lessonkit/*` dist matches source) |
| `npm run typecheck` | Typecheck (builds packages first) |
| `npm run coverage` | Coverage report |
| `npm run audit:ci` | Dependency audit |
| `npm run test:integration` | CLI pipeline integration (Node 18+) |

## TypeScript conventions

The monorepo uses `strict: true` via [`tsconfig.base.json`](https://github.com/eddiethedean/lessonkit/blob/main/tsconfig.base.json). When adding or changing types:

- **Validators take `unknown`** — parse JSON and narrow with guards before asserting domain types. Do not cast `as LessonkitCourseDescriptor` (or similar) before validation completes.
- **Discriminated unions at boundaries** — CLI JSON output, manifest parse results, and telemetry events should narrow on a tag field (`ok`, `command`, `name`, etc.).
- **Exhaustive switches** — use `assertNever` from `@lessonkit/core` in `default` branches when switching on a closed union.
- **No explicit `any`** — ESLint enforces `@typescript-eslint/no-explicit-any` on production `src/`; tests and e2e may stay relaxed.
- **Identity IDs** — `CourseId`, `LessonId`, and `CheckId` are string aliases in 1.x; use `validateId` / `assertValidId` at trust boundaries. True opaque branded IDs are planned for 2.0.

## Package build order

Root `build:packages` builds `core` → `xapi` → `accessibility` → `themes` → `lxpack` → `react` → `cli`.

## Full CI-equivalent checks

Before opening a PR that touches multiple packages or release surfaces, run from the repo root:

| Check | Command |
| --- | --- |
| Template sync | `npm run copy-template -w @lessonkit/cli && git diff --exit-code packages/cli/template/vite-react` |
| Template parity | `diff -rq templates/vite-react/src packages/cli/template/vite-react/src` |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Coverage | `npm run coverage` |
| Storybook | `STORYBOOK_DISABLE_TELEMETRY=1 CI=true npm run build-storybook` |
| Integration | `npm run test:integration` |
| E2E | `npm exec -w @lessonkit/e2e -- playwright install chromium && npm run test:e2e` |
| Conformance | `npm run conformance:lxpack && npm run conformance:golden` |
| Audit | `npm run audit:ci` |
| API docs | `npm run docs:api` |
| Doc includes | `bash docs/scripts/verify-doc-includes.sh` |
| Sphinx docs | `cd docs && pip install -r requirements.txt && sphinx-build -W -b html . _build/html` |

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

Framework milestones and 1.0 API stability are tracked in [ROADMAP.md](https://github.com/eddiethedean/lessonkit/blob/main/ROADMAP.md).

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
