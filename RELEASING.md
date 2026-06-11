# Releasing LessonKit

Published packages (`v*.*.*` tag → [Release](.github/workflows/release.yml)): `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/accessibility`, `@lessonkit/themes`, `@lessonkit/lxpack`, `@lessonkit/react`, `@lessonkit/cli`

## Current release (1.7.1)

### Pre-tag checklist

| Item | Action |
|------|--------|
| All seven `@lessonkit/*` packages at target version | Verify `package.json` in each workspace |
| [CHANGELOG.md](CHANGELOG.md) | Section for the release documents user-facing changes |
| [docs/conf.py](docs/conf.py) `release` | Matches npm version |
| Migration guide | Add/update `docs/MIGRATION-*.md` and link from [upgrading-lessonkit](docs/guides/upgrading-lessonkit.md) |
| Init template | `lessonkit init` pins `^<version>` on `@lessonkit/*` |
| Template sync | `npm run copy-template -w @lessonkit/cli` then `git diff --exit-code packages/cli/template` |
| Quality gates | See [CONTRIBUTING.md](CONTRIBUTING.md#full-ci-equivalent-checks) |
| Git tag | `v<semver>` when ready to publish |

> **Do not create or push a version tag** until you intend to publish to npm.

### Publish flow

1. Merge release branch to `main` with changelog and version bumps.
2. Run full CI checks locally (or confirm GitHub Actions green).
3. Create and push tag `v*.*.*`.
4. [Release workflow](.github/workflows/release.yml) publishes to npm.

## Historical checklists

Older version-specific checklists (1.4.0, 1.3.x, …) live in [docs/project/release-history.md](docs/project/release-history.md).

## Docs version surfaces

Keep these in sync when bumping version:

- `docs/conf.py` → `release` (also drives `myst_substitutions.release` and the home hero badge via `v{{ release }}` in [docs/index.md](docs/index.md))
- [README.md](README.md) release table
- Init template `package.json` dependency pins

After bumping `release`, run `sphinx-build -W -b html docs docs/_build/html` then `npm run docs:verify` — CI fails if the hero still shows a literal `{{ release }}` or any other unexpanded substitution token.
