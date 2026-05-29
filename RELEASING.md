# Releasing LessonKit

Published packages: `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/accessibility`, `@lessonkit/react`, `@lessonkit/themes`, `@lessonkit/lxpack`, `@lessonkit/cli`.

## Prerequisites

- `main` is green (see [CI workflow](.github/workflows/ci.yml)).
- All `packages/*/package.json` versions match the release (e.g. `0.9.0`).
- [CHANGELOG.md](CHANGELOG.md) documents the release.
- No pending files in [`.changeset/`](.changeset/) that would run `changeset version` and bump versions unexpectedly (this repo publishes via **git tags**, not `changeset publish`).

### 0.9.0 checklist (before tagging)

| Item | Status |
|------|--------|
| `main` CI green (includes `test:e2e` and conformance scripts) | Done ([CI run 26645268211](https://github.com/eddiethedean/lessonkit/actions/runs/26645268211) on `9f4b897`) |
| All seven `@lessonkit/*` packages at `0.9.0` in `package.json` | Done |
| `@lessonkit/react` / `@lessonkit/lxpack` / `@lessonkit/cli` depend on matching `@lessonkit/*@0.9.0` | Done |
| `lessonkit init` template pins `^0.9.0` for `@lessonkit/*` | Done (`copy-template.mjs`) |
| `npm run test:e2e` passes locally (Node 20) | Done (2026-05-29) |
| `conformance:lxpack` + `conformance:golden` pass locally | Done (2026-05-29) |
| Local release prep: `build`, `test`, `typecheck`, `coverage`, golden `package:*` | Done (2026-05-29) |
| [CHANGELOG.md](CHANGELOG.md) `## [0.9.0]` (plugins + conformance harness) | Done |
| Sphinx `docs/conf.py` `release` matches `0.9.0` | Done |
| No pending `.changeset/*.md` files | Done (only `config.json`) |
| Git tag `v0.9.0` | Create when ready to publish to npm |

> **Do not create or push a `v0.9.0` git tag** until you intend to publish to npm.

### 0.8.2 checklist (shipped)

| Item | Status |
|------|--------|
| Git tag `v0.8.2` | Published |

### 0.8.1 checklist (shipped)

| Item | Status |
|------|--------|
| Git tag `v0.8.1` | Published |

### 0.8.0 checklist (before tagging)

| Item | Status |
|------|--------|
| `main` CI green ([workflow](.github/workflows/ci.yml): build, typecheck, test, coverage on Node 18 + 20; packaging + CLI smoke on Node 20) | Required |
| All seven `@lessonkit/*` packages at `0.8.0` in `package.json` | Required |
| `@lessonkit/react` / `@lessonkit/lxpack` / `@lessonkit/cli` depend on matching `@lessonkit/*@0.8.0` | Required |
| `lessonkit init` template (`packages/cli/scripts/copy-template.mjs`) pins `^0.8.0` for `@lessonkit/*` | Required |
| [CHANGELOG.md](CHANGELOG.md) `## [0.8.0]` includes Added / Changed | Required |
| `docs/STUDIO_READINESS.md` 0.8.x block catalog items complete | Required |
| `@lessonkit/react/block-catalog.v1.json` shipped in package `files` + `exports` | Required |
| Golden example packages via `lessonkit package` in CI | Required |
| `lessonkit init` template bundled in `@lessonkit/cli` | Required |
| No pending `.changeset/*.md` files (would bump versions unexpectedly) | Required |
| Git tag `v0.8.0` does not exist yet | Create on publish |
| `NPM_TOKEN` secret configured on GitHub | Required for Release workflow |

**Notes for 0.8.0 consumers:** `@lessonkit/cli` `package` LMS targets require **Node.js 20+** (same as `@lessonkit/lxpack`). Dev/build work on Node 18+. Import the block catalog via `@lessonkit/react/block-catalog.v1.json`.

> **Do not create or push a `v0.8.0` git tag** until you intend to publish to npm. Tagging triggers the Release workflow.

## Publish to npm (tag-based)

1. Confirm locally:

   ```bash
   npm ci
   npm run build
   npm test
   npm run typecheck
   npm run coverage
   npm run package:scorm12 -w lessonkit-example-lxpack-golden
   npm run package:standalone -w lessonkit-example-lxpack-golden
   ```

2. Commit and push any release-prep changes on `main`.

3. When ready to publish, create and push the version tag (triggers [`.github/workflows/release.yml`](.github/workflows/release.yml)):

   ```bash
   git tag v0.9.0
   git push origin v0.9.0
   ```

4. Verify the **Release** workflow on GitHub Actions and packages on [npm](https://www.npmjs.com/org/lessonkit).

The release job sets each package version from the tag, aligns `@lessonkit/*` dependency ranges, builds, and runs `npm publish` for all seven packages. Requires the `NPM_TOKEN` repository secret.

## After release

- Confirm npm shows `0.9.0` for each `@lessonkit/*` package.
- Optional: create a GitHub Release from the tag with notes copied from [CHANGELOG.md](CHANGELOG.md).

## Changesets

`changeset version` / `changeset publish` are available for future workflows but are **not** used for the current tag-based publish path. Do not run `changeset version` on a branch that is already at the target version unless you intend to bump again.
