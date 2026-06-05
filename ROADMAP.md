# LessonKit Roadmap

This roadmap turns the product plan and technical spec into an execution plan. It's intentionally
pragmatic: small, shippable milestones with clear outputs.

## Product

**LessonKit (framework)** — React components, telemetry, xAPI, CLI, and packaging for code-first authoring. **Planned:** `@lessonkit/react-native` for iOS/Android (see [2.x](#2x--lessonkitreact-native-planned)).

| Doc | Link |
|-----|------|
| Product plan | [PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md) |
| Technical spec | [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md) |

Packaging and LMS delivery lean on **LXPack** via `@lessonkit/lxpack` (see 0.6.x).

## Key references

- [PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md) — product vision and MVP scope
- [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md) — technical spec and requirements
- [`docs/LXPACK_UPGRADES_FOR_LESSONKIT.md`](docs/reference/lxpack-upgrades.md) — LXPack interoperability notes
- [H5P content types](https://h5p.org/content-types-and-applications) — external reference for the [H5P-aligned capability backlog](#h5p-aligned-capability-backlog) below (patterns, not a runtime dependency)
- [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md) — H5P machine name → LessonKit block traceability matrix

## Status

- **Framework:** **1.3.0** — `SlideDeck` (Course Presentation) (see [1.3.x](#13x--slidedeck-course-presentation))
- **Focus (now):** **1.4.x** `InteractiveVideo`

## Guiding principles

- **React-first**: author learning experiences as components, not timelines.
- **Accessibility-first**: WCAG 2.1 AA target; keyboard + focus management by default.
- **Interop-ready**: analytics primitives now; SCORM/xAPI/cmi5 via LXPack export is additive.
- **Proven interactions**: adopt high-value patterns from the broader interactive-content ecosystem (notably [H5P](https://h5p.org/content-types-and-applications)) as first-class React blocks with shared contracts—not embedded H5P iframes.
- **DX matters**: fast local dev, simple project bootstrap, excellent docs.
- **Stable API**: semver expectations from **1.0.0** onward.

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
  - "headless" web delivery
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

- Make accessibility requirements explicit and testable.

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

- Support organizational branding and consistent UI for **developers** and **AI code generators**.
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
- Make packaging scriptable and deterministic for CI.

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

### 0.7.x — CLI workflow for developers and AI

#### Goals

- Make the developer workflow frictionless, reproducible, and generator-friendly.

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

- Define the set of primitives that are safe to generate (AI) and safe to map to visual tools, without coupling to any editor.
- Ensure each primitive's behavior is specified for accessibility, theming, and telemetry.

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
  - examples demonstrate every catalog block (at least one reference course)

---

### 0.9.x — Conformance harness (export parity + gate hardening)

#### Goals

- Prove that LessonKit behaves the same across export surfaces (React/Vite vs LXPack/LMS artifacts).

#### Deliverables

- Playwright e2e for:
  - keyboard navigation + focus flows (a11y)
  - telemetry batching + xAPI queue behavior
  - packaging artifact smoke (standalone + SCORM launch)
- Conformance matrix:
  - asserts behavioral equivalence across export targets for the same course
- **Documentation**:
  - export parity guide for authors (`docs/guides/react-developers/export-parity.md` or equivalent) — what is guaranteed across React/Vite vs LMS targets
  - conformance matrix documented (what is tested, how to run locally, CI expectations)
  - contributor docs for Playwright e2e and packaging smoke tests

---

### 0.8.0+ — Plugin architecture

**Shipped (v1):** static plugins on `LessonkitProvider` (`config.plugins`).

- Kinds: `analytics`, `lms`, `assessment`, `interaction`, `ai`
- Hooks: `setup` / `dispose`, `onTelemetry`, `wrapTrackingSink`, `onTelemetryBatch`, `scoreAssessment`, `interactionBlocks` metadata
- Docs: [`docs/reference/plugins.md`](docs/reference/plugins.md), [plugin cookbook](docs/guides/react-developers/plugin-cookbook.md)
- Example: `examples/_shared/plugins/consoleAnalyticsPlugin.ts`

**Future:** dynamic loading, LMS connector presets, AI integrations, marketplace.

---

### 1.0.0 — Stable public API (framework) — **shipped**

Framework **1.0.0** shipped **2026-05-30**.

#### Criteria (met)

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
- **AI/dev readiness**: generator-friendly API + machine-readable catalog + deterministic exports

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

#### Out of scope for 1.1.x

- Compound containers (`InteractiveBook`, `SlideDeck`) — shipped in **1.2.x** / **1.3.x** respectively

---

### 1.2.x — Compound containers + Tier C/D P0

**Status:** **Shipped in 1.2.0**.

#### Goals

- Ship H5P-aligned compound foundation (`Page`, `InteractiveBook`) with resume state and catalog allowlists.
- Add Tier C/D P1 content and assessment blocks for handbook-style courses.

#### Deliverables

- [x] **`CompoundHandle`** + `CompoundResumeState` in `@lessonkit/core`; session storage v2
- [x] **Telemetry catalog v3** — `book_page_viewed`, `compound_page_viewed`, content interaction events
- [x] **`block-catalog.v3.json`** — `allowedChildTypes`, `compoundContract`, `maxNestingDepth`
- [x] **`Page`**, **`InteractiveBook`**, hardened **`AssessmentSequence`** with score aggregation
- [x] **Content primitives** — `Text`, `Heading`, `Image`
- [x] **Tier C/D P1** — `Accordion`, `DialogCards`, `Flashcards`, `ImageHotspots`, `ImageSlider`, `FindHotspot`, `FindMultipleHotspots`
- [x] **Golden example** — `examples/interactive-book`
- [x] **Docs** — [MIGRATION-1.1-to-1.2.md](docs/MIGRATION-1.1-to-1.2.md); H5P capability map updates

#### Out of scope for 1.2.x

- `SlideDeck` (Course Presentation) — shipped in **1.3.x**
- H5P `.h5p` import — **1.6.x** research spike
- Tier C–E media/game blocks — later framework minors per [capability map](docs/project/h5p-capability-map.md)

---

### 1.3.x — SlideDeck (Course Presentation)

**Status:** **Shipped in 1.3.0**.

#### Goals

- Ship H5P-aligned `SlideDeck` compound container with per-slide allowlists and keyboard slide navigation.
- Extend telemetry catalog v3 with `slide_viewed`.

#### Deliverables

- [x] **`Slide`**, **`SlideDeck`** in `@lessonkit/react`; `CompoundHandle` + session resume
- [x] **`slide_viewed`** telemetry + xAPI mapping
- [x] **`block-catalog.v3.json`** — `Slide`, `SlideDeck` entries with H5P `CoursePresentation` mapping
- [x] **Golden example** — `examples/slide-deck`
- [x] **Docs** — [MIGRATION-1.2-to-1.3.md](docs/MIGRATION-1.2-to-1.3.md); H5P capability map updates

#### Out of scope for 1.3.x

- Framework `Video` block on slides — **1.4.x** / InteractiveVideo
- `Summary` assessment block — Tier B P1

---

### 1.4.x — InteractiveVideo (planned)

- `InteractiveVideo` compound with timed overlays and question contract
- Video block primitive; telemetry for segments and interactions
- See [H5P-aligned backlog](#h5p-aligned-capability-backlog) Tier A

---

### 2.x — `@lessonkit/react-native` (planned)

#### Goals

- Bring LessonKit authoring and runtime to **iOS and Android** with a React Native UI layer that shares the same contracts as `@lessonkit/react` (identity, assessment scoring, telemetry, resume).
- Reuse headless packages where possible; avoid duplicating business logic in platform-specific code.

#### Deliverables

- **`@lessonkit/react-native`** (new package):
  - `LessonkitProvider`, `Course`, `Lesson`, and core assessment blocks (`Quiz`, `TrueFalse`, compound containers as demand dictates)
  - Parity with `@lessonkit/core` assessment and compound contracts (`AssessmentHandle`, `CompoundHandle`, resume state)
  - Native accessibility: screen reader labels, focus order, reduced-motion hooks via `@lessonkit/accessibility` patterns
- **Shared packages** (consume, do not fork):
  - `@lessonkit/core` — runtime, progress, plugins, telemetry builder
  - `@lessonkit/xapi` — offline queue with pluggable persistence (AsyncStorage adapter)
  - `@lessonkit/themes` — token contract mapped to native style props / CSS-in-JS where applicable
- **Persistence**: compound and assessment resume via pluggable storage port (AsyncStorage / secure store)
- **Examples**: Expo or bare React Native golden path app mirroring `examples/react-vite` scope
- **Docs**: React Native quickstart, platform limitations, and block parity matrix vs `@lessonkit/react`

#### Out of scope for initial `@lessonkit/react-native`

- In-app SCORM/xAPI LMS packaging (remains **`@lessonkit/lxpack`** + web build pipeline)
- Full H5P backlog parity on day one — ship Tier B P0 assessments + `Course`/`Lesson` shell first
- Embedded WebView fallback as the primary block renderer (native-first blocks only)

#### Depends on

- Stable **1.x** web API (`Assessment` contract, compound resume, plugin host)
- Export parity and conformance patterns from **0.9.x** / **1.x** e2e harness (adapt for Detox or Maestro where feasible)

---

## H5P-aligned capability backlog

[H5P](https://h5p.org/) is a mature catalog of **50+ interactive content types** plus **compound containers** (Interactive Book, Course Presentation, Interactive Video, Branching Scenario) and **platform services** (Hub, `.h5p` transport, question-type contracts, xAPI). LessonKit should **not** embed H5P runtimes in iframes—we should **incorporate the interaction patterns** as native `@lessonkit/react` primitives with the same guarantees we already ship: identity v1, WCAG 2.1 AA, telemetry catalog, export parity, and machine-readable block contracts.

**Legend:** ✅ shipped · 🟡 partial · ⬜ planned

### Parity baseline (already in LessonKit)

| H5P pattern | LessonKit today | Notes |
|-------------|-----------------|-------|
| Multiple Choice | ✅ `Quiz` / `KnowledgeCheck` | Single-select MCQ; sync `checkId` with `lessonkit.json` |
| Scenario / narrative block | ✅ `Scenario` | Manual `interaction` telemetry |
| Reflection / open response | ✅ `Reflection` | Textarea; not auto-scored |
| Column / stacked layout | ✅ `Page` | Compound layout primitive (1.2.x) |
| Course / lesson structure | ✅ `Course`, `Lesson` | Differs from H5P "one activity per embed" |
| Progress / completion | ✅ `ProgressTracker`, hooks | H5P scores per activity; we aggregate at course level |
| Theming | ✅ `@lessonkit/themes` | `--lk-*` vs H5P per-library CSS |
| xAPI + LMS export | ✅ `@lessonkit/xapi`, `@lessonkit/lxpack` | SCORM/xAPI/cmi5 via packaging, not `.h5p` |
| Content-type discovery | ⬜ | Block registry + docs (see Tier F) |

### Tier A — Compound experiences (highest leverage)

These are H5P's "course builders." Each becomes a **framework container** with an explicit **sub-block allowlist** (H5P curates these for versioning, UX, and scoring—see [question-type contract](https://h5p.org/documentation/developers/contracts)).

| Priority | H5P content type | LessonKit target | Framework | Depends on |
|----------|------------------|------------------|-----------|------------|
| P0 | **Interactive Book** | `InteractiveBook` | **1.2.x** ✅ | Page layout, resume state, sub-block catalog |
| P0 | **Course Presentation** | `SlideDeck` | **1.3.x** ✅ | Slide schema, per-slide block allowlist, keyboard slide nav |
| P0 | **Interactive Video** | `InteractiveVideo` | **1.4.x** | Video block, timed overlays, question contract |
| P0 | **Branching Scenario** | `BranchingScenario` | **1.5.x** | Branch graph, scoring, xAPI branching verbs |
| P1 | **Question Set (Quiz)** | `AssessmentSequence` | **1.1.x** ✅ | Question-type contract (below) |
| P1 | **Column** → **Page** | `Page` | **1.2.x** ✅ | Unified semantics with Interactive Book chapters |
| P2 | **Game Map** | `GameMap` | **1.7.x** | Spatial layout, optional non-scored stages |
| P2 | **Virtual Tour (360)** | `VirtualTour` | **1.9.x** | 360 asset pipeline, hotspot model |
| P3 | **Documentation Tool** | `DocumentationTool` | **2.x** | Cornell notes, exportable learner artifacts |
| P3 | **Interactive Canvas / Structure Strip** | `StructureStrip`, `WritingCanvas` | **2.x** | Writing pedagogy; lower than core LMS parity |

**Deliverables (cross-cutting for Tier A):**

- **Compound block contract** in `block-contract.v1.json`: allowed child types, max nesting depth, score aggregation, `resetTask` / `getCurrentState` for resume
- **Telemetry**: `branch_selected`, `slide_viewed`, `video_segment_completed`, `book_page_viewed` (extend telemetry catalog v2+)
- **Docs**: composition guide (which blocks nest where), parity with export targets

### Tier B — Questions and scored tasks

Extend beyond MCQ via a formal **assessment contract** (H5P's `H5P.Question` pattern: `getScore`, `getMaxScore`, `getAnswerGiven`, `resetTask`, `showSolutions`, `getXAPIData`, `enableRetry` / `enableSolutionsButton`).

| Priority | H5P content type | LessonKit component / block | Notes |
|----------|------------------|----------------------------|-------|
| P0 | **True/False** | `TrueFalse` ✅ | Smallest extension of `Quiz` |
| P0 | **Fill in the Blanks** | `FillInTheBlanks` ✅ | Text input scoring; xAPI `fill-in` |
| P0 | **Drag and Drop** | `DragAndDrop` ✅ | Image or text targets; keyboard alternative required |
| P0 | **Drag the Words** | `DragTheWords` ✅ | Sub-type of drag + text |
| P0 | **Mark the Words** | `MarkTheWords` ✅ | Click/highlight; keyboard-selectable tokens |
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
| P1 | **Image Hotspots** | `ImageHotspots` ✅ | Regions + popovers; keyboard reachable hotspots |
| P1 | **Find the Hotspot** / **Find Multiple Hotspots** | `FindHotspot`, `FindMultipleHotspots` ✅ | Scored discovery tasks |
| P1 | **Image Slider** | `ImageSlider` ✅ | Carousel primitive |
| P2 | **Image Juxtaposition** | `ImageJuxtaposition` | Before/after slider |
| P2 | **Agamotto (Image Blender)** | `ImageSequence` | Progressive image sequence |
| P2 | **Collage** | `Collage` | Multi-image layout block |
| P2 | **Image Pairing** / **Image Sequencing** | `ImagePairing`, `ImageSequencing` | Memory/order games |
| P2 | **Memory Game** | `MemoryGame` | Card flip; focus management |
| P3 | **Iframe Embedder** | `Embed` (restricted) | Sandboxed, responsive; opt-in for security |
| P3 | **Chart** | `Chart` | Bar/pie; accessible data table fallback |

### Tier D — Text, cards, and informational content

| Priority | H5P content type | LessonKit target | Notes |
|----------|------------------|------------------|-------|
| P1 | **Accordion** | `Accordion` ✅ | Nest policy (no accordion-in-accordion) |
| P1 | **Dialog Cards** | `DialogCards` ✅ | Flip cards; reduced-motion safe |
| P1 | **Flashcards** | `Flashcards` ✅ | Study mode; optional self-score |
| P2 | **Timeline** | `Timeline` | Events + media; fragile as sub-content in H5P—test resize |
| P2 | **Table** | `Table` | Rich text table |
| P2 | **Information Wall** | `InformationWall` | Searchable panels |
| P3 | **Exportable Text Area / Cornell** | `CornellNotes`, `ExportableNotes` | Learner export (PDF/text) |
| P3 | **Personality Quiz** | `PersonalityQuiz` | Outcome buckets; community pattern, lower priority |
| P1 | **Audio Recorder** | `AudioRecorder` | Learner recording; consent + storage policy |
| P2 | **Slideshow (parallax)** | `ParallaxSlideshow` | Presentation variant; respect `prefers-reduced-motion` |

**Primitives (H5P sub-content):** `Text`, `Heading`, `Image`, and media blocks with shared semantics for compounds.

### Tier E — Games, puzzles, and novelty

Lower priority unless a customer/LMS parity request surfaces; still catalog for AI discoverability.

| H5P content type | LessonKit target | Priority |
|------------------|------------------|----------|
| Crossword | `Crossword` | P3 |
| Find the Words | `WordSearch` | P3 (keyboard a11y hard—H5P often excludes from compounds) |
| Combination Lock | `CombinationLock` | P3 |
| KewAr Code / QR | `QrContent` | P3 |
| Advent Calendar | `AdventCalendar` | P3 |
| Agora World (AR) | `AugmentedReality` | P4 / research |

### Tier F — Platform, authoring ecosystem, and interoperability

| H5P capability | LessonKit target | Milestone hint |
|----------------|------------------|----------------|
| **Content Type Hub** (discover/install/update libraries) | **Block registry** + documented npm packages (`@lessonkit/blocks-*` optional split); CLI `lessonkit blocks list` | CLI **1.6.x** |
| **`.h5p` import/export** | **`.lkcourse` / interchange** JSON + assets zip; optional **H5P import adapter** (read-only, map subset) | Framework **1.6.x** (research spike) |
| **Question-type contract** | `Assessment` interface + `block-contract` enforcement | Framework **1.1.x** ✅ |
| **Compound sub-content allowlists** | Per-parent `allowedChildTypes` in catalog | Framework **1.2.x** ✅ |
| **Resume / attempt state** | `getCurrentState` on assessments + compounds; session storage v2 | Framework **1.2.x** ✅ |
| **Hub OER / content reuse** | Template gallery + import from shared examples repo | Examples + docs **1.x** |
| **Community / third-party blocks** | Plugin `interactionBlocks` + marketplace | Framework plugins **2.x** |
| **LTI / embed** | Already via LMS packaging; document embed snippet for standalone | Docs + lxpack **1.x** |
| **Mobile (iOS / Android)** | **`@lessonkit/react-native`** — shared core contracts, native UI blocks, offline xAPI queue | Framework **2.x** |
| **Fresh UI / theming per widget** | Single `--lk-*` theme across all blocks (advantage over H5P per-library CSS) | Ongoing `@lessonkit/themes` |

### Implementation principles (learned from H5P)

When implementing backlog items, follow H5P's constraints **in React form**:

1. **Design by contract** — compound parents call documented methods on children (scores, reset, xAPI, resume).
2. **One implementation per block type per course build** — avoid duplicate library versions in nested trees (H5P global version lock).
3. **Sub-content curation** — not every block nests everywhere; document allowlists like H5P maintainers do.
4. **Keyboard-first** — exclude or fix patterns H5P excludes (e.g. non-keyboard word search) rather than shipping inaccessible compounds.
5. **Export parity** — every scored block must map to `lessonkit.json` assessments and LXPack descriptors.
6. **Machine-readable catalog** — each new block extends `block-catalog.v*.json` before downstream tools ship palette support.
7. **H5P documentation** — every shipped H5P-parity block completes the [checklist below](#h5p-documentation-checklist-per-block) in the same PR (or release) as the component.

### H5P documentation checklist (per block)

**Gate:** a framework block is not **done** for H5P parity until these are checked off (copy into PR description or release notes).

| # | Task | Where |
| --- | --- | --- |
| 1 | Set capability map **Status** to ✅ and confirm **Framework** column | [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md) master table |
| 2 | Add row: LessonKit id, **H5P display name**, **H5P machine name** (if known) | Same map + [block catalog](docs/reference/block-catalog.md) (v1 or v2 section) |
| 3 | Document props, `checkId` / `blockId`, a11y, telemetry, parent constraints | [block catalog](docs/reference/block-catalog.md) per-block section (or new subsection) |
| 4 | Add **H5P equivalent** admonition or table row on the block's doc touchpoints | At minimum: block catalog; [components guide](docs/guides/react-developers/components-and-hooks.md) table if public API; [H5P authors guide](docs/guides/h5p-for-lessonkit-authors.md) "Available today" or "Planned" table when status changes |
| 5 | Storybook story titled with **H5P name in subtitle** (e.g. "FillInTheBlanks — H5P Fill in the Blanks") | `packages/react/stories/` |
| 6 | If scored: example `lessonkit.json` `assessments[]` entry + export parity note | Golden example or [packaging guide](docs/reference/packaging.md) callout when first of kind |
| 7 | `h5pAlias` / `h5pMachineName` in **block-catalog JSON** entry | `block-catalog.v2.json` + `buildBlockCatalog()` |

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
Framework 2.x     @lessonkit/react-native (iOS/Android) + shared core/xapi contracts
```

**Documentation:** [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md) — traceability matrix (status ✅ as blocks ship). **Per-block gate:** [H5P documentation checklist](#h5p-documentation-checklist-per-block) required for every new H5P-parity feature. **Hub pages:** [`docs/guides/h5p-for-lessonkit-authors.md`](docs/guides/h5p-for-lessonkit-authors.md), [docs index](docs/index.md), [block catalog](docs/reference/block-catalog.md), components guide.

**Out of scope (explicit):** running H5P Core inside LessonKit exports; maintaining parity with every unmaintained H5P third-party type; iframe-first embed model.

---

## Milestone alignment

```text
0.1.x → 0.2.0 → 0.3.0 → 0.4.0 → 0.5.0 → 0.6.0 → 0.7.0 → 0.8.0+ → 0.9.x → 1.0.0
                                                                              │
Framework 1.1.x → 1.2.x → 1.3.x → 1.4.x → 1.5.x → 1.6.x+  (blocks + compounds)
Framework 2.x     @lessonkit/react-native (mobile delivery)
        ▲
        └── driven by H5P-aligned backlog (see above)
```
