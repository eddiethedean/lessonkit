# Architecture overview

How LessonKit fits together for course authors and evaluators. Maintainer design docs: [PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md) · [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md).

## High-level flow

```text
  Author (React + lessonkit.json)
           │
           ▼
    lessonkit build  ──►  dist/  (Vite SPA)
           │
           ▼
    lessonkit package ──►  SCORM / standalone / xAPI / cmi5
           │
           ▼
         LMS upload
```

At runtime the packaged SPA runs inside an LMS iframe (SCORM/xAPI/cmi5) or standalone. `@lessonkit/react` emits telemetry and xAPI and forwards scores through the LXPack bridge when configured.

## Package boundaries

| Package | Role |
| --- | --- |
| `@lessonkit/react` | UI components, `LessonkitProvider`, hooks |
| `@lessonkit/core` | Headless runtime, identity, telemetry catalog, plugins |
| `@lessonkit/xapi` | Statement mapping, fetch transports, batch sinks |
| `@lessonkit/lxpack` | `lessonkit.json` validation, LXPack packaging adapter |
| `@lessonkit/cli` | `init`, `dev`, `build`, `package` workflow |
| `@lessonkit/themes` | Presets and `--lk-*` design tokens |
| `@lessonkit/accessibility` | Focus trap, roving tabindex, reduced motion |

Course authors typically install **`@lessonkit/react`** + **`@lessonkit/cli`** (devDependency).

## Runtime (browser)

```text
React blocks  ──►  LessonkitProvider
                      ├── telemetry sink / batch  ──►  analytics proxy
                      ├── xAPI queue + transport    ──►  LRS proxy
                      └── lxpackBridge (auto)       ──►  LMS parent frame
```

**Identity:** Stable `courseId`, `lessonId`, and `checkId` values drive telemetry URNs, xAPI activity IDs, and packaging validation.

**Session:** Progress and compound block state can persist in `sessionStorage` (configurable). See [Security policy](../project/security.md) for shared-device guidance.

## Packaging (Node.js)

1. Vite builds the SPA to `dist/`.
2. `@lessonkit/lxpack` validates `lessonkit.json` and React source ID parity.
3. LXPack stages under `.lxpack/course/` and writes artifacts to `.lxpack/course/.lxpack/out/` by default.
4. Output targets: SCORM 1.2/2004, standalone, xAPI, cmi5.

Details: [Packaging reference](../reference/packaging.md) · [CLI reference](../reference/cli.md) · [Export parity](react-developers/export-parity.md).

## When to choose LessonKit

**Good fit:** React/TypeScript teams, custom UX, one codebase → multiple LMS formats, learning engineering (telemetry/xAPI), H5P-like blocks without H5P runtime.

**Poor fit:** WYSIWYG timeline authoring, teams with no frontend capacity, single H5P activity in an LMS bank.

See [FAQ](faq.md#when-should-i-not-use-lessonkit).

## Related reading

- [Glossary](../reference/glossary.md)
- [Identity](../reference/identity.md)
- [Telemetry](../reference/telemetry.md) · [xAPI](../reference/xapi.md)
- [LXPack bridge](../reference/lxpack-bridge.md)
- [Deployment guide](react-developers/deployment-guide.md)
- [LMS compatibility](../reference/lms-compatibility.md)
