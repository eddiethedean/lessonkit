# Test suite verification report (1.7.4)

Independent behavioral audit of LessonKit’s test suite after the 1.7.4 version alignment. Production code and tests were treated as potentially sharing incorrect assumptions; expectations were anchored in docs/contracts (`IDENTITY`, packaging/export parity, CHANGELOG 1.7.x, xAPI reference) rather than mirroring implementation.

## Executive summary

**Overall confidence: Moderate → High-Moderate**

The suite already had strong anchors for recent 1.7.3 regressions (autoCheck stale pass, resume replay helpers) and solid xAPI transport/idempotency coverage. Follow-up gap-fill closed the highest-priority holes called out in the initial audit: Quiz/KnowledgeCheck/FillInTheBlanks/DragAndDrop resume-replay contracts, xAPI/cmi5 artifact IRI asserts, SCORM score fields, compound assertion tightening, and extracting ThemeProvider behavior from coverage theater.

Remaining gaps are mostly tooling (mutation testing) and breadth (more blocks / resume-across-export e2e), not core contract blindness.

## Verification gates actually run

| Gate | Result |
|------|--------|
| `npm run build:packages` | Pass (initial audit) |
| `npm test` (all workspaces) | Pass (initial audit) |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass (initial audit) |
| `npm run test:integration` | Pass (initial + gap-fill `cli-package-targets`) |
| Targeted react/cli unit suites for gap-fill | Pass |
| `playwright` parity matrix + scorm12 launch (score asserts) | Pass |

## Incorrect tests

| Finding | Why incorrect | Resolution |
|---------|---------------|------------|
| `e2e/tests/parity/matrix.spec.ts` set `results.standalone = true` after flow without asserting pass UI | Would stay green if packaged assessments never marked complete | Assert LXPack nav `✓` via `expectPackagedAssessmentPassed` for standalone **and** scorm12 UI (packaged shell ≠ React `role=status`) |
| First strengthened attempt used React `data-lk-check-id` + `role=status` on packaged shell | Shared hallucination that Vite and packaged shells share the same DOM contract | Corrected to packaged-shell checkmarks; documented in fixture comment |

## Weak tests (remaining / partially addressed)

- **`packages/react/test/compound.test.tsx`** — ~35 high-value presence checks tightened to exact text/testid content; a few `sessionStorage` raw truthiness checks remain.
- **`coverage-full.*` (react/cli/lxpack)** — ThemeProvider system-mode extracted to `theme-system-mode.test.tsx`; remaining grab-bag still exists for provider/telemetry edges.
- **Example/template `App.test.tsx`** — smoke-only by design; not treated as behavioral confidence.
- **Integration descriptor parity** — still regex-scrapes source for IDs; strengthened earlier with `ID_PATTERN`.

## Tests rewritten

- Resume replay assertions require **event payloads** (`correct`, `score`, `maxScore` / quiz `choice`).
- CLI SCORM / xAPI / cmi5 packaging unpacks XML and asserts launch + identity/activity content.
- Integration `assertXapiZip` / `assertCmi5Zip` optionally require golden activity IRI.
- SCORM e2e asserts `cmi.core.score.raw` is present and > 0 (not only `lesson_status`).
- Compound navigation/branching UI asserts exact copy instead of `toBeTruthy`.

## Tests added

| Test | Why it increases confidence |
|------|-----------------------------|
| `resume-replay-contract.test.tsx` (expanded) | Quiz, KnowledgeCheck, FillInTheBlanks, DragAndDrop failed-terminal replay + GuessTheAnswer/ImagePairing + opt-out |
| `autocheck-inventory.test.ts` | Only FIB/DTW implement `props.autoCheck` — prevents catalog/runtime drift for stale-pass class bugs |
| `theme-system-mode.test.tsx` | Named behavioral suite extracted from coverage-full |
| CLI xapi/cmi5 packaging cases | `tincan.xml` / `cmi5.xml` contain configured activity IRI and launch URL |
| Core identity / xAPI URN asserts (prior pass) | Contract alignment independent of implementation literals |

## Tests removed

ThemeProvider system-mode case removed from `coverage-full.test.tsx` (moved to named file). Residual `coverage-full.*` retained to avoid coverage cliffs; still not a primary confidence signal.

## Missing coverage (remaining backlog)

1. **Mutation testing** — still absent; introduce Stryker (or similar) on `resumeState`, scoring helpers, and `telemetryMap` when maintainers want CI cost.
2. **Resume across export targets (e2e)** — packaged shell resume/replay not covered in Playwright.
3. **Further `coverage-full` splits** — provider/telemetry edges can become named suites incrementally.
4. **Remaining compound `sessionStorage` truthiness** — prefer parsed JSON shape asserts.
5. **Broader resume matrix** — remaining Tier C/D assessment blocks without failed-terminal contract tests.

## Closed from prior “highest priority remaining”

1. ~~autoCheck inventory~~ — `autocheck-inventory.test.ts`
2. ~~Resume replay matrix (Quiz/KC/FIB/DnD)~~ — expanded contract file
3. ~~Packaging artifact content (cmi5/xapi)~~ — CLI + integration IRI asserts
4. ~~Partial coverage-full split~~ — ThemeProvider extracted
5. ~~E2E SCORM score fields~~ — parity + scorm12 launch

## AI failure patterns found

- **Shared hallucination:** Vite React feedback DOM assumed identical to LXPack packaged shell.
- **Weak assertions:** `toBeTruthy` / event-name-only / unconditional `true` after “happy path” helpers.
- **Coverage theater:** large `coverage-full` files named for metrics, not behavior.
- **Circular validation:** descriptor→interchange→validate against same transform (mitigated with fixed expected shape).
- **String/regex parity:** source scrapes as packaging confidence (mitigated with identity pattern + artifact XML checks).

## Confidence assessment

Behavioral confidence is **High-Moderate** for the audited contracts (resume replay, packaging XML, identity/xAPI URNs, SCORM completion+score, autoCheck scope).

It is **not yet High** overall until mutation testing and broader block/e2e resume coverage land.
