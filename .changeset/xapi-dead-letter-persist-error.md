---
"@lessonkit/xapi": patch
"@lessonkit/react": patch
---

`persistDeadLetterStatement` now invokes optional `onPersistError` (and dev warnings) when sessionStorage is unavailable or throws; wire via `createXAPIClient` `onDeadLetterPersistError` or React `config.observability.onXapiDeadLetterPersistError`.
