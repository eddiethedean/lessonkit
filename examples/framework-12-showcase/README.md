# Framework 1.2+ / 1.6.x showcase

Canonical **LessonKit** demo course spanning framework **1.2** blocks and the **1.6.x content wave**. Every block added in framework 1.2 appears in a cohesive four-lesson narrative (Atlas Analytics onboarding), plus a fifth in-app lesson for **1.6.x** Tier C/D content blocks.

## Blocks covered

| Category | Components |
| --- | --- |
| Content | `Text`, `Heading`, `Image` |
| Compound | `Page`, `InteractiveBook`, `AssessmentSequence` |
| Presentation (Tier C/D) | `Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider` |
| Assessments | `TrueFalse`, `FillInTheBlanks`, `MarkTheWords`, `DragTheWords`, `DragAndDrop`, `FindHotspot`, `FindMultipleHotspots` |
| **1.6.x content wave** | `Table`, `Timeline`, `ImageSequence`, `Collage` (see `content-wave` lesson) |

Also uses structure blocks: `Course`, `Lesson`, `Scenario`, `ProgressTracker`, `ThemeProvider`.

**1.6.x elsewhere in the monorepo:** `GameMap`, `Crossword`, `WordSearch`, and other Tier E blocks ship in framework **1.6.6** — see the [H5P capability map](https://lessonkit.readthedocs.io/en/latest/project/h5p-capability-map.html) and [block catalog](https://lessonkit.readthedocs.io/en/latest/reference/block-catalog.html).

## single-spa layout

`lessonkit.json` lists **one** LMS shell lesson (`orientation`). Additional in-app steps (`platform-tour`, `analyst-handbook`, `certification`, `content-wave`) exist only in React routing—same pattern as [`lxpack-golden`](../lxpack-golden/).

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
