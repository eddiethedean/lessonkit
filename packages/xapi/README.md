# `@lessonkit/xapi`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/ci.yml)
[![Documentation](https://readthedocs.org/projects/lessonkit/badge/?version=latest)](https://lessonkit.readthedocs.io/en/latest/)
[![npm](https://img.shields.io/npm/v/@lessonkit/xapi.svg)](https://www.npmjs.com/package/@lessonkit/xapi)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)

xAPI statement generation primitives.

**Docs:** [xAPI reference](https://lessonkit.readthedocs.io/en/latest/reference/xapi.html) · [Telemetry reference](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) · [Telemetry & xAPI guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/telemetry-and-xapi.html)

## Install

```bash
npm install @lessonkit/xapi
```

## Quick example

```ts
import { createXAPIClient } from "@lessonkit/xapi";

const xapi = createXAPIClient({
  courseId: "cyber-basics",
  transport: (statement) => {
    console.log(statement);
  },
});

xapi.completeLesson({ lessonId: "phishing-101", durationMs: 1500, success: true, score: 7, maxScore: 10 });
```

Prefer mapping from telemetry: `telemetryEventToXAPIStatement(event)` (canonical object URNs).

## Notes (1.0.0)

- `createXAPIClient` requires `courseId` for lifecycle helpers; React uses the mapper after each `track()`.
- If the transport throws/rejects, statements are queued in-memory.
- Call `await xapi.flush()` to retry queued statements.

See the [telemetry reference](https://lessonkit.readthedocs.io/en/latest/reference/telemetry.html) and [identity reference](https://lessonkit.readthedocs.io/en/latest/reference/identity.html) for URNs and event mapping.
