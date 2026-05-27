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

xapi.completeLesson({ lessonId: "phishing-101" });
```

