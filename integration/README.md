# Integration tests

Vitest suite for the LessonKit CLI pipeline. Uses real subprocesses (no mocks for `build` / `package`). Node.js **18+**.

## Run

```bash
npm run build:packages && npm run -w @lessonkit/cli build
npm run test:integration
```

## Coverage

| File | Tests |
| --- | --- |
| `cli-init-build-package.test.ts` | init → install → build → package |
| `cli-package-targets.test.ts` | All LMS targets on golden example |
| `descriptor-parity.test.ts` | `lessonkit.json` ↔ descriptor ↔ App IDs |
| `cli-failures.test.ts` | Invalid manifest, missing dist |
| `showcase-parity.test.ts` | Example apps ID parity |
| `activity-iri.test.ts` | xAPI/cmi5 `activityIri` validation |

Fixtures: [`fixtures/minimal-course/`](https://github.com/eddiethedean/lessonkit/tree/main/integration/fixtures/minimal-course) — rewrites deps to monorepo `file:` URLs.

CI: **Integration (Node 20)** job in [`.github/workflows/checks.yml`](https://github.com/eddiethedean/lessonkit/blob/main/.github/workflows/checks.yml).
