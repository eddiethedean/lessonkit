# LessonKit Roadmap

Execution plan for the `@lessonkit/*` framework: shippable semver milestones, H5P-*aligned* block expansion (patterns only—no H5P runtime), and platform tooling. For product vision see [PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md); for API contracts see [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md) and [Read the Docs](https://lessonkit.readthedocs.io/en/latest/).

**Audience:** maintainers and contributors. Course authors should use [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/) instead.

---

## At a glance

| | |
| --- | --- |
| **Latest release** | **1.7.4** — all seven `@lessonkit/*` packages |
| **Shipped themes** | React course shell, 50+ blocks, compounds, telemetry/xAPI, CLI, LMS packaging, `.lkcourse` interchange, block registry |
| **Current focus** | **1.7.x** — Tier B P1 assessments + additive `Quiz` variants (see **What's next** below) |
| **Next majors** | **1.8.x** — `VirtualTour` (360) · **2.x** — `@lessonkit/react-native` + writing-tool compounds |

Release notes: [CHANGELOG.md](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md) · shipped block traceability: [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md)

---

## Related documents

| Document | Purpose |
| --- | --- |
| [PLAN.md](https://github.com/eddiethedean/lessonkit/blob/main/PLAN.md) | Product vision and positioning |
| [SPEC.md](https://github.com/eddiethedean/lessonkit/blob/main/SPEC.md) | Historical technical spec (superseded by RTD reference for shipped API) |
| [CHANGELOG.md](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md) | What actually shipped, by version |
| [RELEASING.md](https://github.com/eddiethedean/lessonkit/blob/main/RELEASING.md) | Changesets and npm publish |
| [H5P capability map](docs/project/h5p-capability-map.md) | **Canonical** H5P machine name → LessonKit block matrix |
| [Block catalog](docs/reference/block-catalog.md) | Props, a11y, telemetry per block |
| [LXPack upgrades](docs/reference/lxpack-upgrades.md) | Packaging interoperability |

---

## Guiding principles

- **React-first** — courses are components and `lessonkit.json`, not timeline authoring.
- **Accessibility-first** — WCAG 2.1 AA target; keyboard and focus by default.
- **Interop-ready** — telemetry and xAPI in dev; SCORM/xAPI/cmi5 via `@lessonkit/lxpack`.
- **Proven interactions** — adopt high-value [H5P content-type *patterns*](https://h5p.org/content-types-and-applications) as native React blocks. **Not** `.h5p` import, H5P Hub, or H5P Core embedding.
- **DX + AI readiness** — fast `lessonkit init`, machine-readable block catalog, deterministic export layouts.
- **Stable API** — semver from **1.0.0**; pin all `@lessonkit/*` to the same version.

---

## Release timeline

```text
Foundation (shipped)     0.1.x ──► 0.9.x ──► 1.0.0 stable API
Framework blocks         1.1.x ──► 1.6.0   compounds + content waves + interchange
Planned                  1.7.x ──► 1.8.x ──► 2.x (mobile + writing tools)
```

### Foundation releases (0.x → 1.0.0) — shipped

All pre-1.0 milestones are **complete** and folded into the **1.0.0** public API.

| Milestone | Theme | Key packages / outputs |
| --- | --- | --- |
| 0.1.x | MVP | `@lessonkit/react` shell components, hooks, examples, Storybook |
| 0.2.0 | Analytics | `@lessonkit/core` session + event model; telemetry sinks; xAPI queue |
| 0.3.0 | Accessibility | `@lessonkit/accessibility` focus trap, roving tabindex, reduced motion |
| 0.4.x | Theming | `@lessonkit/themes` `--lk-*` tokens; `ThemeProvider` |
| 0.5.x | Identity | Required `courseId`, `lessonId`, `checkId`; URNs — [identity ref](docs/reference/identity.md) |
| 0.6.x | Packaging | `@lessonkit/lxpack`; SCORM/xAPI/cmi5; golden example |
| 0.7.x | CLI | `lessonkit init`, `dev`, `build`, `package` |
| 0.8.x | Block catalog | Machine-readable catalog; plugin host v1 — [plugins](docs/reference/plugins.md) |
| 0.9.x | Conformance | Playwright e2e, export parity smoke, integration tests |
| **1.0.0** | **Stable API** | Semver contract, docs site, migration from 0.x — **2026-05-30** |

---

### Framework 1.x — shipped summary

Detailed per-release notes live in [CHANGELOG.md](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md). Migration guides: `docs/MIGRATION-*.md`.

| Version | Headline | Golden examples |
| --- | --- | --- |
| **1.1.0** | Assessment contract; Tier B P0 (`TrueFalse`, `FillInTheBlanks`, `DragAndDrop`, `DragTheWords`, `MarkTheWords`, `AssessmentSequence`); catalog v2 | `examples/assessments-p0`, `framework-11-showcase` |
| **1.2.0** | Compounds (`Page`, `InteractiveBook`); Tier C/D P1 blocks; catalog v3 allowlists; resume v2 | `examples/interactive-book` |
| **1.3.0** | `SlideDeck` / `Slide`; `slide_viewed` telemetry | `examples/slide-deck` |
| **1.4.0** | `InteractiveVideo`, `Video`, `TimedCue`; Tier B/C/D bundle (Summary, Essay, MemoryGame, …) | `examples/interactive-video` |
| **1.5.0** | `BranchingScenario` graph; `Embed`, `Chart`; branch telemetry | `examples/branching-scenario` |
| **1.6.0** | `.lkcourse` export; `lessonkit blocks list`; content-wave blocks; `GameMap` | `examples/framework-12-showcase`, `lxpack-golden` |
| **1.7.0** | Tier B P1 assessments (`SortParagraphs`, `GuessTheAnswer`, `MultimediaChoice`, `SingleChoiceSet`) | `examples/assessments-p0` |

#### 1.4.x — InteractiveVideo + bundled blocks

**Status:** Shipped in **1.4.0**.

Compound video uses the same machinery as `SlideDeck` / `InteractiveBook` (`CompoundHandle`, session resume v2) with **time-based** `TimedCue` navigation instead of slide index. Shipped: `Video`, `TimedCue`, `InteractiveVideo`, timeline telemetry (`video_cue_reached`, `video_segment_completed`), and bundled Tier B/C/D blocks (Summary, ImagePairing, Essay, MemoryGame, …). See [MIGRATION-1.3-to-1.4.md](docs/MIGRATION-1.3-to-1.4.md) and [CHANGELOG — 1.4.0](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md).

#### 1.5.x — BranchingScenario

**Status:** Shipped in **1.5.0**.

Graph compound: `BranchingScenario`, `BranchNode`, `BranchChoice`; visited-path scoring and resume; `branch_node_viewed` / `branch_selected` telemetry; `useBranchingScenario()`. Also shipped: restricted `Embed`, `Chart`, path recap UI. See [MIGRATION-1.4-to-1.5.md](docs/MIGRATION-1.4-to-1.5.md).

#### 1.6.x — Portable interchange and content waves

**Status:** Shipped in **1.6.0**.

Platform: `.lkcourse` archive (`lessonkit export`), interchange spec, `exportLkcourse` / `validateLkcourse` / `importLkcourse`, `lessonkit blocks list`. Content wave: `Table`, `Timeline`, `Crossword`, `WordSearch`, `GameMap`, and other Tier C–E blocks (see capability map). Plugin marketplace remains research only — [plugin marketplace research](docs/guides/plugin-marketplace-research.md). See [MIGRATION-1.5-to-1.6.md](docs/MIGRATION-1.5-to-1.6.md).

---

## What's next

### 1.7.x — Tier B P1 assessments {#17x--tier-b-p1-assessments}

**Status:** Shipped in **1.7.0** — four P1 blocks plus **`Quiz` variants** (multi-select, shuffle, per-choice feedback). Tier B P1 complete.

See [MIGRATION-1.6-to-1.7.md](docs/MIGRATION-1.6-to-1.7.md) and [CHANGELOG — 1.7.0](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md).

---

### 1.7.x — Tier B P1 assessments (reference)

**Goal:** Ship the four Tier B P1 question types deferred since 1.1.x, then extend `Quiz` for common MCQ variants—all **additive**, no breaking changes to the assessment contract or existing blocks.

**Why now:** Compounds, resume, export parity, and `.lkcourse` interchange are stable through 1.6.x. Remaining LMS-author demand is concentrated in question-type gaps (ordering, reveal, media options, sequential MCQ sets) rather than new containers.

#### Scope at a glance

| Track | Targets | Target release |
| --- | --- | --- |
| **A — New blocks** | `SortParagraphs`, `GuessTheAnswer`, `MultimediaChoice`, `SingleChoiceSet` | **1.7.0** |
| **B — `Quiz` variants** | Multi-select, choice shuffle, per-choice feedback | **1.7.0** |

#### Architecture notes

| Block | Model | Reuse |
| --- | --- | --- |
| `SortParagraphs` | Single `checkId`; ordered `paragraphs[]` + `correctOrder: number[]` | `AssessmentHandle`; keyboard reorder (same bar as `DragAndDrop`); new `interactionType: "sortParagraphs"` |
| `GuessTheAnswer` | Prompt + hidden answer; optional scored text field before reveal | Unscored reveal-only mode allowed; scored mode uses `AssessmentHandle` |
| `MultimediaChoice` | MCQ with `choices: { label, mediaUrl, mediaKind, altText? }[]` | Extends MCQ shell; **requires** text alternative for every option; captions for audio |
| `SingleChoiceSet` | **Compound** — sequential `Quiz` steps with shared chrome | Reuses `AssessmentSequence` navigation + `CompoundHandle` score aggregation; distinct catalog entry and H5P mapping (`H5P.SingleChoiceSet`) |

`SingleChoiceSet` is **not** a duplicate of `AssessmentSequence`: H5P Single Choice Set is a homogeneous MCQ run (one question type, unified progress UI). Implementation: thin compound wrapper with `sequential` defaults and MCQ-only child allowlist—or equivalent single component if the wrapper adds no author value (decide in 1.7.0 design PR).

**`Quiz` extensions (track B):** additive props on `McqAssessmentProps` in `@lessonkit/core`—e.g. `answers?: string[]` (multi-select), `shuffleChoices?: boolean`, `choiceFeedback?: Record<string, string>`. Default behaviour unchanged when props omitted. LXPack descriptor schema gains optional fields; packaging remains backward compatible.

#### Phased deliverables

**1.7.0 — four P1 blocks**

- [x] **`@lessonkit/react`**: four components implementing `AssessmentHandle` (where scored); exports from `index.tsx`
- [x] **`@lessonkit/core`**: `AssessmentInteractionType` entries; compound allowlist updates (`ASSESSMENT_SEQUENCE`, `Page`, `Slide`, `BranchNode`, `TimedCue` as applicable); resume state shapes
- [x] **`@lessonkit/xapi`**: mappers for new interaction types
- [x] **`@lessonkit/lxpack`**: descriptor kinds for packaging (where scored); manifest parity validation
- [x] **`block-catalog.v3.json`**: four entries with `h5pMachineName`, tier **B**, assessment contract flags
- [x] **Telemetry catalog v3**: `assessment_answered` / block-specific payloads where needed (no duplicate `quiz_*` events for MCQ-shaped blocks)
- [x] **Tests**: unit per block; compound gating (Check before Next); resume round-trip inside `AssessmentSequence`
- [x] **Golden path**: extend `examples/assessments-p0` or add a focused lesson in `framework-11-showcase`
- [x] **Docs**: [MIGRATION-1.6-to-1.7.md](docs/MIGRATION-1.6-to-1.7.md); capability map ✅; [H5P doc checklist](#h5p-documentation-checklist-per-block) per block
- [x] **CI**: integration SCORM smoke for at least one new scored block; e2e spot-check in compounds

**1.7.0 — `Quiz` variants (track B)**

- [x] Multi-select MCQ (`answers: string[]`, partial credit policy documented)
- [x] `shuffleChoices` (stable seed optional for resume)
- [x] Per-choice feedback strings (a11y: announced with selection)
- [x] Storybook + packaging tests for extended `McqAssessmentProps`

#### Per-block acceptance (1.7.0)

| Block | Scored | Must pass |
| --- | --- | --- |
| `SortParagraphs` | Yes | Keyboard reorder; screen-reader order announcements; export parity; works in `AssessmentSequence` |
| `GuessTheAnswer` | Optional | Reveal control keyboard-accessible; scored mode syncs `checkId` with `lessonkit.json` |
| `MultimediaChoice` | Yes | No image-only options; audio has text equivalent; same MCQ telemetry/xAPI shape as `Quiz` |
| `SingleChoiceSet` | Yes | Aggregated score across steps; resume restores step index + child quiz states; SCORM score matches visited steps |

#### Depends on

- **1.1.x** — `AssessmentHandle`, `buildAssessmentHandle`, plugin scoring, `AssessmentSequence`
- **1.2.x–1.6.x** — compound allowlists, resume v2, export parity patterns, strict `checkId` dedupe in compounds

#### Out of scope for 1.7.x

- H5P import or `.h5p` transport
- **Tier B P2** — `SpeakTheWords`, `Dictation`, `AdvancedBlanks` (backlog after 1.7.x)
- AI auto-grading beyond existing `scoreAssessment` plugin hook
- Nested compounds inside new assessment blocks
- Full H5P parity for feedback animations, sound effects, or timed per-question limits (document gaps instead)

#### Success criteria

- All four P1 capability-map rows move from ⬜ to ✅ with framework **1.7.0**.
- `lessonkit blocks list --tier B` includes new entries; `lessonkit package --target scorm12` succeeds on golden example with new assessments.
- Each new scored block completes export parity (standalone + SCORM) and the [H5P documentation checklist](#h5p-documentation-checklist-per-block).
- No semver-major breaking changes to `@lessonkit/react` public props on existing blocks.

### 1.8.x — VirtualTour (360) (planned)

**Goal:** H5P-aligned `VirtualTour` compound — 360 asset pipeline, hotspot model, keyboard-accessible navigation.

**Depends on:** compound allowlists, content-wave media patterns from 1.6.x.

### 2.x — Mobile and writing tools (planned)

| Track | Deliverables |
| --- | --- |
| **`@lessonkit/react-native`** | Shared `@lessonkit/core` / `@lessonkit/xapi` / `@lessonkit/themes`; `Course`, `Lesson`, Tier B P0 assessments; Expo golden app; block parity matrix vs web |
| **Writing / docs compounds** | `DocumentationTool`, `StructureStrip`, `ExportableNotes`, `PersonalityQuiz` (demand-driven) |
| **Plugin ecosystem** | Dynamic plugin loading, LMS connector presets, marketplace (beyond 1.6.x preset packs) |

**Out of scope for initial react-native:** in-app SCORM packaging (stays web + `@lessonkit/lxpack`); WebView-as-primary renderer.

See also: [2.x — `@lessonkit/react-native`](#2x--lessonkitreact-native-planned) (detail).

### 2.x — `@lessonkit/react-native` (planned)

- **Reuse:** `@lessonkit/core`, `@lessonkit/xapi` (AsyncStorage queue adapter), `@lessonkit/themes` (native tokens).
- **Ship first:** provider shell, `Course` / `Lesson`, Tier B P0 assessments, compound resume via storage port.
- **Tests:** adapt export-parity patterns (Detox or Maestro) where feasible.
- **Docs:** React Native quickstart, platform limits, parity matrix.

---

## H5P-aligned capability backlog

[H5P](https://h5p.org/) is a **pattern reference only**. LessonKit ships native React blocks with identity v1, WCAG targets, telemetry, export parity, and catalog JSON.

**Do not duplicate this table in PRs.** The master traceability matrix lives in [`docs/project/h5p-capability-map.md`](docs/project/h5p-capability-map.md). Update that file when a block ships; keep this section for **planning tiers and process**.

**Legend:** ✅ shipped · 🟡 partial · ⬜ planned · 🚫 out of scope

### Shipped coverage (summary)

| Tier | Theme | Status |
| --- | --- | --- |
| **A** | Compounds: book, deck, video, branching, game map | All P0 ✅; `VirtualTour` ⬜ 1.8.x |
| **B** | Assessments / question types | P0 ✅; P1 ✅ **1.7.0** (four blocks + `Quiz` variants); P2 speech/dictation ⬜ backlog |
| **C–E** | Media, cards, puzzles | Shipped through **1.6.0** (see capability map) |
| **F** | Platform (registry, `.lkcourse`, packaging) | Shipped **1.6.0**; mobile ⬜ **2.x** |

### Planned blocks (not yet shipped)

| Priority | LessonKit target | Milestone | Tier |
| --- | --- | --- | --- |
| P2 | `SpeakTheWords`, `SpeakTheWordsSet`, `Dictation` | Backlog | B |
| P2 | `AdvancedBlanks` | Backlog | B |
| P2 | `VirtualTour` | 1.8.x | A |
| P3 | `DocumentationTool`, `StructureStrip`, `ExportableNotes`, `PersonalityQuiz` | 2.x | A/D |
| P4 | `AugmentedReality` | Research | E |

### Platform analogues (Tier F)

| H5P analogue (not integrated) | LessonKit approach | Status |
| --- | --- | --- |
| Content Type Hub | `lessonkit blocks list` + `block-catalog.v3.json` | ✅ 1.6.0 |
| `.h5p` transport | `.lkcourse` zip + interchange spec | ✅ 1.6.0 |
| `.h5p` import / Hub | — | 🚫 Out of scope |
| H5P `semantics.json` editor | Block catalog + React props | 🚫 Out of scope |
| Question-type contract | `Assessment` interface + block-contract | ✅ 1.1.x |
| Compound allowlists | `allowedChildTypes` in catalog | ✅ 1.2.x |
| Resume / attempts | `getCurrentState` + session v2 | ✅ 1.2.x |
| Mobile apps | `@lessonkit/react-native` | ⬜ 2.x |
| Community libraries | Plugin marketplace | ⬜ 2.x (presets: [research](docs/guides/plugin-marketplace-research.md)) |

### Implementation principles

When adding backlog items:

1. **Design by contract** — compounds call documented assessment methods (score, reset, resume, xAPI).
2. **One block type per build** — avoid duplicate implementations in nested trees.
3. **Curated nesting** — document allowlists; exclude inaccessible patterns (e.g. `WordSearch` in compounds).
4. **Keyboard-first** — fix or exclude; do not ship inaccessible compound children.
5. **Export parity** — scored blocks map to `lessonkit.json` and LXPack descriptors.
6. **Catalog first** — extend `block-catalog.v3.json` before palette or codegen tools.
7. **Docs gate** — complete the [checklist below](#h5p-documentation-checklist-per-block) in the same release as the component.

### H5P documentation checklist (per block)

A block is not **done** for H5P parity until all items are checked (copy into PR or release notes):

| # | Task | Where |
| --- | --- | --- |
| 1 | Set capability map **Status** to ✅; confirm **Framework** column | [`h5p-capability-map.md`](docs/project/h5p-capability-map.md) |
| 2 | Add H5P display + machine name row | Capability map + [block catalog](docs/reference/block-catalog.md) |
| 3 | Document props, IDs, a11y, telemetry, parent constraints | Block catalog per-block section |
| 4 | Update authors guide shipped/planned tables | [H5P authors guide](docs/guides/h5p-for-lessonkit-authors.md) |
| 5 | Storybook subtitle includes H5P display name | `packages/react/stories/` |
| 6 | If scored: `lessonkit.json` assessment entry + export parity note | Golden example or [packaging](docs/reference/packaging.md) |
| 7 | Set `h5pMachineName` / `h5pAlias` on catalog JSON entry | `block-catalog.v3.json` |

---

## Explicit non-goals

- H5P Core, H5P Hub, `.h5p` import/merge/export, H5P `semantics.json` transport
- Visual timeline authoring (Studio was removed; React-only)
- Iframe-first H5P embeds as the primary delivery model
- Parity with every unmaintained H5P third-party type
- Full H5P parity on day one for any single block — ship incrementally and document gaps

---

## How to use this doc

| If you are… | Start here |
| --- | --- |
| Shipping a release | [CHANGELOG.md](https://github.com/eddiethedean/lessonkit/blob/main/CHANGELOG.md) + [RELEASING.md](https://github.com/eddiethedean/lessonkit/blob/main/RELEASING.md); update **At a glance** and shipped summary above |
| Adding a block | [Adding a framework block](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/adding-a-framework-block.html) + [checklist](#h5p-documentation-checklist-per-block) + capability map |
| Planning a quarter | **What's next** + capability map planned rows |
| Evaluating the product | [Enterprise evaluation](https://lessonkit.readthedocs.io/en/latest/guides/enterprise-evaluation.html) on Read the Docs |

When this roadmap and the capability map disagree, **the capability map wins** for block-level status; **CHANGELOG wins** for what shipped in a given version.
