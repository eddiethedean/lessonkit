# Export parity (React / Vite vs LMS)

LessonKit **0.9.1** completes the **0.9.x conformance harness**: Playwright export parity, packaging matrices, and contributor docs for running them locally and in CI.

## Surfaces

| Surface | What it is | How we test |
|---------|------------|-------------|
| **Vite preview** | `npm run dev` / `vite preview` on your React app | Playwright **golden-vite** project on `examples/lxpack-golden` |
| **Telemetry harness** | Minimal React app for batch/xAPI behavior | Playwright **telemetry-harness** project on `e2e/fixtures/telemetry-harness` |
| **Standalone** | LXPack `standalone` output (shell + SPA iframe) | Static server + Playwright |
| **SCORM 1.2** | ZIP for LMS upload | Unzip + launch HTML with injected SCORM 1.2 `API` mock |

## Conformance matrix

| Surface | Playwright / script | Guarantee |
|---------|---------------------|-----------|
| Vite (golden) | `tests/vite/keyboard.spec.ts` | Quiz and knowledge check reachable by keyboard; lesson nav activatable |
| Vite (golden) | `tests/vite/telemetry.spec.ts` | Session id persisted; quiz completion feedback |
| Vite (golden) | `tests/vite/smoke.spec.ts` | Sign-off assessments complete |
| Vite (harness) | `tests/telemetry-harness/batching.spec.ts` | `batchSink` receives coalesced events after manual flush |
| Vite (harness) | `tests/telemetry-harness/xapi-queue.spec.ts` | Failed transport queues statements; flush delivers after mode ok |
| Standalone | `tests/standalone/launch.spec.ts`, `tests/parity/matrix.spec.ts` | Native assessment shell completes |
| SCORM 1.2 | `tests/scorm12/launch.spec.ts`, `tests/parity/matrix.spec.ts` | LMS API mock receives status/score updates |
| All LMS packages | `npm run conformance:lxpack` | `@lxpack/conformance` validate + build (standalone, scorm12, scorm2004, xapi, cmi5) |
| Golden artifacts | `npm run conformance:golden` | `examples/lxpack-golden` produces standalone dir + scorm12 zip |

## What is guaranteed (0.9.1)

For the reference course (`examples/lxpack-golden`):

- Sign-off step loads in the SPA on Vite, standalone, and SCORM 1.2 surfaces.
- Quiz `safety-check` accepts the correct answer and shows success feedback.
- Knowledge check `ppe-acknowledgment` accepts the confirm choice.
- **SCORM 1.2:** LMS API mock receives status/score `SetValue` calls after interaction (see `e2e/support/scorm/`).

For the telemetry harness (`e2e/fixtures/telemetry-harness`):

- Telemetry batching delivers multiple events in one `batchSink` call when flushed.
- xAPI statements queue when transport fails and flush after transport succeeds.

## What is not guaranteed yet

- **SCORM 2004** browser launch (packaging only via `@lxpack/conformance`).
- **xAPI / cmi5** browser launch in Playwright.
- Bit-identical DOM or CSS across surfaces (themes should match via interchange `runtime`, but layout is shell-specific).
- Multi-lesson `per-lesson-spa` CLI packaging (use `@lessonkit/lxpack` directly).

## SCORM 1.2 artifact layout

After `lessonkit package --target scorm12`:

```
.lxpack/course/.lxpack/out/course-scorm12.zip
  imsmanifest.xml          # first <resource href="..."> is the launch file
  <launch>.html            # LXPack shell; hosts SPA in <iframe>
  dist/                    # Vite build (single-spa)
  ...
```

E2E resolves the launch file from `imsmanifest.xml`, injects `window.API`, then drives assessments in the LXPack shell.

## Run locally

```bash
npm ci
npm exec -w @lessonkit/e2e -- playwright install --with-deps chromium
npm run test:e2e
npm run conformance:lxpack
npm run conformance:golden
```

See [`e2e/README.md`](../../../e2e/README.md) for the test catalog, artifact layout, and debugging.

## CI job map

| GitHub Actions job | Node | Commands (equivalent) |
|--------------------|------|------------------------|
| Checks (matrix) | 18, 20 | `npm run build`, `typecheck`, `test`, `coverage` |
| Docs (Sphinx) | 20 | `build-docs-demos.sh`, `sphinx-build -W` |
| Packaging smoke | 20 | golden `package:scorm12` / `standalone`, `conformance:lxpack`, `conformance:golden` |
| E2E (Playwright) | 20 | `playwright install`, `npm run test:e2e` |
| Security (npm audit) | 20 | `npm run audit:ci` |

Workflow: [`.github/workflows/checks.yml`](https://github.com/eddiethedean/lessonkit/blob/main/.github/workflows/checks.yml)

## Related

- [Packaging and CLI](packaging-and-cli.md)
- [Contributing — E2E and conformance](contributing-to-the-monorepo.md#e2e-and-conformance)
- [STUDIO_READINESS.md](../../STUDIO_READINESS.md) — 0.9.x checklist
- [LXPack upgrade plan](../../LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md)
