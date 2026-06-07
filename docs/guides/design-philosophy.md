# Design philosophy

Why LessonKit is built the way it is — and what it deliberately is not.

## React-first authoring

LessonKit courses are **Vite + React + TypeScript** applications. Authors compose learning experiences as components (`Course`, `Lesson`, `Quiz`, compound layouts), not as timeline slides in a WYSIWYG editor.

**Why:** Frontend teams already own design systems, accessibility review, and CI. LessonKit meets them where they work instead of forcing a proprietary authoring runtime.

**Not:** A Storyline or Captivate replacement. Teams that need zero code should use vibe-coding prompts or evaluate visual authoring tools.

## Native blocks, not embedded H5P

LessonKit ships **React implementations** inspired by H5P content types. It does **not** embed H5P, import `.h5p` packages, use H5P Hub, or run H5P Core inside exported courses.

**Why:** One bundle, one telemetry path, one accessibility surface, full control over UX and theming.

**Trade-off:** You cannot drop a `.h5p` file into LessonKit or sync from H5P Hub. Map activity types to LessonKit blocks via the [H5P capability map](../project/h5p-capability-map.md) and rebuild in React.

## Identity and telemetry by design

Every scored interaction requires stable IDs (`courseId`, `lessonId`, `checkId`) synchronized between React and `lessonkit.json`. Telemetry events are defined in a **versioned catalog** and mapped to xAPI through `@lessonkit/xapi`.

**Why:** LMS reporting, LRS analytics, and packaging validation all depend on deterministic identity — not runtime-generated UUIDs.

## LXPack packaging layer

Authors build a SPA; `@lessonkit/lxpack` validates the manifest and produces SCORM, xAPI, cmi5, or standalone artifacts. The CLI (`lessonkit package`) is the supported entrypoint.

**Why:** Separate **authoring runtime** (browser SPA) from **LMS interchange** (zip packages, launch parameters, bridge API).

## Accessibility and observability are not optional extras

Components target WCAG 2.1 AA patterns. Production builds enforce observability hooks when telemetry or xAPI delivery is enabled — console sinks are rejected in production unless explicitly opted in.

**Why:** Enterprise adopters need audit trails and failure signals, not silent data loss in the LMS iframe.

## Explicit non-goals

| Non-goal | Alternative |
| --- | --- |
| Visual graph editor for branching | JSX + `BranchingScenario` (graph validated at runtime) |
| H5P interop (`.h5p`, Hub, semantics.json) | Out of scope — native blocks only; see capability map |
| Embedded LMS | Export packages for your existing LMS |
| Guaranteed LMS compatibility without staging tests | [LMS compatibility](../reference/lms-compatibility.md) + your staging environment |

## Related

- [Architecture overview](architecture-overview.md)
- [Enterprise evaluation](enterprise-evaluation.md)
- [Start here](start-here.md)
