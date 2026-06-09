# Accessibility conformance (interim statement)

LessonKit targets **WCAG 2.1 Level AA** patterns for shipped React blocks (framework **1.7.x**, block catalog v3). This page is an **interim** statement for enterprise evaluators—not a VPAT or formal conformance report.

## Current status

| Item | Status |
| --- | --- |
| WCAG 2.1 AA target | Design goal for framework components |
| Published VPAT / ACR | **Not available** |
| Third-party audit | Not completed |
| Automated a11y CI gate | Component unit tests + Storybook; no full-page audit in CI |

## What is implemented

- Semantic structure (`Course`, `Lesson`, assessments with labels and live regions)
- Keyboard alternatives for drag-and-drop style blocks
- Focus utilities in `@lessonkit/accessibility` (focus trap, roving tabindex)
- Reduced-motion handling where applicable (e.g. parallax fallbacks)
- Theme tokens (`--lk-*`) for contrast-aware authoring

See [Accessibility reference](../reference/accessibility.md) and [Theming and accessibility](../guides/react-developers/theming-and-accessibility.md).

## Per-block interim status (1.7.x catalog)

Status key: **Implemented** = keyboard + labeled controls in framework code; **Partial** = known gaps or author-dependent content; **Author** = framework provides structure; author must supply accessible content.

| Block | Category | Interim status | Notes |
| --- | --- | --- | --- |
| `Quiz` / `KnowledgeCheck` | Assessment | Implemented | Radio/checkbox group semantics; multi-select **Check** gate (1.7); retry/solutions buttons |
| `SortParagraphs` | Assessment | Implemented | Reorder controls with keyboard Up/Down (1.7) |
| `GuessTheAnswer` | Assessment | Implemented | Text input or reveal-only mode (1.7) |
| `MultimediaChoice` | Assessment | Implemented | Labeled media choices; required `altText` (1.7) |
| `SingleChoiceSet` | Compound | Implemented | Sequential MCQ steps; aggregated score (1.7) |
| `TrueFalse` | Assessment | Implemented | Two-option labeled controls |
| `FillInTheBlanks` | Assessment | Implemented | Inline inputs with labels |
| `DragAndDrop` / `DragTheWords` | Assessment | Implemented | Keyboard alternative paths |
| `BranchingScenario` | Compound | Implemented | Focus on choice navigation (1.5+) |
| `SlideDeck` / `InteractiveBook` | Compound | Implemented | Roving tabindex; resume announcements |
| `InteractiveVideo` | Compound | Implemented | Cue overlays; keyboard pause |
| `Embed` | Content | Partial | Sandboxed iframe; author supplies `title` |
| `Chart` | Content | Implemented | Data table fallback for screen readers |
| `Table` | Content | Implemented | Caption + header cells (1.6) |
| `Timeline` | Content | Implemented | List semantics + focus (1.6) |
| `Crossword` / `WordSearch` | Assessment | Implemented | Grid keyboard nav (1.6) |
| `CombinationLock` | Assessment | Implemented | Digit inputs with labels (1.6) |
| `GameMap` | Compound | Partial | Spatial map UI; stage focus (1.6) |
| `Image` / `Video` | Content | Author | Alt text, captions are author responsibility |
| `AudioRecorder` | Content | Partial | Browser permission UX varies by host (1.6) |

For the full catalog, see [Block catalog](../reference/block-catalog.md). Storybook stories document focus order for representative states.

## What authors are responsible for

- Alt text on images and meaningful `Embed` titles
- Sufficient color contrast when overriding theme tokens
- Caption tracks on `Video` when audio is essential
- Testing representative courses in your LMS shell (iframe focus traps vary by host)

Use the [pre-ship accessibility checklist](../guides/react-developers/theming-and-accessibility.md#pre-ship-accessibility-checklist-course-authors) before LMS upload.

## Roadmap (informal)

1. Expand Storybook a11y checks for all P0 assessment blocks
2. Document known LMS iframe focus limitations per export target
3. Publish a formal accessibility conformance summary (VPAT/ACR) when audit scope is funded

## Questions

Open a [GitHub issue](https://github.com/eddiethedean/lessonkit/issues) for accessibility bugs in framework components. For course-specific content, test in your authoring workflow.
