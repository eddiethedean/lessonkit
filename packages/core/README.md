# `@lessonkit/core`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![npm](https://img.shields.io/npm/v/@lessonkit/core.svg)](https://www.npmjs.com/package/@lessonkit/core)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

Core types and runtime primitives shared across LessonKit packages.

**Docs:** [Identity reference](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) · [Telemetry reference](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) · [Telemetry & xAPI guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/telemetry-and-xapi.html)

## Install

```bash
npm install @lessonkit/core
```

## What's inside (0.6.0)

- Identity helpers: `validateId`, `slugifyId`, `deriveId`, `buildLessonkitUrn`
- Typed telemetry events (`TelemetryEvent`) and `telemetry-catalog.v1.json`
- Tracking client (`createTrackingClient`) with optional batching
- Session id helper (`createSessionId`)

See the [identity](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) and [telemetry](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) references on Read the Docs.
