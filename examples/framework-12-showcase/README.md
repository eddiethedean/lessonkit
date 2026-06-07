# Framework 1.2 showcase

Canonical **LessonKit 1.2** demo course. Every block added in framework 1.2 appears in a cohesive four-lesson narrative (Atlas Analytics onboarding).

## Blocks covered

| Category | Components |
| --- | --- |
| Content | `Text`, `Heading`, `Image` |
| Compound | `Page`, `InteractiveBook`, `AssessmentSequence` |
| Presentation (Tier C/D) | `Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider` |
| Assessments | `TrueFalse`, `FillInTheBlanks`, `MarkTheWords`, `DragTheWords`, `DragAndDrop`, `FindHotspot`, `FindMultipleHotspots` |

Also uses pre-1.2 structure blocks: `Course`, `Lesson`, `Scenario`, `ProgressTracker`, `ThemeProvider`.

## single-spa layout

`lessonkit.json` lists **one** LMS shell lesson (`orientation`). Additional in-app steps (`platform-tour`, `analyst-handbook`, `certification`) exist only in React routing—same pattern as [`lxpack-golden`](../lxpack-golden/).

## Run locally

From the monorepo root:

```bash
npm install && npm run build:packages
npm -w lessonkit-example-framework-12-showcase run dev
```

Package for LMS (injectable true-false assessments only; other block types run in-SPA and are omitted from `lessonkit.json` `assessments`):

```bash
npm -w lessonkit-example-framework-12-showcase run build
npm -w lessonkit-example-framework-12-showcase run package:scorm12
```

## IDs

React `courseId`, in-app `lessonId`s, and LMS-injectable `checkId`s match [`lessonkit.json`](lessonkit.json). Additional in-SPA-only blocks use matching `checkId`s in React but are not listed in the manifest because they cannot be injected into the LMS shell.

## Related examples

- [`framework-11-showcase/`](../framework-11-showcase/) — full 1.1 foundation + P0 assessments
- [`interactive-book/`](../interactive-book/) — compound containers only
- [`assessments-p0/`](../assessments-p0/) — minimal P0 sample
