# Security Policy

## Supported versions

LessonKit framework **1.x** is the current line on `main`. Security fixes are applied to the latest
release on `main` and backported to the current npm `@lessonkit/*` versions when practical.

| Version | Supported |
| ------- | --------- |
| 1.3.x   | Yes       |
| 1.2.x   | Yes       |
| 1.1.x   | Best effort |
| 1.0.x   | Best effort |
| < 1.0   | No        |

Published packages: [@lessonkit on npm](https://www.npmjs.com/org/lessonkit).

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use one of these channels:

1. **[GitHub private vulnerability reporting](https://github.com/eddiethedean/lessonkit/security/advisories/new)** (preferred)
2. Contact the maintainer via the email listed on their [GitHub profile](https://github.com/eddiethedean)

Include as much detail as you can:

- Affected package(s) (`@lessonkit/react`, `@lessonkit/lxpack`, etc.) and version
- Steps to reproduce or a minimal proof of concept
- Impact (e.g. XSS in exported course, path traversal in packaging, data exfiltration via telemetry)
- Any suggested fix, if you have one

## What we consider in scope

- Vulnerabilities in LessonKit source under `packages/`, `examples/`, and `templates/`
- Dependency issues that affect consumers of published `@lessonkit/*` packages
- CI/packaging flows documented in [`docs/PACKAGING.md`](docs/reference/packaging.md) (e.g. unsafe archive paths, partial export artifacts)

Out of scope (please report to the upstream project instead):

- Vulnerabilities only in dev-only tooling that is not shipped to npm
- Issues in third-party LMS hosts, LXPack itself, or course content authored by end users
- General hardening requests without a demonstrated exploit

## Response expectations

- **Acknowledgement:** within 5 business days
- **Triage:** within 10 business days (severity and affected versions)
- **Fix or mitigation:** target 30 days for high/critical issues on supported versions

We will coordinate disclosure with you and credit reporters in the advisory when desired.

## Automated security checks

CI runs on every push and pull request to `main`:

| Check | What it does |
| ----- | ------------ |
| **npm audit** | Fails on **high** or **critical** vulnerabilities in the lockfile (production and full tree) |
| **CodeQL** | Static analysis for JavaScript/TypeScript across the monorepo |

See [`.github/workflows/checks.yml`](https://github.com/eddiethedean/lessonkit/blob/main/.github/workflows/checks.yml).

## Secure development practices

When building or packaging courses:

- Pin `@lessonkit/*` versions and run `npm audit` in your app
- Treat `courseId`, `lessonId`, and `checkId` as stable identifiers, not user-controlled HTML
- Use `validateDescriptor` / `packageLessonkitCourse` from `@lessonkit/lxpack` rather than hand-editing exported manifests
- Keep `spaPath` values relative and validated (see [`docs/PACKAGING.md`](docs/reference/packaging.md))
- Configure xAPI transports over HTTPS and avoid logging learner PII in custom telemetry sinks
- When `persistCompoundState` is enabled (default in 1.2.0), learner progress and assessment answers are stored in **browser `sessionStorage`** for the tab; disable it on shared or kiosk devices (`session: { persistCompoundState: false }`) and set a unique `blockId` on each compound container

## Security updates

Fixed security issues are noted under **Fixed** in [CHANGELOG](docs/project/changelog.md) and, when
published, via [GitHub Security Advisories](https://github.com/eddiethedean/lessonkit/security/advisories).
