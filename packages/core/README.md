# `@lessonkit/core`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![npm](https://img.shields.io/npm/v/@lessonkit/core.svg)](https://www.npmjs.com/package/@lessonkit/core)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Core types and headless runtime primitives shared across LessonKit packages.

**Docs:** [Core reference](https://lessonkit.readthedocs.io/en/latest/reference/core.html) · [Identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) · [Telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html)

## Install

```bash
npm install @lessonkit/core
```

## What's inside (1.0.0)

- **Identity:** `validateId`, `slugifyId`, `deriveId`, `buildLessonkitUrn`
- **Telemetry:** `buildTelemetryEvent`, `createTelemetryPipeline`, `createTrackingClient`
- **Runtime:** `createLessonkitRuntime`, progress/session helpers
- **Plugins:** `createPluginRegistry`, `defineTelemetryPlugin`, `defineAssessmentPlugin`

```typescript
import {
  buildTelemetryEvent,
  createLessonkitRuntime,
  createPluginRegistry,
  defineTelemetryPlugin,
} from "@lessonkit/core";
```

See the [core reference](https://lessonkit.readthedocs.io/en/latest/reference/core.html) on Read the Docs.
