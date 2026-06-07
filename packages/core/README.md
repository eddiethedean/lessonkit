# @lessonkit/core

[![npm](https://img.shields.io/npm/v/@lessonkit/core.svg)](https://www.npmjs.com/package/@lessonkit/core)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/reference/core.html)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Headless types, identity helpers, telemetry pipeline, and runtime primitives shared across LessonKit.

## Install

```bash
npm install @lessonkit/core
```

## Usage

```typescript
import {
  buildTelemetryEvent,
  createLessonkitRuntime,
  createTelemetryPipeline,
  createPluginRegistry,
  buildLessonkitUrn,
} from "@lessonkit/core";
```

## Exports

| Area | Key APIs |
| --- | --- |
| Identity | `validateId`, `slugifyId`, `buildLessonkitUrn` |
| Telemetry | `buildTelemetryEvent`, `createTrackingClient`, `createTelemetryPipeline` |
| Runtime | `createLessonkitRuntime`, progress and session helpers |
| Plugins | `createPluginRegistry`, `defineTelemetryPlugin`, `defineAssessmentPlugin` |

Machine-readable: `@lessonkit/core/telemetry-catalog.v3.json` (current; v1–v3 retained), `identity-contract.v1.json`

## Docs

[Core reference](https://lessonkit.readthedocs.io/en/latest/reference/core.html) · [Identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) · [Telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) · [Plugins](https://lessonkit.readthedocs.io/en/latest/reference/plugins.html) · [TypeDoc API index](https://lessonkit.readthedocs.io/en/latest/reference/api.html)

## License

Apache-2.0
