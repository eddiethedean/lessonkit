# E2E & conformance

Playwright export-parity tests and LXPack conformance scripts. Node.js **18+**.

## Setup

```bash
npm ci
npm exec -w @lessonkit/e2e -- playwright install --with-deps chromium
```

Requires `unzip` on PATH for SCORM tests.

## Commands

```bash
npm run test:e2e              # 13 Playwright specs
npm run test:e2e:ui           # interactive mode
npm run conformance:lxpack    # all LMS targets
npm run conformance:golden    # golden example smoke
E2E_FORCE_REBUILD=1 npm run test:e2e   # rebuild artifacts
```

## Projects

| Project | Port | Specs |
| --- | --- | --- |
| **golden-vite** | 4173 | Vite preview, SCORM, standalone, xAPI, cmi5, parity |
| **telemetry-harness** | 4174 | Batch sink, xAPI queue recovery |

Artifacts: `e2e/.artifacts/manifest.json` (written by `global-setup.ts`).

Harness dev: `npm run build -w lessonkit-e2e-telemetry-harness && npm run preview -w lessonkit-e2e-telemetry-harness -- --port 4174`

See [export parity guide](https://github.com/eddiethedean/lessonkit/blob/main/docs/guides/react-developers/export-parity.md).
