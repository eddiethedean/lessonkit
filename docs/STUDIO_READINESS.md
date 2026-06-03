# Framework readiness for LessonKit Studio (and AI/dev workflows)

This checklist is how we decide the LessonKit **framework** is ready to act as the shared runtime
for:

- **Developers** authoring directly in React
- **AI code generators** producing LessonKit code (Claude/Cursor-style workflows)
- **LessonKit Studio** (a non-coder layer built on top, post–framework 1.0.0)

> **Framework 1.0.0 has shipped** — the Studio development gate is met. Studio implementation may begin per [ROADMAP](../project/roadmap.md).

## Readiness principles

- **Stable contracts**: API surfaces are documented, versioned, and testable.
- **Deterministic outputs**: builds/exports don’t rely on hidden randomness; regeneration yields minimal diffs.
- **Dual export parity**: React/Vite and LXPack/LMS artifacts match behavior and theme.
- **Machine-readable surfaces**: generators can discover supported primitives and constraints without scraping source.
- **Reusable building blocks**: components and themes are designed to be shared across projects (portable defaults, predictable override rules).

## 0.4.x — Theme system + tokens

- [x] Token schema v1 exists in `@lessonkit/themes` (required tokens + allowed extensions)
- [x] CSS variables contract is documented (namespacing, required variables, override precedence)
- [x] `@lessonkit/react` exposes a stable `ThemeProvider` (or equivalent) with default theme
- [x] Example demonstrates theme override and dark/light switching
- [x] **Enumerable theming**: “what can be themed” is documented and discoverable for generators
- [x] React/Vite example (`examples/react-vite`) consumes `--lk-*` tokens via `ThemeProvider`

## 0.5.x — Identity + semantics (IDs, telemetry, xAPI)

- [x] Identity model v1 is documented ([`IDENTITY.md`](../reference/identity.md)):
  - [x] `courseId` required on `Course` / `LessonkitProvider`
  - [x] `lessonId` required on `Lesson` (no runtime `useId` fallback)
  - [x] `checkId` required on `Quiz` / `KnowledgeCheck`; optional `blockId` on `Scenario` / `Reflection`
- [x] ID generation guidance is deterministic (`slugifyId`, `deriveId`, `validateId` in `@lessonkit/core`)
- [x] Telemetry event catalog is versioned (`telemetry-catalog.v1.json`, [`TELEMETRY.md`](../reference/telemetry.md))
- [x] Telemetry → xAPI mapping is canonical (`telemetryEventToXAPIStatement` in `@lessonkit/xapi`)
- [x] “Regenerate code” guidance exists in [`IDENTITY.md`](../reference/identity.md)

## 0.6.x — Export surfaces + `@lessonkit/lxpack` adapter

- [x] **Theme parity**: same tokens produce the same visual output in React/Vite and LXPack-packaged artifacts (via `@lessonkit/lxpack` runtime `cssVariables` bridge)
- [x] `@lessonkit/lxpack` exists and is covered by tests
- [x] Adapter produces a valid LXPack project/interchange with stable ID mapping
- [x] Adapter prefers programmatic LXPack APIs where possible (structured results/errors)
- [x] Golden end-to-end example exists:
  - [x] LessonKit course → LXPack build → SCORM ZIP importable into an LMS
  - [x] Standalone web artifact runnable locally
- [x] CI runs a packaging smoke test on the golden example
- [x] Output layout is stable and documented (so generators/CI can rely on it)

## 0.7.x — CLI workflow (developer + AI friendly)

- [x] `lessonkit init/dev/build` are real and documented
- [x] `lessonkit package` supports dual export targets:
  - [x] `react-vite`
  - [x] `lxpack|scorm12|scorm2004|xapi|cmi5` (via adapter)
- [x] CLI errors are structured and actionable (good messages, stable exit codes)
- [x] The CLI is safe for automation (CI-friendly, no interactive prompts by default)

## 0.8.x — Runtime block catalog (machine-readable)

- [x] Block catalog v1 exists (framework-owned)
- [x] Catalog includes per-block:
  - [x] allowed props/schema
  - [x] a11y behavior contract
  - [x] theming surface contract
  - [x] telemetry semantics
- [x] Catalog is exported in machine-readable form (JSON) and documented
- [x] `@lessonkit/react` is capable of rendering every framework catalog block in an example (v1 + v2 block catalog)

## 0.9.x — Conformance harness (parity proof)

- [x] Playwright e2e covers:
  - [x] keyboard navigation/focus flows
  - [x] telemetry / progress persistence on Vite surface
  - [x] telemetry batching + xAPI queue behavior (telemetry-harness Playwright project)
  - [x] packaging artifact smoke (standalone + SCORM 1.2 launch with LMS API mock)
- [x] Conformance matrix exists and is enforced in CI:
  - [x] `@lxpack/conformance` + golden package matrix scripts
  - [x] React/Vite, standalone, and SCORM 1.2 parity spec on `examples/lxpack-golden`
