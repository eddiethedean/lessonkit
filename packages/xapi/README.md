# `@lessonkit/xapi`

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

## Notes (0.2.0)

- If the transport throws/rejects, statements are queued in-memory.
- You can call `await xapi.flush()` to retry queued statements.

