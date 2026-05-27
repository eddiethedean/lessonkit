# LessonKit Roadmap

This roadmap turns the product plan and technical spec into an execution plan. It’s intentionally
pragmatic: small, shippable milestones with clear outputs.

Key references:

- [`PLAN.md`](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md)
- [`SPEC.md`](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md)

## Status

- Current: **0.1.0** (MVP scaffolding)
- Focus: make the core React-first authoring experience solid before packaging/interop.

## Guiding principles

- **React-first**: author learning experiences as components, not timelines.
- **Accessibility-first**: WCAG 2.1 AA target; keyboard + focus management by default.
- **Interop-ready**: build analytics primitives now so SCORM/xAPI packaging is additive later.
- **DX matters**: fast local dev, simple project bootstrap, excellent docs.

---

## 0.1.x — MVP hardening (now)

### Goals

- Stabilize the core API surface for `@lessonkit/react`
- Provide real docs and examples for common lesson patterns
- Add minimal tests + CI so changes are safe

### Deliverables

- **Components**: `Course`, `Lesson`, `Scenario`, `Quiz`, `Reflection`, `KnowledgeCheck`,
  `ProgressTracker`
- **Hooks**: `useProgress`, `useTracking`, `useQuizState`, `useCompletion`
- **xAPI primitives**: statement generation + transport hooks (`@lessonkit/xapi`)
- **Examples/templates**: Vite React example + template
- **Docs placeholders**: Storybook + Docusaurus stubs

### Next steps (recommended)

- Add **basic unit tests** for:
  - `Quiz` interactions (answer tracking)
  - `Lesson` lifecycle (start/complete events)
  - xAPI statement shape + transport invocation
- Add **Storybook** for `@lessonkit/react` and at least:
  - `Course/Lesson` layouts
  - `Quiz` states (unanswered / correct / incorrect)
- Decide on a **stable identity model**:
  - courseId/lessonId required vs optional
  - how IDs flow into telemetry/xAPI consistently

---

## 0.2.0 — Analytics and tracking system

### Goals

- Provide a consistent analytics API that works in:
  - “headless” web delivery
  - LMS delivery (SCORM/xAPI)
  - offline / intermittent connectivity

### Deliverables

- `@lessonkit/core`:
  - richer event model (time-on-task, branching, completion)
  - session model (start/end, user metadata, attempt ids)
- `@lessonkit/react`:
  - explicit runtime configuration (provider-level config)
  - opt-in telemetry sinks and batching
- `@lessonkit/xapi`:
  - offline queue abstraction (in-memory + pluggable persistence)
  - richer verbs and results (scores, success, duration)

---

## 0.3.0 — Accessibility package expansion

### Goals

- Make accessibility requirements explicit and testable.

### Deliverables

- `@lessonkit/accessibility`:
  - focus trap helper (for dialogs/modals if introduced)
  - roving tabindex helper (for custom choice widgets)
  - reduced motion helpers (animation gates)
- Accessibility documentation:
  - keyboard navigation standards for LessonKit components
  - screen-reader announcements for quiz feedback

---

## 0.4.0 — Theme system and design tokens

### Goals

- Support organizational branding and consistent UI.

### Deliverables

- `@lessonkit/themes`:
  - token schema (colors, spacing, typography)
  - CSS variables output contract
  - theme merging + overrides
- `@lessonkit/react`:
  - `ThemeProvider` (or equivalent) with CSS variables
  - default theme + examples

---

## 0.5.0 — CLI: real project workflow

### Goals

- Make the developer workflow frictionless.

### Deliverables

- `@lessonkit/cli`:
  - `lessonkit init` (copy template, install deps, set up scripts)
  - `lessonkit dev` (runs template dev server)
  - `lessonkit build` (production build)
  - `lessonkit package` (placeholder until SCORM arrives; maybe zip for hosting)

---

## 0.6.0 — SCORM (Phase 2 from plan)

### Goals

- Add LMS compatibility for classic platforms while keeping React-first authoring.

### Deliverables

- **LXPack integration path (recommended)**: leverage LXPack’s packaging/runtime work rather than
  reinventing packaging from scratch.
  - Reference: [`eddiethedean/lxpack`](https://github.com/eddiethedean/lxpack) (exports SCORM 1.2,
    SCORM 2004, xAPI, cmi5, and standalone via `@lxpack/scorm`, `@lxpack/xapi`, `@lxpack/cmi5`)
  - LXPack interoperability notes: [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](https://github.com/eddiethedean/lessonkit/blob/main/docs/LXPACK_UPGRADES_FOR_LESSONKIT.md) (implemented in LXPack 0.4.0; focus is now adapter + examples)
  - Adopt *one* of the strategies below (start with Strategy A).

#### Strategy A — LessonKit → LXPack export adapter (preferred)

Build a new package `@lessonkit/lxpack` that can export LessonKit-authored courses into an LXPack
course project (generating `course.yaml` + lesson files) and then invoke `lxpack build`.

Deliverables:

- `@lessonkit/lxpack` (new package):
  - convert a LessonKit course definition into an LXPack `course.yaml` + assets bundle
  - optional: emit markdown lessons and/or component lessons compatible with `@lxpack/runtime`
  - wrappers to run `lxpack validate` and `lxpack build --target scorm12|scorm2004`
- Example: LessonKit course that exports to an **LMS-importable ZIP** using LXPack

#### Strategy B — Share runtime primitives (future)

If the ecosystems converge, consider reusing proven runtime/validation pieces:

- Use `@lxpack/validators` for schema validation and path-containment rules
- Reuse `@lxpack/xapi` semantics/transport patterns for statements, queueing, retries

Notes:

- LXPack requires **Node 20+** for authors and uses **pnpm** for its repo development; LessonKit can
  remain npm-first while still interoperating with the published `@lxpack/*` packages.

---

## 0.7.0 — xAPI packaging + LRS integrations

### Goals

- Support robust xAPI delivery patterns beyond simple statement generation.

### Deliverables

- **LXPack-aligned exports**:
  - produce xAPI and/or cmi5 packages via LXPack targets (`lxpack build --target xapi|cmi5`)
  - ensure LessonKit completion/quiz semantics map cleanly to xAPI statements
- `@lessonkit/xapi` (native):
  - keep a minimal, framework-level xAPI API for in-browser tracking (non-LMS delivery)
  - optionally adopt transport/queue conventions proven in `@lxpack/xapi`
- Reference example: hosted LessonKit course that reports to an LRS (direct xAPI)

---

## 0.8.0+ — Plugin architecture (future)

Potential plugin areas (from spec):

- AI integrations
- LMS connectors
- Analytics providers
- Assessment engines
- Custom interactions

---

## 1.0.0 — Stable public API

### Criteria to hit before 1.0

- Stable component and hook APIs (semver expectations)
- Storybook + docs site live
- SCORM and/or xAPI packaging documented end-to-end
- Accessibility conformance documented (WCAG 2.1 AA target)
- CI with tests + basic e2e coverage (Playwright)