- [x] Contributor docs for Playwright e2e and packaging smoke ([export parity guide](../guides/react-developers/export-parity.md), [e2e README](https://github.com/eddiethedean/lessonkit/blob/main/e2e/README.md), [contributing E2E section](../guides/react-developers/contributing-to-the-monorepo.md#e2e-and-conformance))

## 0.8.0+ — Plugin architecture

- [x] Plugin contract v1 in `@lessonkit/core` (`LessonkitPlugin`, `createPluginRegistry`, `defineTelemetryPlugin`)
- [x] `@lessonkit/react` registers plugins on `LessonkitProvider` (`config.plugins`)
- [x] Extension points: lifecycle (`setup`/`dispose`), `onTelemetry`, `wrapTrackingSink`, `scoreAssessment`, `interactionBlocks` metadata
- [x] [Plugins reference](../reference/plugins.md) and [plugin cookbook](../guides/react-developers/plugin-cookbook.md)
- [x] Example plugin: `examples/_shared/plugins/consoleAnalyticsPlugin.ts`

## 1.1.0 — Assessment contract + Tier B P0 blocks (framework)

- [x] `AssessmentHandle` / `assessment_*` telemetry on P0 blocks (`TrueFalse`, `FillInTheBlanks`, `DragAndDrop`, `DragTheWords`, `MarkTheWords`, `AssessmentSequence`)
- [x] Block catalog v2 (`block-catalog.v2.json`) with interaction types
- [x] Example `examples/assessments-p0` and [MIGRATION-1.0-to-1.1.md](../MIGRATION-1.0-to-1.1.md)
- [x] `lessonkit init` template pins `^1.1.0`

## 1.0.0 — Studio gate checklist (framework)

- [x] Public APIs for `@lessonkit/react`, `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/themes`, `@lessonkit/accessibility` are stable and documented
- [x] Storybook + docs site are live and up to date
- [x] Accessibility conformance documented (WCAG 2.1 AA target)
- [x] Dual export parity is proven (conformance harness is green)
- [x] Packaging is documented end-to-end (React/Vite and LXPack/LMS targets)
- [x] **Generator-friendly API** checklist is met:
  - [x] predictable defaults
  - [x] stable prop shapes
  - [x] canonical reference example that is easy to scaffold and modify

## Studio 0.1.0 — Schema and shared renderer

- [x] `@lessonkit/studio-schema` in monorepo (`packages/studio-schema`) with `schemaVersion: 1`, parse / validate / normalize / migrate / load
- [x] `studio-project.v1.json` and `studio-block-catalog.v1.json` exported; catalog matches `buildStudioBlockCatalog()` in tests
- [x] `@lessonkit/studio-renderer` maps Studio blocks to `@lessonkit/react` (`Course`, `Lesson`, `Quiz`, `Scenario`) plus presentational primitives
- [x] Initial block types: text, heading, image, button, input, container, quiz, scenario (checklist / video: schema + stub renderer)
- [x] Example [studio-minimal](https://github.com/eddiethedean/lessonkit/tree/main/examples/studio-minimal) loads `src/project.json` via shared renderer
- [x] [Studio project format v1](../guides/studio/project-format-v1.md) documented
- [x] npm publish path: `studio-v*` tag → [Studio Release](https://github.com/eddiethedean/lessonkit/blob/main/.github/workflows/studio-release.yml) (see [RELEASING.md](https://github.com/eddiethedean/lessonkit/blob/main/RELEASING.md))

## Studio 0.2.0 — Visual editor MVP

- [x] `@lessonkit/studio-builder`: Zustand editor store, commands, undo/redo (bounded stack), validation on commit, debounced autosave subscription
- [x] `@lessonkit/studio-ui`: `StudioEditor` with page list, block palette, dnd-kit canvas (root + nested containers), property inspector, live preview
- [x] `apps/studio-web`: runnable Vite app; `localStorage` autosave; import/export JSON
- [x] Checklist / video blocks: minimal real preview renderers (not stubs)
- [x] Monorepo CI: `build:packages` includes `studio-builder` → `studio-ui`; `build:apps` includes `lessonkit-studio-web`
- [x] [Studio editor guide](../guides/studio/editor.md) documented
- [x] npm publish: `studio-v0.2.0` (schema, builder, renderer, ui)

> **Not included in 0.2.0:** codegen (`studio-codegen`), GitHub sync, AI workflows, `lessonkit-studio` CLI, Tauri desktop, schema v2.

## Studio 0.3.0 — Code generation and export

- [x] `@lessonkit/studio-codegen`: `studioProjectToDescriptor`, renderer + explicit JSX React/Vite export, Node helpers (`writeReactViteProject`, `writeLxpackProjectFromStudio`, `packageStudioProject`)
- [x] `@lessonkit/studio-ui`: `ExportPanel` (mode, theme, xAPI IRI, zip download hook, CLI snippet); canvas lazy block previews + root-list virtualization (30+ blocks)
- [x] `apps/studio-web`: Export panel wired with JSZip download; version label from package
- [x] Integration test: codegen → vite build → `lessonkit package --target scorm12`
- [x] Example [studio-export](https://github.com/eddiethedean/lessonkit/tree/main/examples/studio-export) and [Studio export guide](../guides/studio/export.md)
- [x] Monorepo: `build:packages` includes `studio-codegen`; Studio Release publishes five packages
- [x] npm publish: `studio-v0.3.0` (five Studio packages; framework pinned at 1.0.2 on npm tag)

> **Not included in 0.3.0:** GitHub sync (`studio-github`), AI workflows, `lessonkit-studio` CLI, Tauri desktop, schema v2, hosted `lessonkit.app`.

