# Enterprise evaluation

One-page summary for security, compliance, and platform teams evaluating LessonKit **1.6.x** (React-first authoring, SCORM/xAPI/cmi5 export, portable `.lkcourse` interchange).

## Product summary

- **What:** React-first framework + CLI for authoring trackable courses and exporting SCORM, xAPI, cmi5, or standalone SPAs.
- **What it is not:** Visual timeline authoring (Storyline/Captivate), H5P platform interop (`.h5p` import, Hub, runtime embedding), or an LMS. See [Design philosophy](design-philosophy.md).
- **License:** [Apache-2.0](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)
- **npm scope:** [@lessonkit/*](https://www.npmjs.com/org/lessonkit) (seven packages, aligned semver — current line **1.6.x**)

## Architecture

- Author in **React + TypeScript**; manifest **`lessonkit.json`** for packaging validation.
- Runtime: browser SPA with optional telemetry, xAPI, and LMS bridge.
- Packaging: **Node.js 20.19+** for new projects; **Node 18+** on legacy packaging-only agents; **LXPack** produces LMS artifacts.
- **1.6.x additions:** portable `.lkcourse` interchange (`lessonkit export`; import via `@lessonkit/lxpack` API), block registry CLI (`lessonkit blocks list`).

Diagram and package boundaries: [Architecture overview](architecture-overview.md). Export formats and LMS staging requirements: [LMS compatibility](../reference/lms-compatibility.md). Interchange: [Portable interchange](../reference/interchange.md).

## Security

| Topic | Detail |
| --- | --- |
| Supported versions | [Security policy](../project/security.md) — **1.6.x** current |
| Vulnerability reporting | GitHub private advisories (no public issues) |
| CI | `npm audit` (high/critical), CodeQL on `main`; release version sync (`conf.py` ↔ `packages/core`) |
| Client secrets | **Do not** embed LRS passwords; use backend token proxies |
| LMS bridge allowlist | Production `bridge: "auto"` requires `allowedParentOrigins` — blocks arbitrary parent-frame hijack |
| Learner data in browser | Compound state / resume in `sessionStorage` by default—disable on shared devices |
| Packaging | Path containment validation when `projectRoot` is set |

## Data and telemetry

- Telemetry events defined in versioned catalog (`@lessonkit/core/telemetry-catalog.v3.json`) — includes 1.5 branch events and 1.6 compound/content events.
- xAPI statements mapped via `@lessonkit/xapi`; you control LRS endpoint and retention.
- Production requires observability hooks when delivery is enabled—see [production checklist](react-developers/production-checklist.md).
- Demos on Read the Docs may log to console—**not** a production pattern.

## LMS and export parity

| Format | Repo evidence |
| --- | --- |
| SCORM 1.2 / 2004 | Playwright launch specs + `@lxpack/conformance` |
| xAPI / cmi5 | Conformance + launch tests |
| Standalone | Golden example + e2e |
| `.lkcourse` interchange | `lessonkit export` + `importLkcourse()` (lxpack) + validation tests |

Details: [LMS compatibility](../reference/lms-compatibility.md) · [Export parity](react-developers/export-parity.md) · [LMS Go-Live](react-developers/lms-go-live.md).

## Accessibility

- **Target:** WCAG 2.1 AA patterns for shipped components (framework **1.6.x** block catalog v3).
- **Status:** Component-level implementation; **no published VPAT**. Per-block interim status: [Accessibility conformance (interim)](../project/accessibility-conformance.md).
- **1.6.x blocks:** `Table`, `Timeline`, `Crossword`, `WordSearch`, `GameMap`, and other catalog v3 additions follow the same keyboard/ARIA patterns as 1.5 blocks where applicable.

## Support model

- Open source on GitHub; no commercial SLA documented in-repo.
- Issues: [github.com/eddiethedean/lessonkit/issues](https://github.com/eddiethedean/lessonkit/issues)
- Security: private advisories only

## Evaluation checklist

- [ ] Run `npx @lessonkit/cli init` (Node **20.19+**) and complete [5-minute guide](react-developers/getting-started-in-5-minutes.md)
- [ ] Follow [LMS Go-Live](react-developers/lms-go-live.md); import SCORM zip into staging LMS
- [ ] Verify completion/score with `lxpack.bridge: "auto"` and `allowedParentOrigins` set to staging LMS origin(s)
- [ ] Review telemetry/xAPI flow with your security team ([deployment guide](react-developers/deployment-guide.md) · [LRS operations](react-developers/lrs-operations.md))
- [ ] Run accessibility QA on representative blocks your course will use (see [conformance matrix](../project/accessibility-conformance.md))
- [ ] Optionally evaluate `.lkcourse` export for internal handoff ([interchange reference](../reference/interchange.md))
- [ ] Pin aligned `@lessonkit/*` versions; run `npm audit` in your course repo
- [ ] Read [Upgrade guide](upgrading-lessonkit.md) for semver policy

## When not to adopt

- No React/frontend capacity and no plan to use AI-assisted authoring ([vibe coding](vibe-coding/index.md) still requires Node **20.19+** + CLI).
- Requirement for WYSIWYG-only authoring with zero code.
- Need for guaranteed compatibility with a specific LMS without staging tests.

See also [FAQ](faq.md).
