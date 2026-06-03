# LessonKit Roadmap

This roadmap turns the product plan and technical spec into an execution plan. It’s intentionally
pragmatic: small, shippable milestones with clear outputs.

## Product lines

| Line | What it is | Primary docs |
|------|------------|--------------|
| **LessonKit (framework)** | React components, telemetry, xAPI, CLI, packaging | [PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md), [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md) |
| **LessonKit Studio** | Visual authoring on top of the framework + LXPack | [`docs/LessonKit_Studio_PLAN.md`](studio-plan.md), [`docs/LessonKit_Studio_SPEC.md`](studio-spec.md) |

Studio is not a replacement for code-first authoring—it shares the same runtime (`@lessonkit/react`),
export targets, and accessibility/telemetry goals. Packaging and LMS delivery lean on **LXPack** once
the framework adapter exists (see 0.6.0).

**Studio does not start until framework 1.0.0 ships.** Framework **1.0.0 — Stable public API** is complete; Studio milestones below may begin.

## Key references

- [PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md) — framework product vision and MVP scope
- [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md) — framework technical spec and requirements
- [`docs/LessonKit_Studio_PLAN.md`](studio-plan.md) — Studio vision, MVP scope, positioning
- [`docs/LessonKit_Studio_SPEC.md`](studio-spec.md) — Studio architecture, schema, editor, exports
- [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](docs/reference/lxpack-upgrades.md) — LXPack interoperability notes
- [H5P content types](https://h5p.org/content-types-and-applications) — external reference for the [H5P-aligned capability backlog](#h5p-aligned-capability-backlog) below (patterns, not a runtime dependency)
- [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md) — H5P machine name → LessonKit block traceability matrix

## Status

- **Framework:** **1.1.0** — Assessment contract + Tier B P0 blocks (see [1.1.x](#11x--assessment-contract--tier-b-p0-blocks))
- **Studio:** **unblocked** — framework gate met; see [Studio milestones](#lessonkit-studio-milestones)
- **Focus (now):** LessonKit Studio 0.4.x+ (GitHub, AI, hosted) and **1.2.x** compound containers

## Guiding principles

- **React-first**: author learning experiences as components, not timelines (code or Studio—same output model).
- **Single renderer**: Studio canvas, live preview, and exported apps must share rendering logic (`@lessonkit/react` + Studio renderer).
- **Accessibility-first**: WCAG 2.1 AA target; keyboard + focus management by default in framework and generated experiences.
- **Interop-ready**: analytics primitives now; SCORM/xAPI/cmi5 via LXPack export is additive (framework adapter + Studio codegen).
- **Proven interactions**: adopt high-value patterns from the broader interactive-content ecosystem (notably [H5P](https://h5p.org/content-types-and-applications)) as first-class React blocks with shared contracts—not embedded H5P iframes.
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

The 0.1.x deliverables above are **complete**. Identity v1 (`courseId`, `lessonId`, `checkId`) is required and normalized at runtime. Unit tests, Storybook, and the block catalog ship in the monorepo. See [CHANGELOG](docs/project/changelog.md).

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

See [`docs/IDENTITY.md`](docs/reference/identity.md) and [`docs/TELEMETRY.md`](docs/reference/telemetry.md).

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
  - LXPack interoperability checklist: [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](docs/reference/lxpack-upgrades.md)

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
  - update [`docs/STUDIO_READINESS.md`](docs/project/studio-readiness.md) 0.8.x checklist as catalog items ship
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
  - update [`docs/STUDIO_READINESS.md`](docs/project/studio-readiness.md) 0.9.x checklist as harness items ship

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

### 1.1.x — Assessment contract + Tier B P0 blocks

**Status:** **Shipped in 1.1.0**. Traceability: [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md).

#### Goals

- Extend the runtime block catalog beyond single-select `Quiz` using an H5P-aligned **assessment contract** (scores, reset, solutions, xAPI, retry flags).
- Keep export parity (React/Vite, SCORM, xAPI) and generator-safe JSON catalog (`blockCatalogVersion = 2`).

#### Deliverables

- [x] **`Assessment` contract** in `@lessonkit/core` + enforcement in `block-contract.v2.json`
- [x] **`TrueFalse`** — binary choice; `checkId`; Storybook + tests
- [x] **`FillInTheBlanks`** — fill-in interaction; xAPI `fill-in`; keyboard-accessible blanks
- [x] **`DragAndDrop`** — drag targets with keyboard alternative
- [x] **`DragTheWords`** — inline word drag
- [x] **`MarkTheWords`** — selectable tokens (pointer + keyboard)
- [x] **`AssessmentSequence`** — ordered mix of contract-compliant assessments (H5P Question Set)
- [x] **Telemetry catalog v2** — events for new interaction types
- [x] **`block-catalog.v2.json`** + docs in [`docs/reference/block-catalog.md`](docs/reference/block-catalog.md)
- [x] **Golden path + e2e** — `examples/assessments-p0`; integration SCORM 1.2; Vite e2e smoke
- [x] **SPEC** — assessment API documented in [`SPEC.md`](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md#assessment-contract-framework-11x)
- [x] **H5P documentation (1.1.x P0)** — capability map + block catalog v2 + [MIGRATION-1.0-to-1.1.md](docs/MIGRATION-1.0-to-1.1.md)

#### Paired Studio work (0.8.x)

- [ ] `studio-schema` types + `studio-renderer` + palette for 1.1.x P0 blocks
- [ ] Codegen emits new components and `lessonkit.json` assessment entries
- [ ] **Studio palette labels** — H5P-familiar display names (e.g. “Fill in the Blanks”) + H5P doc checklist items for **studio-schema** catalog and [Studio editor guide](docs/guides/studio/editor.md)

#### Out of scope for 1.1.x

- Compound containers (`InteractiveBook`, `SlideDeck`) — **1.2.x / 1.3.x**
- H5P `.h5p` import — **1.6.x** research spike
- Tier C–E media/game blocks — later framework minors per [capability map](docs/project/h5p-capability-map.md)

---

## LessonKit Studio milestones

> **Studio development gate:** Framework **1.0.0** has shipped. Studio milestones below may proceed; see [Status](#status).

Studio is a **visual learning experience builder** on LessonKit + LXPack: drag-and-drop authoring,
Git-backed projects, live preview, and export to React/Vite, LXPack, SCORM, xAPI, cmi5, and standalone
web builds. Full detail: [`docs/LessonKit_Studio_PLAN.md`](studio-plan.md), [`docs/LessonKit_Studio_SPEC.md`](studio-spec.md).

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

**Status:** Shipped on npm (`studio-v0.1.0`): `@lessonkit/studio-schema` and `@lessonkit/studio-renderer` at **0.1.0** (superseded by **0.2.0** on the same packages).

#### Goals

- Define the project format and validation pipeline; render schema documents with the same components as exported apps.

#### Deliverables

- **Project layout** (Git-backed): [`docs/guides/studio/project-format-v1.md`](docs/guides/studio/project-format-v1.md)
  - `lessonkit.json`, `src/project.json`, `assets/`, `themes/`
- **`@lessonkit/studio-schema`** ([`packages/studio-schema`](https://github.com/eddiethedean/lessonkit/tree/main/packages/studio-schema)):
  - `schemaVersion` **1**; `migrateStudioProject` / `loadStudioProject`; validation + normalization
  - JSON document model: `pages[]` with `id` and `blocks[]`
- **`@lessonkit/studio-renderer`** ([`packages/studio-renderer`](https://github.com/eddiethedean/lessonkit/tree/main/packages/studio-renderer)):
  - `StudioRenderer` → `@lessonkit/react` (`Course`, `Lesson`, `Quiz`, `Scenario`)
  - Example: [examples/studio-minimal](https://github.com/eddiethedean/lessonkit/tree/main/examples/studio-minimal)
- **Initial block types:** text, heading, image, button, input, container, quiz, scenario; checklist / video stubbed

---

### Studio 0.3.0 — Code generation and export

**Status:** Ready to publish (`studio-v0.3.0`): all five Studio packages at **0.3.0** including `@lessonkit/studio-codegen`.

#### Goals

- Export real artifacts authors can ship; Studio focuses on authoring, LXPack on packaging.

#### Deliverables (done)

- **`@lessonkit/studio-codegen`**: renderer + JSX React/Vite export; `studioProjectToDescriptor`; Node LXPack helpers.
- **`@lessonkit/studio-ui`**: `ExportPanel`; lazy block previews; virtualized large canvases.
- **`apps/studio-web`**: zip download + export options in header.
- **Integration test** and **`examples/studio-export`**.
- **Docs:** [Studio export guide](docs/guides/studio/export.md), STUDIO_READINESS 0.3 checklist.

#### Out of scope (0.4+)

- GitHub sync, hosted `lessonkit.app`, `lessonkit-studio` CLI, Tauri desktop, schema v2.

---

### Studio 0.2.0 — Visual editor MVP

**Status:** Shipped (`studio-v0.2.0`).

#### Goals

- Ship a usable canvas: drag/drop, property editing, undo/redo, autosave hooks, live preview.

#### Deliverables (done)

- **`@lessonkit/studio-builder`**: Zustand store, commands, undo/redo, validation on commit, debounced autosave subscription.
- **`@lessonkit/studio-ui`**: `StudioEditor` — palette, dnd-kit canvas (nested containers), property inspector, live preview.
- **`apps/studio-web`**: Vite shell, `localStorage` autosave, import/export JSON.
- **Renderer**: checklist and video blocks use minimal real preview UI (no longer stubs).
- **Docs**: [Studio editor guide](docs/guides/studio/editor.md), [STUDIO_READINESS.md](docs/project/studio-readiness.md) 0.2 checklist.

#### Out of scope (0.3+)

- GitHub sync, hosted `lessonkit.app`, `lessonkit-studio` CLI, Tauri desktop, schema v2 (codegen shipped in 0.3.0).

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

Tracked in [`docs/LessonKit_Studio_PLAN.md`](studio-plan.md); not scheduled on framework semver:

- Real-time multiplayer collaboration
- Timeline / animation editor; video synchronization
- Visual branching graph editor
- Marketplace / community templates
- Plugin ecosystem and LMS cloud hosting
- AI course agents and design agents
- Integrated LMS deployment
- Block palette and compound authoring from the [H5P-aligned backlog](#h5p-aligned-capability-backlog) (phased with framework catalog releases)

---

## H5P-aligned capability backlog

[H5P](https://h5p.org/) is a mature catalog of **50+ interactive content types** plus **compound containers** (Interactive Book, Course Presentation, Interactive Video, Branching Scenario) and **platform services** (Hub, `.h5p` transport, question-type contracts, xAPI). LessonKit should **not** embed H5P runtimes in iframes—we should **incorporate the interaction patterns** as native `@lessonkit/react` primitives and `@lessonkit/studio-schema` blocks, with the same guarantees we already ship: identity v1, WCAG 2.1 AA, telemetry catalog, export parity, and machine-readable block contracts.

**Legend:** ✅ shipped · 🟡 partial · ⬜ planned

### Parity baseline (already in LessonKit)

| H5P pattern | LessonKit today | Notes |
|-------------|-----------------|-------|
| Multiple Choice | ✅ `Quiz` / `KnowledgeCheck` | Single-select MCQ; sync `checkId` with `lessonkit.json` |
| Scenario / narrative block | ✅ `Scenario` | Manual `interaction` telemetry |
| Reflection / open response | ✅ `Reflection` | Textarea; not auto-scored |
| Column / stacked layout | 🟡 Studio `container` | Nested blocks; not yet a framework `Page` primitive |
| Course / lesson structure | ✅ `Course`, `Lesson` | Differs from H5P “one activity per embed” |
| Progress / completion | ✅ `ProgressTracker`, hooks | H5P scores per activity; we aggregate at course level |
| Theming | ✅ `@lessonkit/themes` | `--lk-*` vs H5P per-library CSS |
| xAPI + LMS export | ✅ `@lessonkit/xapi`, `@lessonkit/lxpack` | SCORM/xAPI/cmi5 via packaging, not `.h5p` |
| Visual authoring | 🟡 Studio 0.2–0.3 | text, heading, image, button, input, container, quiz, scenario, checklist, video |
| Content-type discovery | ⬜ | H5P Hub; we need catalog + Studio palette + docs (see Tier F) |

### Tier A — Compound experiences (highest leverage)

These are H5P’s “course builders.” Each becomes a **framework container** + **Studio compound block** + **codegen** path, with an explicit **sub-block allowlist** (H5P curates these for versioning, UX, and scoring—see [question-type contract](https://h5p.org/documentation/developers/contracts)).

| Priority | H5P content type | LessonKit target | Framework / Studio | Depends on |
|----------|------------------|------------------|--------------------|------------|
| P0 | **Interactive Book** | `InteractiveBook` or multi-page `Lesson` model | Framework **1.2.x**, Studio **0.8.x** | Page layout, resume state, sub-block catalog |
| P0 | **Course Presentation** | `SlideDeck` | Framework **1.3.x**, Studio **0.9.x** | Slide schema, per-slide block allowlist, keyboard slide nav |
| P0 | **Interactive Video** | `InteractiveVideo` | Framework **1.4.x**, Studio **0.10.x** | Video block, timed overlays, question contract |
| P0 | **Branching Scenario** | `BranchingScenario` | Framework **1.5.x**, Studio **0.11.x** | Branch graph, scoring, xAPI branching verbs |
| P1 | **Question Set (Quiz)** | `AssessmentSequence` | Framework **1.1.x** | Question-type contract (below) |
| P1 | **Column** → **Page** | `Page` (rename/clarify Studio `container`) | Studio **0.8.x**, catalog v2 | Unified semantics with Interactive Book chapters |
| P2 | **Game Map** | `GameMap` | Framework **1.7.x** | Spatial layout, optional non-scored stages |
| P2 | **Virtual Tour (360)** | `VirtualTour` | Framework **1.9.x** | 360 asset pipeline, hotspot model |
| P3 | **Documentation Tool** | `DocumentationTool` | Framework **2.x** | Cornell notes, exportable learner artifacts |
| P3 | **Interactive Canvas / Structure Strip** | `StructureStrip`, `WritingCanvas` | Framework **2.x** | Writing pedagogy; lower than core LMS parity |

**Deliverables (cross-cutting for Tier A):**

- **Compound block contract** in `block-contract.v1.json`: allowed child types, max nesting depth, score aggregation, `resetTask` / `getCurrentState` for resume
- **Studio**: visual editors for timelines (video), slide strips (presentation), branch graph (scenario)—see Studio Future scope
- **Telemetry**: `branch_selected`, `slide_viewed`, `video_segment_completed`, `book_page_viewed` (extend telemetry catalog v2)
- **Docs**: composition guide (which blocks nest where), parity with export targets

### Tier B — Questions and scored tasks

Extend beyond MCQ via a formal **assessment contract** (H5P’s `H5P.Question` pattern: `getScore`, `getMaxScore`, `getAnswerGiven`, `resetTask`, `showSolutions`, `getXAPIData`, `enableRetry` / `enableSolutionsButton`).

| Priority | H5P content type | LessonKit component / block | Notes |
|----------|------------------|----------------------------|-------|
| P0 | **True/False** | `TrueFalse` | Smallest extension of `Quiz` |
| P0 | **Fill in the Blanks** | `FillInTheBlanks` | Text input scoring; xAPI `fill-in` |
| P0 | **Drag and Drop** | `DragAndDrop` | Image or text targets; keyboard alternative required |
| P0 | **Drag the Words** | `DragTheWords` | Sub-type of drag + text |
| P0 | **Mark the Words** | `MarkTheWords` | Click/highlight; keyboard-selectable tokens |
| P1 | **Single Choice Set** | `SingleChoiceSet` | Sequential single-question slides |
| P1 | **Multiple Choice** (variants) | Extend `Quiz` | Multi-select, shuffle, feedback modes |
| P1 | **Summary** | `Summary` | Construct summary from statement bank |
| P1 | **Sort the Paragraphs** | `SortParagraphs` | Ordering task; drag or keyboard reorder |
| P1 | **Guess the Answer** | `GuessTheAnswer` | Reveal answer; optional scoring |
| P1 | **Multimedia Choice** | `MultimediaChoice` | Image/audio options (a11y captions required) |
| P2 | **Speak the Words** / **Speak the Words Set** | `SpeakTheWords`, `SpeakTheWordsSet` | Web Speech API; graceful degradation |
| P2 | **Dictation** | `Dictation` | Audio prompt + text compare |
| P2 | **Complex / Advanced Fill in the Blanks** | `AdvancedBlanks` | Dropdown/markup blanks; higher a11y bar |
| P3 | **Arithmetic Quiz** | `ArithmeticQuiz` | Timed math; optional (no H5P Question Set contract) |
| P3 | **Essay** (third-party in H5P) | `Essay` | AI/manual grading hooks via `scoreAssessment` plugin |
| P3 | **Questionnaire** | `Questionnaire` | Unscored survey; feedback export |

**Framework milestone:** **1.1.x — Assessment contract v1** — shared `Assessment` base, catalog entries, Storybook, e2e for Tier B P0 items.

### Tier C — Media, images, and exploration

| Priority | H5P content type | LessonKit target | Notes |
|----------|------------------|------------------|-------|
| P1 | **Image Hotspots** | `ImageHotspots` | Regions + popovers; keyboard reachable hotspots |
| P1 | **Find the Hotspot** / **Find Multiple Hotspots** | `FindHotspot`, `FindMultipleHotspots` | Scored discovery tasks |
| P1 | **Image Slider** | `ImageSlider` | Carousel primitive in Studio |
| P2 | **Image Juxtaposition** | `ImageJuxtaposition` | Before/after slider |
| P2 | **Agamotto (Image Blender)** | `ImageSequence` | Progressive image sequence |
| P2 | **Collage** | `Collage` | Multi-image layout block |
| P2 | **Image Pairing** / **Image Sequencing** | `ImagePairing`, `ImageSequencing` | Memory/order games |
| P2 | **Memory Game** | `MemoryGame` | Card flip; focus management |
| P3 | **Iframe Embedder** | `Embed` (restricted) | Sandboxed, responsive; opt-in for security |
| P3 | **Chart** | `Chart` | Bar/pie; accessible data table fallback |

**Studio:** asset library, hotspot editor, collage/slider layout tools (**0.10.x+**).

### Tier D — Text, cards, and informational content

| Priority | H5P content type | LessonKit target | Notes |
|----------|------------------|------------------|-------|
| P1 | **Accordion** | `Accordion` | Studio primitive; nest policy (no accordion-in-accordion) |
| P1 | **Dialog Cards** | `DialogCards` | Flip cards; reduced-motion safe |
| P1 | **Flashcards** | `Flashcards` | Study mode; optional self-score |
| P2 | **Timeline** | `Timeline` | Events + media; fragile as sub-content in H5P—test resize |
| P2 | **Table** | `Table` | Studio + framework rich text table |
| P2 | **Information Wall** | `InformationWall` | Searchable panels |
| P3 | **Exportable Text Area / Cornell** | `CornellNotes`, `ExportableNotes` | Learner export (PDF/text) |
| P3 | **Personality Quiz** | `PersonalityQuiz` | Outcome buckets; community pattern, lower priority |
| P1 | **Audio Recorder** | `AudioRecorder` | Learner recording; consent + storage policy |
| P2 | **Slideshow (parallax)** | `ParallaxSlideshow` | Presentation variant; respect `prefers-reduced-motion` |

**Primitives (H5P sub-content):** extend Studio **text**, **heading**, **image**, **button**, **video**, **audio**, **link** with shared semantics for compounds.

### Tier E — Games, puzzles, and novelty

Lower priority unless a customer/LMS parity request surfaces; still catalog for AI/Studio discoverability.

| H5P content type | LessonKit target | Priority |
|------------------|------------------|----------|
| Crossword | `Crossword` | P3 |
| Find the Words | `WordSearch` | P3 (keyboard a11y hard—H5P often excludes from compounds) |
| Combination Lock | `CombinationLock` | P3 |
| KewAr Code / QR | `QrContent` | P3 |
| Advent Calendar | `AdventCalendar` | P3 |
| Agora World (AR) | `AugmentedReality` | P4 / research |

### Tier F — Platform, authoring ecosystem, and interoperability

Capabilities H5P provides **around** content types—LessonKit equivalents should be explicit roadmap items:

| H5P capability | LessonKit target | Milestone hint |
|----------------|------------------|----------------|
| **Content Type Hub** (discover/install/update libraries) | **Block registry** in Studio + documented npm packages (`@lessonkit/blocks-*` optional split); CLI `lessonkit blocks list` | Studio **0.8.x**, CLI **1.6.x** |
| **`.h5p` import/export** | **`.lkcourse` / interchange** JSON + assets zip; optional **H5P import adapter** (read-only, map subset → `StudioProjectV1`) | Framework **1.6.x** (research spike) |
| **Question-type contract** | `Assessment` interface + `block-contract` enforcement | Framework **1.1.x** |
| **Compound sub-content allowlists** | Per-parent `allowedChildTypes` in catalog | Framework **1.2.x** with first compound |
| **Resume / attempt state** | `getCurrentState` on assessments + compounds; session storage v2 | Framework **1.2.x** (extends 1.0.2 session work) |
| **Hub OER / content reuse** | Template gallery + import from shared examples repo | Studio **0.6.x** gallery + **1.x** OER |
| **Semantics-driven editor** | Studio inspector generated from block JSON Schema (H5P `semantics.json` analog) | Studio **0.9.x** |
| **Community / third-party blocks** | Plugin `interactionBlocks` + marketplace (post–1.0 plugins) | Framework plugins **2.x** |
| **LTI / embed** | Already via LMS packaging; document embed snippet for standalone | Docs + lxpack **1.x** |
| **Fresh UI / theming per widget** | Single `--lk-*` theme across all blocks (advantage over H5P per-library CSS) | Ongoing `@lessonkit/themes` |

### Implementation principles (learned from H5P)

When implementing backlog items, follow H5P’s constraints **in React form**:

1. **Design by contract** — compound parents call documented methods on children (scores, reset, xAPI, resume).
2. **One implementation per block type per course build** — avoid duplicate library versions in nested trees (H5P global version lock).
3. **Sub-content curation** — not every block nests everywhere; document allowlists like H5P maintainers do.
4. **Keyboard-first** — exclude or fix patterns H5P excludes (e.g. non-keyboard word search) rather than shipping inaccessible compounds.
5. **Export parity** — every scored block must map to `lessonkit.json` assessments and LXPack descriptors.
6. **Machine-readable catalog** — each new block extends `block-catalog.v1.json` and `studio-schema` catalog before Studio palette ships.
7. **H5P documentation** — every shipped H5P-parity block completes the [checklist below](#h5p-documentation-checklist-per-block) in the same PR (or release) as the component.

### H5P documentation checklist (per block)

**Gate:** a framework or Studio block is not **done** for H5P parity until these are checked off (copy into PR description or release notes).

| # | Task | Where |
| --- | --- | --- |
| 1 | Set capability map **Status** to ✅ and confirm **Framework** / **Studio** columns | [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md) master table |
| 2 | Add row: LessonKit id, **H5P display name**, **H5P machine name** (if known) | Same map + [block catalog](docs/reference/block-catalog.md) (v1 or v2 section) |
| 3 | Document props, `checkId` / `blockId`, a11y, telemetry, parent constraints | [block catalog](docs/reference/block-catalog.md) per-block section (or new subsection) |
| 4 | Add **H5P equivalent** admonition or table row on the block’s doc touchpoints | At minimum: block catalog; [components guide](docs/guides/react-developers/components-and-hooks.md) table if public API; [H5P authors guide](docs/guides/h5p-for-lessonkit-authors.md) “Available today” or “Planned” table when status changes |
| 5 | Storybook story titled with **H5P name in subtitle** (e.g. “FillInTheBlanks — H5P Fill in the Blanks”) | `packages/react/stories/` |
| 6 | Studio: palette **label** = H5P display name; optional **description** “Maps from H5P …” | `@lessonkit/studio-ui` / `studio-schema` catalog |
| 7 | If scored: example `lessonkit.json` `assessments[]` entry + export parity note | Golden example or [packaging guide](docs/reference/packaging.md) callout when first of kind |
| 8 | `h5pAlias` / `h5pMachineName` in **block-catalog JSON** entry (when catalog field ships in 1.1.x) | `block-catalog.v2.json` + `buildBlockCatalog()` |

**Ongoing pages (already live—keep links accurate):** [docs index](docs/index.md) H5P tip, [H5P authors guide](docs/guides/h5p-for-lessonkit-authors.md), [capability map](docs/project/h5p-capability-map.md).

**Applies to:** all Tier A–E blocks in the [H5P-aligned backlog](#h5p-aligned-capability-backlog), not only 1.1.x.

### Suggested delivery phases

```text
Framework 1.1.x   Assessment contract + Tier B P0 + H5P doc checklist per block
Framework 1.2.x   Page/InteractiveBook foundation + resume state + catalog allowlists + H5P docs
Framework 1.3.x   SlideDeck (Course Presentation) + H5P docs
Framework 1.4.x   InteractiveVideo + timed overlays + H5P docs
Framework 1.5.x   BranchingScenario + branch telemetry + H5P docs
Framework 1.6.x   Interchange format + optional H5P import spike + import guide callouts
Framework 1.7.x+  Tier C–E blocks by demand; plugin marketplace; H5P doc checklist each

Studio 0.8.x      Palette: Tier B P0 + Accordion, DialogCards, ImageHotspots + H5P palette labels/docs
Studio 0.9.x      Schema-driven inspector; SlideDeck editor shell + H5P docs
Studio 0.10.x     InteractiveVideo timeline editor + H5P docs
Studio 0.11.x     Branching graph editor (links Studio Future scope) + H5P docs
```

**Documentation:** [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md) — traceability matrix (status ✅ as blocks ship). **Per-block gate:** [H5P documentation checklist](#h5p-documentation-checklist-per-block) required for every new H5P-parity feature. **Hub pages:** [`docs/guides/h5p-for-lessonkit-authors.md`](docs/guides/h5p-for-lessonkit-authors.md), [docs index](docs/index.md), [block catalog](docs/reference/block-catalog.md), components + Studio guides.

**Out of scope (explicit):** running H5P Core inside LessonKit exports; maintaining parity with every unmaintained H5P third-party type; iframe-first embed model.

---

### Studio 1.0.0 — Criteria (product)

- Visual MVP blocks + quiz/scenario authoring with live preview parity to export
- React/Vite and LXPack export documented end-to-end
- GitHub App sync with autosave and branching
- Generated courses meet framework accessibility standards (WCAG 2.1 AA target)
- At least one AI workflow (e.g. lesson or quiz generation) in production
- SCORM/xAPI/cmi5 export path documented via LXPack (built in framework 0.6.0 / 0.7.0 before Studio gate)

---

## Milestone alignment (framework → Studio → content expansion)

```text
Phase 1 — Framework only (no Studio code)
────────────────────────────────────────
0.1.x → 0.2.0 → 0.3.0 → 0.4.0 → 0.5.0 → 0.6.0 → 0.7.0 → 0.8.0+ → 1.0.0
                                                              │
                                                              ▼
                                                    STUDIO GATE (blocker)
                                                              │
Phase 2 — Studio (after 1.0.0)                              │
────────────────────────────────                              │
Studio 0.1.0 → 0.2.0 → 0.3.0 → 0.4.0 → 0.5.0 → 0.6.0 → 0.7.0 → Studio 1.0.0
                                                              │
Phase 3 — Interactive content expansion (parallel tracks)     │
────────────────────────────────────────────────────────      │
Framework 1.1.x → 1.2.x → … → 1.6.x+  (blocks + compounds; 1.1.x checklist in roadmap) │
Studio 0.8.x → 0.11.x+  (palette + compound editors)          │
        ▲                                                     │
        └── driven by H5P-aligned backlog (see above) ───────┘
```

**Phase 1 gate:** Studio does not start until framework **1.0.0** ships.

**Phase 3:** Framework **1.1.x+** and Studio **0.8.x+** may proceed in parallel once the baseline
catalog and export path are stable—each new block requires framework contract + renderer + Studio
palette (and codegen) before it is “done.”
