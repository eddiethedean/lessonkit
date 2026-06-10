---
"@lessonkit/react": patch
---

Wire `onOverflow` and `onHeadSkipped` on the React provider xAPI queue to `persistDeadLetterStatement`, matching standalone `@lessonkit/xapi` client dead-letter behavior.
