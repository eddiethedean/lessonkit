# LessonKit E2E / conformance

Playwright tests and packaging conformance scripts for **0.9.x** export parity (completed in **0.9.1**).

## Prerequisites

- **Node.js 20+**
- `unzip` on `PATH` (SCORM unpack)
- From repo root: `npm ci`
- Playwright browsers (first time only):

```bash
npm exec -w @lessonkit/e2e -- playwright install --with-deps chromium
```

## Commands

```bash
# Full Playwright suite (13 tests: golden-vite + telemetry-harness projects)
npm run test:e2e

# Force rebuild of packages, golden dist, harness, and LXPack artifacts
E2E_FORCE_REBUILD=1 npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# LXPack shared conformance matrix (standalone, scorm12, scorm2004, xapi, cmi5)
npm run conformance:lxpack

# Golden example standalone + scorm12 package smoke
npm run conformance:golden

# Optional: limit golden package matrix targets
CONFORMANCE_TARGETS=standalone,scorm12,scorm2004 npm run conformance:golden
```

## Playwright projects

| Project | baseURL | webServer | Specs |
|---------|---------|-----------|-------|
| **golden-vite** | `:4173` | `lessonkit-example-lxpack-golden` preview | `tests/vite/*`, `tests/standalone/*`, `tests/scorm12/*`, `tests/scorm2004/*`, `tests/xapi/*`, `tests/cmi5/*`, `tests/parity/*` |
| **telemetry-harness** | `:4174` | `lessonkit-e2e-telemetry-harness` preview | `tests/telemetry-harness/*` |

## Test catalog

| File | Project | Covers |
|------|---------|--------|
| `tests/vite/keyboard.spec.ts` | golden-vite | Quiz/knowledge check keyboard, lesson nav `aria-current` |
| `tests/vite/telemetry.spec.ts` | golden-vite | Session storage + quiz completion |
| `tests/vite/smoke.spec.ts` | golden-vite | Full sign-off flow on Vite preview |
| `tests/standalone/launch.spec.ts` | golden-vite | Standalone shell native assessments |
| `tests/scorm12/launch.spec.ts` | golden-vite | SCORM 1.2 launch + LMS mock completion |
| `tests/scorm2004/launch.spec.ts` | golden-vite | SCORM 2004 launch + `API_1484_11` mock completion |
| `tests/xapi/launch.spec.ts` | golden-vite | xAPI package shell + native assessments |
| `tests/cmi5/launch.spec.ts` | golden-vite | cmi5 package shell + native assessments |
| `tests/parity/matrix.spec.ts` | golden-vite | Cross-surface parity checklist |
| `tests/telemetry-harness/batching.spec.ts` | telemetry-harness | Telemetry `batchSink` coalescing |
| `tests/telemetry-harness/xapi-queue.spec.ts` | telemetry-harness | xAPI queue + flush after transport recovery |

## Telemetry harness fixture

[`fixtures/telemetry-harness/`](fixtures/telemetry-harness/) is a private Vite app (not published) that exposes `window.__e2e` for batch and xAPI assertions.

Local dev:

```bash
npm run build:packages
npm run build -w lessonkit-e2e-telemetry-harness
npm run preview -w lessonkit-e2e-telemetry-harness -- --port 4174
```

Use `?xapiMode=fail` to start with a failing xAPI transport.

## Artifact layout

`global-setup.ts` writes `e2e/.artifacts/manifest.json`:

| Field | Purpose |
|-------|---------|
| `goldenDistDir` | Built `examples/lxpack-golden/dist` |
| `telemetryHarnessDistDir` | Built harness `dist/` |
| `standaloneDir` | Packaged standalone output |
| `scorm12Zip` | SCORM 1.2 ZIP path |
| `scorm12UnpackedDir` | Unzipped SCORM tree for static server |
| `scorm12LaunchUrl` | Resolved launch file (`file://` URL) |
| `scorm2004Zip` / `scorm2004UnpackedDir` | SCORM 2004 package + unzip tree |
| `xapiZip` / `xapiUnpackedDir` | xAPI package + unzip tree |
| `cmi5Zip` / `cmi5UnpackedDir` | cmi5 package + unzip tree |

## SCORM mock

Tests inject a SCORM 1.2 `window.API` before navigation. Debug in the browser console:

- `window.__scorm12Test.store` — CMI element values
- `window.__scorm12Test.log` — `LMSSetValue` call history

Implementation: [`support/scorm/`](support/scorm/).

## CI

The **Integration**, **E2E**, and **Packaging smoke** jobs in [`.github/workflows/checks.yml`](../.github/workflows/checks.yml) run on Node 20. Vitest integration tests live in [`integration/`](../integration/). See [export parity guide](../docs/guides/react-developers/export-parity.md) for the full CI job map.
