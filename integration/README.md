# Integration tests

Vitest suite for the LessonKit CLI pipeline. Uses real subprocesses (no mocks for `build` / `package`). Node.js **18+**.

## Run

```bash
npm run build:packages && npm run -w @lessonkit/cli build
npm run test:integration
```

The suite uses a Vitest `globalSetup` that builds packages once, pre-installs a shared minimal-course fixture under `.cache/`, and prebuilds example apps in parallel. Temp projects copy from that cache instead of running `npm install` per test. Test files run in parallel (up to 4 workers); golden-example packaging is serialized with a per-project lock.

## Coverage

| File | Tests |
| --- | --- |
| `cli-init-build-package.test.ts` | init → install → build → package |
| `cli-package-targets.test.ts` | All LMS targets on golden example |
| `descriptor-parity.test.ts` | `lessonkit.json` ↔ descriptor ↔ App IDs |
| `cli-failures.test.ts` | Invalid manifest, missing dist |
| `showcase-parity.test.ts` | Example apps ID parity |
| `activity-iri.test.ts` | xAPI/cmi5 `activityIri` validation |
| `assessments-p0-package.test.ts` | assessments-p0 SCORM packaging |
| `interactive-book-package.test.ts` | interactive-book SCORM packaging |
| `slide-deck-package.test.ts` | slide-deck SCORM packaging (1.3 golden path) |
| `branching-scenario-package.test.ts` | branching-scenario SCORM packaging |
| `interactive-video-package.test.ts` | interactive-video SCORM packaging |
| `cli-strict-parity.test.ts` | Strict manifest ↔ React ID parity |
| `validation-guards.test.ts` | Packaging validation guardrails |
| `standalone-server.test.ts` | Standalone package HTTP smoke |
| `cli-out.test.ts` | CLI `--out` output path overrides |
| `lkcourse-roundtrip.test.ts` | `lessonkit export` → validate → import `.lkcourse` archive |
| `framework-12-showcase-package.test.ts` | framework-12-showcase SCORM packaging (1.2 + 1.6.x content wave) |

Fixtures: [`fixtures/minimal-course/`](https://github.com/eddiethedean/lessonkit/tree/main/integration/fixtures/minimal-course) — rewrites deps to monorepo `file:` URLs.

CI: **Integration (Node 20)** job in [`.github/workflows/checks.yml`](https://github.com/eddiethedean/lessonkit/blob/main/.github/workflows/checks.yml).
