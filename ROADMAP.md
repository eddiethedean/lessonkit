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

**Studio does not start until framework 1.0.0 ships.** Framework **1.0.0 — Stable public API** is complete; Studio milestones below may begin.

## Key references

- [`PLAN.md`](PLAN.md) — framework product vision and MVP scope
- [`SPEC.md`](SPEC.md) — framework technical spec and requirements
- [`docs/LessonKit_Studio_PLAN.md`](docs/LessonKit_Studio_PLAN.md) — Studio vision, MVP scope, positioning
- [`docs/LessonKit_Studio_SPEC.md`](docs/LessonKit_Studio_SPEC.md) — Studio architecture, schema, editor, exports
- [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](docs/LXPACK_UPGRADES_FOR_LESSONKIT.md) — LXPack interoperability notes

## Status

- **Framework:** **1.0.2** — stable public API (contributor DX, session storage hardening, Vitest 4)
- **Studio:** **unblocked** — framework gate met; see [Studio milestones](#lessonkit-studio-milestones)
- **Focus (now):** LessonKit Studio 0.1.x planning and implementation

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
- **Docs placeholders**: Storybook + Read the Docs (Sphinx) — **shipped in 1.0.0**

#### Status (1.0.0)

The 0.1.x deliverables above are **complete**. Identity v1 (`courseId`, `lessonId`, `checkId`) is required and normalized at runtime. Unit tests, Storybook, and the block catalog ship in the monorepo. See [CHANGELOG.md](CHANGELOG.md).

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

### 0.4.x — Theme system + design tokens (framework contract)

#### Goals

- Support organizational branding and consistent UI for **developers**, **AI code generators**, and later **Studio**.
- Establish a stable theme contract that survives export targets (React/Vite and LXPack artifacts).

#### Deliverables

- `@lessonkit/themes`:
  - token schema v1 (colors, spacing, typography, radii, shadows)
  - CSS variables output contract (namespacing + required variables)
  - theme merging + overrides (predictable precedence rules)
- `@lessonkit/react`:
  - `ThemeProvider` (or equivalent) that binds tokens → CSS variables
  - default theme + example overrides (light/dark, brand variant)
- **AI/dev readiness**:
  - theming surface is **documented and enumerable** (a generator can discover what is themeable without reading source)
- **Parity requirement**:
  - React/Vite apps use the `--lk-*` contract via `ThemeProvider` (0.4.0)
  - LXPack-packaged artifact parity ships with `@lessonkit/lxpack` in **0.6.x**

---

### 0.5.x — Deterministic identity model (framework contract) — **shipped in 0.5.0**

See [`docs/IDENTITY.md`](docs/IDENTITY.md) and [`docs/TELEMETRY.md`](docs/TELEMETRY.md).

---

### 0.6.x — Export surfaces + LXPack adapter (packaging parity)

#### Goals

- Ship LMS-compatible artifacts without forcing authors out of React.
- Make packaging scriptable and deterministic for CI and future Studio export.

#### Deliverables

- `@lessonkit/lxpack` (new package):
  - export a LessonKit-authored course into an LXPack project/interchange
  - invoke LXPack via **programmatic APIs** where possible (avoid subprocess stdout parsing)
  - codify mapping: `courseId` / `lessonId` / assessment IDs → LXPack ids
- Golden end-to-end example:
  - LessonKit course → LXPack build → **importable SCORM ZIP** + runnable standalone build
- CI smoke test:
  - builds the golden example and validates artifacts
- References:
  - LXPack interoperability checklist: [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](docs/LXPACK_UPGRADES_FOR_LESSONKIT.md)

---

### 0.7.x — CLI workflow for developers and AI (and later Studio)

#### Goals

- Make the developer workflow frictionless, reproducible, and generator-friendly.
- Provide a stable command surface that Studio can call later (post-1.0) without inventing a parallel toolchain.

#### Deliverables

- `@lessonkit/cli`:
  - `lessonkit init` (copy template, install deps, set up scripts)
  - `lessonkit dev` (runs template dev server)
  - `lessonkit build` (production build)
  - `lessonkit package` as the canonical **dual export** entrypoint:
    - `--target react-vite` (build/export web artifact)
    - `--target lxpack|scorm12|scorm2004|xapi|cmi5` (via `@lessonkit/lxpack`)
- **AI/dev readiness**:
  - deterministic output layouts and stable defaults so CI and codegen can rely on them

---

### 0.8.x — Runtime block catalog + renderer parity (framework-side)

#### Goals

- Define the set of primitives that are safe to generate (AI) and safe to map (Studio), without building Studio.
- Ensure each primitive’s behavior is specified for accessibility, theming, and telemetry.

#### Deliverables

- `@lessonkit/react`:
  - runtime block catalog v1 (framework-owned) describing primitives and their supported props/behaviors
  - each catalog entry includes:
    - a11y behavior contract
    - theming surface contract
    - telemetry semantics
- **AI/dev readiness**:
  - catalog is **machine-readable** (JSON export) so generators can validate inputs and avoid unsupported combinations
- **Documentation**:
  - reference page for the runtime block catalog (`docs/reference/block-catalog.md`) — props, a11y/theming/telemetry contracts per block
  - catalog JSON schema or export path documented for generators (linked from vibe-coding and React developer guides)
  - update [`docs/STUDIO_READINESS.md`](docs/STUDIO_READINESS.md) 0.8.x checklist as catalog items ship
  - examples demonstrate every catalog block (at least one reference course)

---

### 0.9.x — Conformance harness (export parity + gate hardening)

#### Goals

- Prove that LessonKit behaves the same across export surfaces (React/Vite vs LXPack/LMS artifacts).
- Make the 1.0.0 Studio gate measurable.

#### Deliverables

- Playwright e2e for:
  - keyboard navigation + focus flows (a11y)
  - telemetry batching + xAPI queue behavior
  - packaging artifact smoke (standalone + SCORM launch)
- Conformance matrix:
  - asserts behavioral equivalence across export targets for the same course
- Link the checklist:
  - `docs/STUDIO_READINESS.md` (framework readiness checklist for Studio and AI/dev workflows)
- **Documentation**:
  - export parity guide for authors (`docs/guides/react-developers/export-parity.md` or equivalent) — what is guaranteed across React/Vite vs LMS targets
  - conformance matrix documented (what is tested, how to run locally, CI expectations)
  - contributor docs for Playwright e2e and packaging smoke tests
  - update [`docs/STUDIO_READINESS.md`](docs/STUDIO_READINESS.md) 0.9.x checklist as harness items ship

---

### 0.8.0+ — Plugin architecture

**Shipped (v1):** static plugins on `LessonkitProvider` (`config.plugins`).

- Kinds: `analytics`, `lms`, `assessment`, `interaction`, `ai`
- Hooks: `setup` / `dispose`, `onTelemetry`, `wrapTrackingSink`, `onTelemetryBatch`, `scoreAssessment`, `interactionBlocks` metadata
- Docs: [`docs/reference/plugins.md`](docs/reference/plugins.md), [plugin cookbook](docs/guides/react-developers/plugin-cookbook.md)
- Example: `examples/_shared/plugins/consoleAnalyticsPlugin.ts`

**Future:** dynamic loading, LMS connector presets, AI integrations, marketplace (post–Studio 1.0).

---

### 1.0.0 — Stable public API (framework) — **shipped**

**Major blocker for LessonKit Studio.** Framework **1.0.0 must ship before any Studio development
begins**—including schema spikes, renderer prototypes, or `lessonkit-studio` packages. **This gate is met as of 1.0.0 (2026-05-30).**

#### Criteria to hit before 1.0 (and before Studio)

- Stable component and hook APIs (semver expectations)
- Storybook + docs site live and current with 1.0 API surface
- Packaging documented end-to-end (React/Vite and LXPack targets)
- Accessibility conformance documented (WCAG 2.1 AA target)
- CI with tests + basic e2e coverage (Playwright)
- **Documentation complete for 1.0**:
  - all public `@lessonkit/*` APIs covered in reference pages (no undocumented exports)
  - migration notes from 0.x → 1.0 (breaking changes, identity/CLI/catalog deltas)
  - canonical quickstart paths verified (React developers + vibe-coding guides match `lessonkit init` output)
  - live compiled examples on Read the Docs match current example apps
- Framework milestones **0.1.x through 0.9.x** (and scoped **0.8.0+** plugin work planned for 1.0) delivered per this roadmap
- **AI/dev readiness**: generator-friendly API + machine-readable catalog + deterministic exports (see `docs/STUDIO_READINESS.md`)

#### Gate checklist (framework complete → Studio may start)

| # | Framework milestone | Must be shipped |
|---|---------------------|-----------------|
| 1 | 0.1.x — MVP hardening | Yes |
| 2 | 0.2.0 — Analytics and tracking | Yes |
| 3 | 0.3.0 — Accessibility package | Yes |
| 4 | 0.4.x — Theme system + token contract | Yes |
| 5 | 0.5.x — Deterministic identity model | Yes |
| 6 | 0.6.x — Export surfaces + `@lessonkit/lxpack` adapter | Yes |
| 7 | 0.7.x — CLI workflow (dual export) | Yes |
| 8 | 0.8.x — Runtime block catalog + renderer parity | Yes |
| 9 | 0.9.x — Conformance harness (export parity) | Yes |
| 10 | 0.8.0+ — Plugin architecture (as scoped for 1.0) | Yes |
| 11 | **1.0.0 — Stable public API** | **Yes — Studio gate** |

---

## LessonKit Studio milestones

> **Studio development gate:** Framework **1.0.0** has shipped. Studio milestones below may proceed; see [Status](#status).

Studio is a **visual learning experience builder** on LessonKit + LXPack: drag-and-drop authoring,
Git-backed projects, live preview, and export to React/Vite, LXPack, SCORM, xAPI, cmi5, and standalone
web builds. Full detail: [`docs/LessonKit_Studio_PLAN.md`](docs/LessonKit_Studio_PLAN.md), [`docs/LessonKit_Studio_SPEC.md`](docs/LessonKit_Studio_SPEC.md).

### Studio development gate (met)

1. Ship every **framework** milestone in [Framework milestones](#framework-milestones) through **1.0.0** — **done**.
2. Verify the [gate checklist](#gate-checklist-framework-complete--studio-may-start) — **done**.
3. Begin **Studio 0.1.x** (schema and shared renderer) — **done** (see [Studio 0.1.0](#studio-010--schema-and-shared-renderer)).

### Architecture (target)

```text
+----------------------+
| LessonKit Studio UI  |  apps/studio-web (+ studio-desktop later)
+----------------------+
           |
           v
+----------------------+
| Project Schema Layer |  @lessonkit/studio-schema
+----------------------+
           |
           v
+----------------------+
| React Renderer       |  @lessonkit/studio-renderer → @lessonkit/react
+----------------------+
           |
           v
+----------------------+
| LXPack Integration   |  @lessonkit/studio-codegen → @lessonkit/lxpack
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
| `lessonkit init` / `dev` / `build` | 0.7.0 |
| `@lessonkit/lxpack` SCORM export | 0.6.0 |
| xAPI/cmi5/standalone via LXPack | 0.6.0 |
| Runtime block catalog reference + generator docs | 0.8.x |
| Export parity + conformance docs | 0.9.x |
| Plugin hooks + extension docs (as scoped) | 0.8.0+ |
| Stable public API + full docs + e2e CI | **1.0.0 (gate)** |

---

### Studio 0.1.0 — Schema and shared renderer

**Status:** Shipped in monorepo (workspace packages `@lessonkit/studio-schema` and `@lessonkit/studio-renderer` at **0.1.0**, private).

#### Goals

- Define the project format and validation pipeline; render schema documents with the same components as exported apps.

#### Deliverables

- **Project layout** (Git-backed): [`docs/guides/studio/project-format-v1.md`](docs/guides/studio/project-format-v1.md)
  - `lessonkit.json`, `src/project.json`, `assets/`, `themes/`
- **`@lessonkit/studio-schema`** ([`packages/studio-schema`](packages/studio-schema)):
  - `schemaVersion` **1**; `migrateStudioProject` / `loadStudioProject`; validation + normalization
  - JSON document model: `pages[]` with `id` and `blocks[]`
- **`@lessonkit/studio-renderer`** ([`packages/studio-renderer`](packages/studio-renderer)):
  - `StudioRenderer` → `@lessonkit/react` (`Course`, `Lesson`, `Quiz`, `Scenario`)
  - Example: [`examples/studio-minimal`](examples/studio-minimal)
- **Initial block types:** text, heading, image, button, input, container, quiz, scenario; checklist / video stubbed

---

### Studio 0.2.0 — Visual editor MVP

#### Goals

- Ship a usable canvas: drag/drop, property editing, undo/redo, autosave hooks, live preview.

#### Deliverables

- **`@lessonkit/studio-builder`** + **`@lessonkit/studio-ui`**:
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

- **`@lessonkit/studio-codegen`**:
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

- **`@lessonkit/studio-github`**:
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

- **`@lessonkit/studio-ai`** workflows:
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
