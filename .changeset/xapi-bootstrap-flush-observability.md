---
"@lessonkit/react": patch
---

Bootstrap xAPI `flush()` failures in `LessonkitProvider` now invoke `config.observability.onXapiTransportError` instead of failing silently.
