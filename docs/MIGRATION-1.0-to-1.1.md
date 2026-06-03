# Migrating from LessonKit 1.0.x to 1.1.0

## Summary

| Area | 1.0.x | 1.1.0 |
| --- | --- | --- |
| Assessment blocks | `Quiz`, `KnowledgeCheck` | + `TrueFalse`, `FillInTheBlanks`, `DragAndDrop`, `DragTheWords`, `MarkTheWords`, `AssessmentSequence` |
| Assessment contract | Implicit via `Quiz` | `AssessmentHandle` on scored blocks |
| Telemetry | `quiz_*` only | + `assessment_*` (new blocks); `quiz_*` unchanged |
| Block catalog | v1 JSON | v2 JSON (`buildBlockCatalog({ version: 2 })` default) |
| `lessonkit.json` assessments | MCQ shape | Optional `kind`: `trueFalse`, `fillInBlanks` |

## Additive API

Import new components from `@lessonkit/react`:

```tsx
import {
  TrueFalse,
  FillInTheBlanks,
  DragAndDrop,
  DragTheWords,
  MarkTheWords,
  AssessmentSequence,
} from "@lessonkit/react";
```

All scored blocks require `checkId` and must live inside `<Lesson>`.

## Block catalog v2

Generators should import `@lessonkit/react/block-catalog.v2.json` or call `buildBlockCatalog({ version: 2 })`. v1 catalog remains available:

```ts
import { buildBlockCatalog } from "@lessonkit/react";

const v1 = buildBlockCatalog({ version: 1 });
```

## Manifest assessments

MCQ (default when `kind` omitted):

```json
{
  "checkId": "quiz-1",
  "question": "Pick one",
  "choices": ["A", "B"],
  "answer": "B"
}
```

True/False (packaged as two-choice MCQ for LMS shell):

```json
{
  "kind": "trueFalse",
  "checkId": "tf-1",
  "question": "Statement text",
  "answer": false
}
```

Fill in the Blanks (SPA scoring; not injected into LMS shell in 1.1.0):

```json
{
  "kind": "fillInBlanks",
  "checkId": "fib-1",
  "question": "Safety phrase",
  "template": "Report issues to *security*."
}
```

## Telemetry

New blocks emit `assessment_answered` and `assessment_completed` with `data.interactionType`. Existing `Quiz` components continue to emit `quiz_answered` / `quiz_completed`.

## Breaking changes

None for existing `Quiz`-only courses. Pin `^1.0.2` if you need to stay on the 1.0 line until you adopt new blocks.
