# Accessibility conformance (interim statement)

LessonKit targets **WCAG 2.1 Level AA** patterns for shipped React blocks. This page is an **interim** statement for enterprise evaluators—not a VPAT or formal conformance report.

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

## What authors are responsible for

- Alt text on images and meaningful `Embed` titles
- Sufficient color contrast when overriding theme tokens
- Caption tracks on `Video` when audio is essential
- Testing representative courses in your LMS shell (iframe focus traps vary by host)

## Roadmap (informal)

1. Expand Storybook a11y checks for all P0 assessment blocks
2. Document known LMS iframe focus limitations per export target
3. Publish a formal accessibility conformance summary when audit scope is funded

## Questions

Open a [GitHub issue](https://github.com/eddiethedean/lessonkit/issues) for accessibility bugs in framework components. For course-specific content, test in your authoring workflow.
