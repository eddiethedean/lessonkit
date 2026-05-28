# LessonKit Roadmap

This roadmap turns the product plan and technical spec into an execution plan. It’s intentionally
pragmatic: small, shippable milestones with clear outputs.

## Product lines

| Line | What it is | Primary docs |
|------|------------|--------------|
| **LessonKit (framework)** | React components, telemetry, xAPI, CLI, packaging | [`PLAN.md`](PLAN.md), [`SPEC.md`](SPEC.md) |
| **LessonKit Studio** | Visual authoring on top of the framework + LXPack | [`docs/LessonKit_Studio_PLAN.md`](docs/LessonKit_Studio_PLAN.md), [`docs/LessonKit_Studio_SPEC.md`](docs/LessonKit_Studio_SPEC.md) |

Studio is not a replacement for code-first authoring—it shares the same runtime (`@lessonkit/react`),
export targets, and accessibility/telemetry goals. Packaging and LMS delivery lean on **LXPack** once
the framework adapter exists (see 0.6.0).

**Studio does not start until framework 1.0.0 ships.** All framework milestones (0.1.x through 0.8.0+
and **1.0.0 — Stable public API**) must be complete first. No Studio spikes, packages, or apps in
this repo until that gate is met.

## Key references

- [`PLAN.md`](PLAN.md) — framework product vision and MVP scope
- [`SPEC.md`](SPEC.md) — framework technical spec and requirements
- [`docs/LessonKit_Studio_PLAN.md`](docs/LessonKit_Studio_PLAN.md) — Studio vision, MVP scope, positioning
- [`docs/LessonKit_Studio_SPEC.md`](docs/LessonKit_Studio_SPEC.md) — Studio architecture, schema, editor, exports
- [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](docs/LXPACK_UPGRADES_FOR_LESSONKIT.md) — LXPack interoperability notes

## Status

