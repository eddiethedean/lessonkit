# Enterprise evaluation

One-page summary for security, compliance, and platform teams evaluating LessonKit **1.5.x**.

## Product summary

- **What:** React-first framework + CLI for authoring trackable courses and exporting SCORM, xAPI, cmi5, or standalone SPAs.
- **What it is not:** Visual timeline authoring (Storyline/Captivate), embedded H5P runtime, or an LMS. See [Design philosophy](design-philosophy.md).
- **License:** [Apache-2.0](https://github.com/eddiethedean/lessonkit/blob/main/LICENSE)
- **npm scope:** [@lessonkit/*](https://www.npmjs.com/org/lessonkit) (seven packages, aligned semver)

## Architecture

- Author in **React + TypeScript**; manifest **`lessonkit.json`** for packaging validation.
- Runtime: browser SPA with optional telemetry, xAPI, and LMS bridge.
- Packaging: **Node.js 18+** on build agents; **LXPack** produces LMS artifacts.

Diagram and package boundaries: [Architecture overview](architecture-overview.md). Export formats and LMS staging requirements: [LMS compatibility](../reference/lms-compatibility.md).

## Security

| Topic | Detail |
| --- | --- |
| Supported versions | [Security policy](../project/security.md) — **1.5.x** current |
| Vulnerability reporting | GitHub private advisories (no public issues) |
| CI | `npm audit` (high/critical), CodeQL on `main` |
| Client secrets | **Do not** embed LRS passwords; use backend token proxies |
| LMS bridge allowlist | Production `bridge: "auto"` requires `allowedParentOrigins` — blocks arbitrary parent-frame hijack |
| Learner data in browser | Compound state / resume in `sessionStorage` by default—disable on shared devices |
| Packaging | Path containment validation when `projectRoot` is set |

## Data and telemetry

- Telemetry events defined in versioned catalog (`@lessonkit/core/telemetry-catalog.v3.json`).
- xAPI statements mapped via `@lessonkit/xapi`; you control LRS endpoint and retention.
- Production requires observability hooks when delivery is enabled—see [production checklist](react-developers/production-checklist.md).
- Demos on Read the Docs may log to console—**not** a production pattern.

## LMS and export parity

| Format | Repo evidence |
| --- | --- |
| SCORM 1.2 / 2004 | Playwright launch specs + `@lxpack/conformance` |
| xAPI / cmi5 | Conformance + launch tests |
| Standalone | Golden example + e2e |

Details: [LMS compatibility](../reference/lms-compatibility.md) · [Export parity](react-developers/export-parity.md).

## Accessibility

- **Target:** WCAG 2.1 AA patterns for shipped components.
- **Status:** Component-level implementation; **no published VPAT**. See [Accessibility reference](../reference/accessibility.md) and [Accessibility conformance (interim)](../project/accessibility-conformance.md).

## Support model

- Open source on GitHub; no commercial SLA documented in-repo.
- Issues: [github.com/eddiethedean/lessonkit/issues](https://github.com/eddiethedean/lessonkit/issues)
- Security: private advisories only

## Evaluation checklist

- [ ] Run `npx @lessonkit/cli init` and complete [5-minute guide](react-developers/getting-started-in-5-minutes.md)
- [ ] Import SCORM zip into staging LMS; verify completion/score with `lxpack.bridge: "auto"` and `allowedParentOrigins` set to staging LMS origin(s)
- [ ] Review telemetry/xAPI flow with your security team ([deployment guide](react-developers/deployment-guide.md) · [LRS operations](react-developers/lrs-operations.md))
- [ ] Run accessibility QA on representative blocks your course will use
- [ ] Pin `@lessonkit/*` versions; run `npm audit` in your course repo
- [ ] Read [Upgrade guide](upgrading-lessonkit.md) for semver policy

## When not to adopt

- No React/frontend capacity and no plan to use AI-assisted authoring ([vibe coding](vibe-coding/index.md) still requires Node + CLI).
- Requirement for WYSIWYG-only authoring with zero code.
- Need for guaranteed compatibility with a specific LMS without staging tests.

See also [FAQ](faq.md).
