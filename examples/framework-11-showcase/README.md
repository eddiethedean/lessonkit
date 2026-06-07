# Framework 1.1 showcase

Canonical **LessonKit 1.1** demo course. Covers the 1.0 foundation plus every assessment block introduced in 1.1—without any 1.2-only compound or Tier C/D components.

## Blocks covered

| Release | Components |
| --- | --- |
| **1.0 foundation** | `Course`, `Lesson`, `Scenario`, `Quiz`, `KnowledgeCheck`, `Reflection`, `ProgressTracker`, `ThemeProvider` |
| **1.1 assessments** | `TrueFalse`, `MarkTheWords`, `FillInTheBlanks`, `DragTheWords`, `DragAndDrop`, `AssessmentSequence` |

Uses block catalog **v2** (`buildBlockCatalog({ version: 2 })`). For 1.2 blocks see [`framework-12-showcase`](../framework-12-showcase/).

## single-spa layout

`lessonkit.json` lists **one** LMS shell lesson (`shift-briefing`). Additional in-app steps exist only in React routing—same pattern as [`lxpack-golden`](../lxpack-golden/).

## Run locally

```bash
npm install && npm run build:packages
npm -w lessonkit-example-framework-11-showcase run dev
```

Package for LMS (injectable MCQ / true-false assessments only; Tier B/C/D blocks run in-SPA and are omitted from `lessonkit.json` `assessments`):

```bash
npm -w lessonkit-example-framework-11-showcase run build
npm -w lessonkit-example-framework-11-showcase run package:scorm12
```

## IDs

React `courseId`, in-app `lessonId`s, and LMS-injectable `checkId`s match [`lessonkit.json`](lessonkit.json). Additional in-SPA-only blocks (`MarkTheWords`, `FillInTheBlanks`, `DragTheWords`, `DragAndDrop`, etc.) use matching `checkId`s in React but are not listed in the manifest because they cannot be injected into the LMS shell.

## Related examples

- [`assessments-p0/`](../assessments-p0/) — minimal P0-only sample (no LMS shell)
- [`framework-12-showcase/`](../framework-12-showcase/) — full 1.2 catalog