- **Framework:** **0.3.0** — core components, hooks, telemetry batching, xAPI primitives, provider lifecycle hardening, example + template
- **Studio:** **blocked** — no implementation work until **[1.0.0 — Stable public API (framework)](#100--stable-public-api-framework)** is shipped (see [Studio development gate](#studio-development-gate))
- **Focus (now):** complete framework milestones only (`@lessonkit/react`, analytics, a11y, themes, CLI, LXPack adapter, xAPI packaging, plugins as scoped, then 1.0.0)

## Guiding principles

- **React-first**: author learning experiences as components, not timelines (code or Studio—same output model).
- **Single renderer**: Studio canvas, live preview, and exported apps must share rendering logic (`@lessonkit/react` + Studio renderer).
- **Accessibility-first**: WCAG 2.1 AA target; keyboard + focus management by default in framework and generated experiences.
- **Interop-ready**: analytics primitives now; SCORM/xAPI/cmi5 via LXPack export is additive (framework adapter + Studio codegen).
- **Git-native (Studio)**: projects are Git-backed repos; GitHub App for auth, commits, branching, collaboration.
- **DX matters**: fast local dev, simple project bootstrap, excellent docs.
- **Framework first**: ship a stable, documented framework API before any Studio code (hard gate at 1.0.0).

---

## Framework milestones

### 0.1.x — MVP hardening

#### Goals

- Stabilize the core API surface for `@lessonkit/react`
- Provide real docs and examples for common lesson patterns
- Add minimal tests + CI so changes are safe

#### Deliverables

- **Components**: `Course`, `Lesson`, `Scenario`, `Quiz`, `Reflection`, `KnowledgeCheck`, `ProgressTracker`
- **Hooks**: `useProgress`, `useTracking`, `useQuizState`, `useCompletion`
- **xAPI primitives**: statement generation + transport hooks (`@lessonkit/xapi`)
- **Examples/templates**: Vite React example + template
- **Docs placeholders**: Storybook + Docusaurus stubs

#### Next steps (recommended)

- Add **basic unit tests** for:
  - `Quiz` interactions (answer tracking)
  - `Lesson` lifecycle (start/complete events)
  - xAPI statement shape + transport invocation
- Add **Storybook** for `@lessonkit/react` and at least:
  - `Course/Lesson` layouts
  - `Quiz` states (unanswered / correct / incorrect)
- Decide on a **stable identity model** (blocks Studio export and telemetry consistency):
  - `courseId` / `lessonId` required vs optional
  - how IDs flow into telemetry/xAPI consistently

---

### 0.2.0 — Analytics and tracking system

#### Goals

- Provide a consistent analytics API that works in:
  - “headless” web delivery
  - LMS delivery (SCORM/xAPI)
  - offline / intermittent connectivity

#### Deliverables

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

### 0.3.0 — Accessibility package expansion

#### Goals

- Make accessibility requirements explicit and testable (required for Studio-generated content).

#### Deliverables

- `@lessonkit/accessibility`:
  - focus trap helper (for dialogs/modals if introduced)
  - roving tabindex helper (for custom choice widgets)
  - reduced motion helpers (animation gates)
- Accessibility documentation:
  - keyboard navigation standards for LessonKit components
  - screen-reader announcements for quiz feedback

---

### 0.4.0 — Theme system and design tokens

#### Goals

- Support organizational branding and consistent UI (Studio global/component themes depend on this).

#### Deliverables

- `@lessonkit/themes`:
  - token schema (colors, spacing, typography)
  - CSS variables output contract
  - theme merging + overrides
- `@lessonkit/react`:
  - `ThemeProvider` (or equivalent) with CSS variables
  - default theme + examples

---

### 0.5.0 — CLI: real project workflow

#### Goals

- Make the developer workflow frictionless; align with Studio local dev (`npx lessonkit-studio dev` later).

#### Deliverables

- `@lessonkit/cli`:
  - `lessonkit init` (copy template, install deps, set up scripts)
  - `lessonkit dev` (runs template dev server)
  - `lessonkit build` (production build)
  - `lessonkit package` (placeholder until SCORM arrives; maybe zip for hosting)

---

### 0.6.0 — SCORM (Phase 2 from plan)

#### Goals

- Add LMS compatibility for classic platforms while keeping React-first authoring.

#### Deliverables

- **LXPack integration path (recommended)**: leverage LXPack’s packaging/runtime work rather than reinventing packaging from scratch.
  - Reference: [`eddiethedean/lxpack`](https://github.com/eddiethedean/lxpack) (exports SCORM 1.2, SCORM 2004, xAPI, cmi5, and standalone via `@lxpack/scorm`, `@lxpack/xapi`, `@lxpack/cmi5`)
  - LXPack interoperability notes: [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](docs/LXPACK_UPGRADES_FOR_LESSONKIT.md)
  - Adopt *one* of the strategies below (start with Strategy A).

#### Strategy A — LessonKit → LXPack export adapter (preferred)

Build `@lessonkit/lxpack` to export LessonKit-authored courses into LXPack (`course.yaml` + lesson files) and invoke `lxpack build`.

Deliverables:

- `@lessonkit/lxpack` (new package):
  - convert a LessonKit course definition into an LXPack `course.yaml` + assets bundle
  - optional: emit markdown lessons and/or component lessons compatible with `@lxpack/runtime`
  - wrappers to run `lxpack validate` and `lxpack build --target scorm12|scorm2004`
- Example: LessonKit course that exports to an **LMS-importable ZIP** using LXPack

**Required before Studio (post–framework 1.0):** `@lessonkit-studio/codegen` will call this adapter (Studio 0.3.0).

#### Strategy B — Share runtime primitives (future)

If the ecosystems converge, consider reusing proven runtime/validation pieces:

- Use `@lxpack/validators` for schema validation and path-containment rules
- Reuse `@lxpack/xapi` semantics/transport patterns for statements, queueing, retries

Notes:

- LXPack requires **Node 20+** for authors; LessonKit can remain npm-first while interoperating with published `@lxpack/*` packages.

---

### 0.7.0 — xAPI packaging + LRS integrations

#### Goals

- Support robust xAPI delivery patterns beyond simple statement generation.

#### Deliverables

- **LXPack-aligned exports**:
  - produce xAPI and/or cmi5 packages via LXPack targets (`lxpack build --target xapi|cmi5`)
  - ensure LessonKit completion/quiz semantics map cleanly to xAPI statements
- `@lessonkit/xapi` (native):
  - keep a minimal, framework-level xAPI API for in-browser tracking (non-LMS delivery)
  - optionally adopt transport/queue conventions proven in `@lxpack/xapi`
- Reference example: hosted LessonKit course that reports to an LRS (direct xAPI)

**Required before Studio (post–framework 1.0):** Studio export will include xAPI/cmi5/standalone via LXPack (Studio 0.3.0).

---

### 0.8.0+ — Plugin architecture (future)

Potential plugin areas (from spec):

- AI integrations
- LMS connectors
- Analytics providers
- Assessment engines
- Custom interactions

**Studio (later):** plugin API and marketplace remain post–Studio 1.0 (see Studio future scope).

---

### 1.0.0 — Stable public API (framework)

**Major blocker for LessonKit Studio.** Framework **1.0.0 must ship before any Studio development
begins**—including schema spikes, renderer prototypes, or `lessonkit-studio` packages. Studio milestones
below are **planned sequencing only**; they are not in active development until this section’s criteria
are met and 1.0.0 is released.

#### Criteria to hit before 1.0 (and before Studio)

- Stable component and hook APIs (semver expectations)
- Storybook + docs site live
- SCORM and/or xAPI packaging documented end-to-end
- Accessibility conformance documented (WCAG 2.1 AA target)
- CI with tests + basic e2e coverage (Playwright)
- Framework milestones **0.1.x through 0.7.0** (and scoped **0.8.0+** plugin work planned for 1.0) delivered per this roadmap

#### Gate checklist (framework complete → Studio may start)

| # | Framework milestone | Must be shipped |
|---|---------------------|-----------------|
| 1 | 0.1.x — MVP hardening | Yes |
| 2 | 0.2.0 — Analytics and tracking | Yes |
| 3 | 0.3.0 — Accessibility package | Yes |
| 4 | 0.4.0 — Theme system | Yes |
| 5 | 0.5.0 — CLI project workflow | Yes |
| 6 | 0.6.0 — SCORM / `@lessonkit/lxpack` | Yes |
| 7 | 0.7.0 — xAPI packaging + LRS patterns | Yes |
| 8 | 0.8.0+ — Plugin architecture (as scoped for 1.0) | Yes |
| 9 | **1.0.0 — Stable public API** | **Yes — Studio gate** |

---

## LessonKit Studio milestones

> **Studio development gate:** Do not start Studio implementation until **framework 1.0.0** is
> released. The milestones in this section describe the **intended order after the gate**; they are
> not parallel workstreams with the framework.

Studio is a **visual learning experience builder** on LessonKit + LXPack: drag-and-drop authoring,
Git-backed projects, live preview, and export to React/Vite, LXPack, SCORM, xAPI, cmi5, and standalone
web builds. Full detail: [`docs/LessonKit_Studio_PLAN.md`](docs/LessonKit_Studio_PLAN.md), [`docs/LessonKit_Studio_SPEC.md`](docs/LessonKit_Studio_SPEC.md).

### Studio development gate

1. Ship every **framework** milestone in [Framework milestones](#framework-milestones) through **1.0.0**.
2. Verify the [gate checklist](#gate-checklist-framework-complete--studio-may-start).
3. Only then begin **Studio 0.1.0** (schema and shared renderer).

Until step 3, Studio remains **design/docs only** (`LessonKit_Studio_PLAN.md`, `LessonKit_Studio_SPEC.md`).

### Architecture (target)

```text
+----------------------+
| LessonKit Studio UI  |  apps/studio-web (+ studio-desktop later)
+----------------------+
           |
           v
+----------------------+
| Project Schema Layer |  @lessonkit-studio/schema
+----------------------+
           |
           v
+----------------------+
| React Renderer       |  @lessonkit-studio/renderer → @lessonkit/react
+----------------------+
           |
           v
+----------------------+
| LXPack Integration   |  @lessonkit-studio/codegen → @lessonkit/lxpack
+----------------------+
```

Suggested monorepo layout (when Studio lands in-repo or adjacent repo):

```text
lessonkit-studio/
├── apps/
│   ├── studio-web/
│   └── studio-desktop/     (Tauri, post-MVP)
├── packages/
│   ├── schema/
│   ├── renderer/
│   ├── builder/
│   ├── codegen/
│   ├── github/
│   ├── ai/
│   └── ui/
```

### What framework 1.0.0 must include (for Studio)

These are delivered as part of framework milestones **before** the Studio gate—not optional parallel work:

| Capability | Framework milestone |
|------------|---------------------|
| Stable `courseId` / `lessonId` + telemetry | 0.1.x |
| Analytics, session model, batching | 0.2.0 |
| Focus/roving tabindex, a11y docs | 0.3.0 |
| Theme tokens + CSS variables | 0.4.0 |
| `lessonkit init` / `dev` / `build` | 0.5.0 |
| `@lessonkit/lxpack` SCORM export | 0.6.0 |
| xAPI/cmi5/standalone via LXPack | 0.7.0 |
| Plugin hooks (as scoped) | 0.8.0+ |
| Stable public API + docs + e2e CI | **1.0.0 (gate)** |

---

### Studio 0.1.0 — Schema and shared renderer

#### Goals

- Define the project format and validation pipeline; render schema documents with the same components as exported apps.

#### Deliverables

- **Project layout** (Git-backed):
  - `lessonkit.json`, `src/`, `assets/`, `themes/`
- **`@lessonkit-studio/schema`**:
  - `schemaVersion` (start at **1**); migration hooks (v1 → v2 transforms, validation before render, normalization)
  - JSON document model: `pages[]` with `id` and `blocks[]`
- **`@lessonkit-studio/renderer`**:
  - maps blocks to `@lessonkit/react` (and shared runtime blocks)
  - used by live preview and export (no duplicate render paths)
- **Initial block types** (renderer support): text, heading, image, button, input, container, quiz, scenario (checklist, video stubbed or phased)

---

### Studio 0.2.0 — Visual editor MVP

#### Goals

- Ship a usable canvas: drag/drop, property editing, undo/redo, autosave hooks, live preview.

#### Deliverables

- **`@lessonkit-studio/builder`** + **`@lessonkit-studio/ui`**:
  - canvas (pages, blocks, layouts, interactions) using real React components
  - **drag/drop**: [dnd-kit](https://dndkit.com/) — nested containers, reorder, snap zones, insertion previews
  - **state**: [Zustand](https://zustand-demo.pmnd.rs/) — patch history, schema validation on change
  - **undo/redo**: command/patch stack in-memory (editor-level)
  - property editor for layout, styling, quiz config, basic branching
  - live preview pane (shared renderer)
- **Builder feature set (MVP)**:
  - drag/drop, property editor, undo/redo, autosave (debounced; semantic grouping TBD until GitHub sync)
  - navigation between pages/lessons in preview

#### Technology (from spec)

- React, TypeScript, Vite, Tailwind CSS
- Backend for hosted mode: Node.js + Fastify or NestJS (when `lessonkit.app` needs server APIs)

---

### Studio 0.3.0 — Code generation and export

#### Goals

- Export real artifacts authors can ship; Studio focuses on authoring, LXPack on packaging.

#### Deliverables

- **`@lessonkit-studio/codegen`**:
  - **React/Vite**: `App.tsx`, `components/`, `assets/`, `styles/`
  - **LXPack**: `course.yaml`, lesson assets, metadata (via `@lessonkit/lxpack`)
  - **Static HTML package** (where applicable)
- **Export targets** (end state; SCORM/xAPI/cmi5 via LXPack build):
  - React/Vite application
  - LXPack course package
  - SCORM, xAPI, cmi5, standalone web (via `@lessonkit/lxpack` shipped in framework 0.6.0 / 0.7.0 before Studio starts)
- **Performance**: lazy-loaded blocks; virtualized large pages; fast canvas + instant undo

---

### Studio 0.4.0 — GitHub-native storage

#### Goals

- Git as storage, version control, collaboration, and backup.

#### Deliverables

- **`@lessonkit-studio/github`**:
  - **GitHub App** authentication (create repos, clone templates, commit, branches)
  - project sync: pull latest, autosave → push, branch support
- **Persistent history** (complements in-memory undo):
  - periodic / major-action / explicit-save commits
- **Autosave**: debounced writes; semantic commit grouping; offline recovery (spec requirement)

---

### Studio 0.5.0 — AI-assisted authoring

#### Goals

- AI-native workflows without forking the schema/renderer model.

#### Deliverables

- **`@lessonkit-studio/ai`** workflows:
  - lesson generation from prompts
  - quiz and branching scenario generation
  - storyboard → course conversion
  - course structure refactor suggestions
  - accessibility suggestions on blocks
- **Integrations** (plan): Claude, Cursor, GitHub Copilot; pluggable LLM providers later

---

### Studio 0.6.0 — Hosted web app

#### Goals

- Primary delivery surface for designers and LX teams.

#### Deliverables

- **`apps/studio-web`**: hosted at `lessonkit.app` (target)
- **Local dev**: `npx lessonkit-studio dev` (align with `@lessonkit/cli` where sensible)
- Auth, project list, template gallery (minimal)

---

### Studio 0.7.0 — Desktop (Tauri)

#### Goals

- Offline editing, local filesystem, local export and preview.

#### Deliverables

- **`apps/studio-desktop`**: Tauri shell (Electron alternative only if Tauri blockers)
- local export and preview without hosted backend dependency

---

### Studio — Future scope (non-MVP)

Tracked in [`docs/LessonKit_Studio_PLAN.md`](docs/LessonKit_Studio_PLAN.md); not scheduled on framework semver:

- Real-time multiplayer collaboration
- Timeline / animation editor; video synchronization
- Visual branching graph editor
- Marketplace / community templates
- Plugin ecosystem and LMS cloud hosting
- AI course agents and design agents
- Integrated LMS deployment

---

### Studio 1.0.0 — Criteria (product)

- Visual MVP blocks + quiz/scenario authoring with live preview parity to export
- React/Vite and LXPack export documented end-to-end
- GitHub App sync with autosave and branching
- Generated courses meet framework accessibility standards (WCAG 2.1 AA target)
- At least one AI workflow (e.g. lesson or quiz generation) in production
- SCORM/xAPI/cmi5 export path documented via LXPack (built in framework 0.6.0 / 0.7.0 before Studio gate)

---

## Milestone alignment (framework → Studio)

```text
Phase 1 — Framework only (no Studio code)
────────────────────────────────────────
0.1.x → 0.2.0 → 0.3.0 → 0.4.0 → 0.5.0 → 0.6.0 → 0.7.0 → 0.8.0+ → 1.0.0
                                                              │
                                                              ▼
                                                    STUDIO GATE (blocker)
                                                              │
Phase 2 — Studio only (after 1.0.0)                           │
────────────────────────────────────                          │
Studio 0.1.0 → 0.2.0 → 0.3.0 → 0.4.0 → 0.5.0 → 0.6.0 → 0.7.0 → Studio 1.0.0
```

**No overlap:** framework milestones are not shared with Studio delivery. Studio milestones run
sequentially **only after** framework **1.0.0** is released.
