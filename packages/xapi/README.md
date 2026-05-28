# `@lessonkit/xapi`

[![CI](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml/badge.svg)](https://github.com/eddiethedean/lessonkit/actions/workflows/checks.yml)
[![npm](https://img.shields.io/npm/v/@lessonkit/xapi.svg)](https://www.npmjs.com/package/@lessonkit/xapi)
[![License](https://img.shields.io/github/license/eddiethedean/lessonkit)](../../LICENSE)

xAPI statement generation primitives.

## Install

```bash
npm install @lessonkit/xapi
```

## Quick example

```ts
import { createXAPIClient } from "@lessonkit/xapi";

const xapi = createXAPIClient({
  transport: (statement) => {
    // Send to your LRS (or queue offline).
    console.log(statement);
  },
});

xapi.completeLesson({ lessonId: "phishing-101", durationMs: 1500, success: true, score: 7, maxScore: 10 });
```

## Notes (0.2.1)

- If the transport throws/rejects, statements are queued in-memory.
- You can call `await xapi.flush()` to retry queued statements.

