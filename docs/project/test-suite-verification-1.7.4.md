# Test suite verification report (1.7.4)

Independent behavioral audit of LessonKit’s test suite after the 1.7.4 version alignment. Production code and tests were treated as potentially sharing incorrect assumptions; expectations were anchored in docs/contracts (`IDENTITY`, packaging/export parity, CHANGELOG 1.7.x, xAPI reference) rather than mirroring implementation.

## Executive summary

**Overall confidence: Moderate**

The suite already had strong anchors for recent 1.7.3 regressions (autoCheck stale pass, resume replay helpers) and solid xAPI transport/idempotency coverage. This pass removed several sources of **false confidence** (unconditional standalone parity green, weak event presence checks, circular-ish interchange validation, coverage-theater naming) and added contract-level regressions for resume replay and packaging artifacts.

Confidence is not **High** because: many block suites still use `toBeTruthy`/`toBeDefined`; `coverage-full.*` files remain large grab-bags; example `App.test` smokes remain minimal; and full Playwright e2e was only selectively re-run after browser install (parity matrix verified green).

## Verification gates actually run

| Gate | Result |
|------|--------|
| `npm run build:packages` | Pass |
| `npm test` (all workspaces) | Pass |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run test:integration` (17 files / 53 tests) | Pass |
| `playwright test tests/parity/matrix.spec.ts --project=golden-vite` | Pass (after Chromium install + assertion fix) |
| Full `npm run test:e2e` | Not fully green initially (missing Playwright browsers); selective parity re-run after install |

## Incorrect tests

| Finding | Why incorrect | Resolution |
|---------|---------------|------------|
| `e2e/tests/parity/matrix.spec.ts` set `results.standalone = true` after flow without asserting pass UI | Would stay green if packaged assessments never marked complete | Assert LXPack nav `✓` via `expectPackagedAssessmentPassed` for standalone **and** scorm12 UI (packaged shell ≠ React `role=status`) |
| First strengthened attempt used React `data-lk-check-id` + `role=status` on packaged shell | Shared hallucination that Vite and packaged shells share the same DOM contract | Corrected to packaged-shell checkmarks; documented in fixture comment |

## Weak tests (remaining / partially addressed)

- **`packages/react/test/compound.test.tsx`** — still ~40+ `toBeTruthy` uses; tightened pass/fail resume replay payloads and InteractiveBook page text.
- **`coverage-full.*` (react/cli/lxpack)** — renamed describes to reflect edge-behavior intent; still coverage-oriented grab-bags. Prefer extracting named suites over time rather than treating them as confidence.
- **Example/template `App.test.tsx`** — smoke-only; do not treat as behavioral confidence.
- **Integration descriptor parity** — still regex-scrapes source for IDs; strengthened with `ID_PATTERN` contract checks (not full packaged-manifest semantic parity).

## Tests rewritten

- Resume replay assertions in `compound.test.tsx` and `assessment-handles.test.tsx` now require **event payloads** (`correct`, `score`, `maxScore`), not mere event name presence.
- `ImagePairing` render check asserts **four** list items (two pairs), not `length > 0`.
- CLI `package.integration` SCORM path unpacks zip and asserts `imsmanifest.xml` has a resource `href` and course id string.
- xAPI `assessment_*` mapping asserts **check URNs** against identity URN shape from docs.
- Themes: assert `base.css` ships `--lk-touch-target-min` / `--lk-touch-spacing` (1.7 touch contract).

## Tests added

| Test | Why it increases confidence |
|------|-----------------------------|
| `packages/react/test/resume-replay-contract.test.tsx` | GuessTheAnswer / ImagePairing failed-terminal replay + opt-out when `replayResumeEvents` is false — CHANGELOG 1.7.3 contract beyond previously named blocks |
| Extra `resumeState` edge cases | Explicit `completed: false` wins over legacy `passed`; submitted-only terminal; retry+checked not terminal |
| Core identity URN contract + unicode/emoji rejection + uppercase acceptance | Aligns runtime with `identity-contract.v1.json`, not only happy-path slugs |
| lxpack stable interchange shape for injectable MCQ | Asserts nested `questions[].prompt/choices[].correct` against fixed descriptor — reduces A→B→A circularity |
| Integration identity validation on golden IDs | Uses exported `ID_PATTERN` as independent gate |

## Tests removed

None deleted wholesale. `coverage-full.*` suites were **retitled** rather than deleted to avoid a large coverage cliff without equivalent named suites; backlog item remains to split them.

## Missing coverage (highest priority remaining)

1. **Block-wide autoCheck contract** — only FillInTheBlanks / DragTheWords implement `autoCheck`; keep regressions, but audit any future autoCheck blocks for shared stale-`passed` bug.
2. **Resume replay matrix** — not every assessment block has a failed-terminal contract test; prioritize Quiz/KnowledgeCheck and high-traffic Tier B/C blocks.
3. **Packaging artifact content** — more targets (cmi5/xapi) should assert launch + activity IRI in unpacked XML, not only exit code / zip exists.
4. **Split `coverage-full.*`** into named behavioral files; delete residual padding.
5. **Mutation testing** still absent — introduce Stryker (or similar) on `resumeState`, scoring helpers, and `telemetryMap` first.
6. **E2E depth** — resume across export targets; SCORM score fields beyond lesson_status.

## AI failure patterns found

- **Shared hallucination:** Vite React feedback DOM assumed identical to LXPack packaged shell.
- **Weak assertions:** `toBeTruthy` / event-name-only / unconditional `true` after “happy path” helpers.
- **Coverage theater:** large `coverage-full` files named for metrics, not behavior.
- **Circular validation:** descriptor→interchange→validate against same transform (mitigated with fixed expected shape).
- **String/regex parity:** source scrapes as packaging confidence (mitigated with identity pattern checks; still incomplete).

## Confidence assessment

Behavioral confidence is **improved from Low–Moderate toward Moderate**, especially around:

- assessment resume replay contracts
- SCORM packaging artifact presence
- identity/xAPI URN alignment
- export parity matrix honesty for packaged shells

It is **not yet High**: residual weak asserts, coverage grab-bags, and incomplete e2e/mutation coverage leave room for shared AI mistakes in less-audited blocks.

## Follow-ups

- Continue replacing `toBeTruthy` in compound/block suites with exact UI/score/event assertions.
- Extract behavioral cases from `coverage-full.*`.
- Add cmi5/xapi artifact content asserts in CLI/integration.
- Run full `npm run test:e2e` in CI-equivalent environments with browsers preinstalled.
