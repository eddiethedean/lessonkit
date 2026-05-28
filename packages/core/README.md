# `@lessonkit/core`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml)
[![npm](https://img.shields.io/npm/v/@lessonkit/core.svg)](https://www.npmjs.com/package/@lessonkit/core)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../../LICENSE)

Core types and runtime primitives shared across LessonKit packages.

## Install

```bash
npm install @lessonkit/core
```

## What’s inside (0.5.0)

- Identity helpers: `validateId`, `slugifyId`, `deriveId`, `buildLessonkitUrn`
- Typed telemetry events (`TelemetryEvent`) and `telemetry-catalog.v1.json`
- Tracking client (`createTrackingClient`) with optional batching
- Session id helper (`createSessionId`)

See [`docs/IDENTITY.md`](../../docs/IDENTITY.md) and [`docs/TELEMETRY.md`](../../docs/TELEMETRY.md).

