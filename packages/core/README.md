# @lessonkit/core

[![npm](https://img.shields.io/npm/v/@lessonkit/core.svg)](https://www.npmjs.com/package/@lessonkit/core)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/core.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Headless types, identity helpers, telemetry pipeline, and runtime primitives shared across LessonKit.

## When to install

- Custom headless runtime (no React UI)
- Telemetry plugins, batch pipelines, or custom tracking clients
- Validating IDs, URNs, and manifest fields in your own tooling

Most course authors only need `@lessonkit/react`, which re-exports common APIs.

## Install

```bash
npm install @lessonkit/core
```

Requires Node.js **18+** minimum.

## Usage

```typescript
import {
  buildTelemetryEvent,
  createLessonkitRuntime,
  createTelemetryPipeline,
  createPluginRegistry,
  buildLessonkitUrn,
  validateId,
} from "@lessonkit/core";

const event = buildTelemetryEvent({
  name: "quiz_answered",
  courseId: "my-course",
  lessonId: "lesson-1",
  checkId: "check-1",
  data: { correct: true, score: 1 },
});
```

## Exports

| Area | Key APIs |
| --- | --- |
| Identity | `validateId`, `slugifyId`, `buildLessonkitUrn` |
| Telemetry | `buildTelemetryEvent`, `createTrackingClient`, `createTelemetryPipeline` |
| Runtime | `createLessonkitRuntime`, progress and session helpers |
| Plugins | `createPluginRegistry`, `defineTelemetryPlugin`, `defineAssessmentPlugin` |

Machine-readable: `@lessonkit/core/telemetry-catalog.v3.json` (current; v1–v3 retained), `identity-contract.v1.json`

## Common issues

| Symptom | Fix |
| --- | --- |
| `buildTelemetryEvent` validation error | Ensure `courseId`, `lessonId`, and event-specific IDs match [identity rules](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) |
| Plugin not firing | Register with `createPluginRegistry` and pass plugins in `LessonkitProvider` config |

## Docs

[Core reference](https://lessonkit.readthedocs.io/en/latest/reference/core.html) · [Identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) · [Telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) · [Plugins](https://lessonkit.readthedocs.io/en/latest/reference/plugins.html) · [TypeDoc API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0
