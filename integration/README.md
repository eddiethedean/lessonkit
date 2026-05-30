# @lessonkit/integration

Vitest integration tests for the LessonKit CLI pipeline and descriptor parity. These tests use **real subprocesses** (no mocks for `build` / `package`) and require **Node.js 18+**.

## Prerequisites

From the repo root:

```bash
npm ci
npm run build:packages
npm run -w @lessonkit/cli build
```

## Run

```bash
npm run test:integration
```

## What is covered

| Test file | Purpose |
|-----------|---------|
| `cli-init-build-package.test.ts` | `lessonkit init --skip-install` → `npm install` (file-linked monorepo packages) → `build` → `package` (scorm12 + standalone) |
| `cli-package-targets.test.ts` | Golden example: CLI `package` for all LMS targets via `--no-build` |
| `descriptor-parity.test.ts` | `lessonkit.json` vs `course.descriptor.ts` vs golden `App.tsx` IDs |
| `cli-failures.test.ts` | Negative paths (missing dist, invalid manifest) |
| `showcase-parity.test.ts` | Example apps: `lessonkit.json` IDs match `App.tsx` props |
| `activity-iri.test.ts` | xAPI/cmi5 targets require `tracking.xapi.activityIri` in descriptors |

## Fixtures

[`fixtures/minimal-course/`](fixtures/minimal-course/) mirrors the CLI Vite template; integration helpers rewrite `@lessonkit/*` deps to `file:` URLs pointing at this monorepo.

## CI

The **Integration (Node 20)** job in [`.github/workflows/checks.yml`](../.github/workflows/checks.yml) runs this suite on every PR.
