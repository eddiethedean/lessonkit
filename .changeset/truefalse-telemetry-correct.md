---
"@lessonkit/react": patch
---

TrueFalse `assessment_answered` telemetry now reports factual answer correctness (`response === answer`) instead of the plugin pass flag, matching Quiz semantics. UI feedback and completion scores still respect `scoreAssessment` plugins.
