# Export parity (React / Vite vs LMS)

LessonKit **0.9.0** adds a conformance harness that proves the same golden course behaves consistently across delivery surfaces.

## Surfaces

| Surface | What it is | How we test |
|---------|------------|-------------|
| **Vite preview** | `npm run dev` / `vite preview` on your React app | Playwright against `examples/lxpack-golden` |
| **Standalone** | LXPack `standalone` output (shell + SPA iframe) | Static server + Playwright in iframe |
| **SCORM 1.2** | ZIP for LMS upload | Unzip + launch HTML with injected SCORM 1.2 `API` mock |

## What is guaranteed (0.9.0)

For the reference course (`examples/lxpack-golden`):

- Sign-off step loads in the SPA on all three surfaces.
- Quiz `safety-check` accepts the correct answer and shows success feedback.
- Knowledge check `ppe-acknowledgment` accepts the confirm choice.
- **Standalone:** parent `lxpackBridge.v1.submitAssessment` is invoked after quiz completion.
- **SCORM 1.2:** LMS API mock receives status/score `SetValue` calls after interaction (see `e2e/support/scorm/`).

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

E2E resolves the launch file from `imsmanifest.xml`, injects `window.API`, then drives the iframe SPA with the same flow as Vite.

## Run locally

```bash
npm ci
npm run test:e2e
npm run conformance:lxpack
npm run conformance:golden
```

See [`e2e/README.md`](../../../e2e/README.md) for debugging Playwright and SCORM mocks.

## Related

- [Packaging and CLI](packaging-and-cli.md)
- [STUDIO_READINESS.md](../../STUDIO_READINESS.md) — 0.9.x checklist
- [LXPack upgrade plan](../../LXPACK_UPGRADE_PLAN_FOR_MAINTAINERS.md)
