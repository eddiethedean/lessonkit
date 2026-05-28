# Releasing LessonKit

Published packages: `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/accessibility`, `@lessonkit/react`, `@lessonkit/themes`, `@lessonkit/lxpack`, `@lessonkit/cli`.

## Prerequisites

- `main` is green (see [CI workflow](.github/workflows/ci.yml)).
- All `packages/*/package.json` versions match the release (e.g. `0.6.0`).
- [CHANGELOG.md](CHANGELOG.md) documents the release.
- No pending files in [`.changeset/`](.changeset/) that would run `changeset version` and bump versions unexpectedly (this repo publishes via **git tags**, not `changeset publish`).

### 0.6.0 checklist (before tagging)

| Item | Status |
|------|--------|
| `main` CI green ([workflow](.github/workflows/ci.yml): build, typecheck, test, coverage on Node 18 + 20; packaging smoke on Node 20) | Required |
| All seven `@lessonkit/*` packages at `0.6.0` in `package.json` | Required |
| `@lessonkit/react` / `@lessonkit/lxpack` depend on matching `@lessonkit/*@0.6.0` | Required |
| [CHANGELOG.md](CHANGELOG.md) `## [0.6.0]` includes Added / Changed | Required |
| `docs/PACKAGING.md`, `docs/IDENTITY.md`, `docs/STUDIO_READINESS.md` 0.6.x items | Done in repo |
| Golden example packages SCORM 1.2 and standalone in CI | Required |
| Examples/templates use required ids (`courseId`, `lessonId`, `checkId`) | Done in repo |
| No pending `.changeset/*.md` files (would bump versions unexpectedly) | Required |
| Git tag `v0.6.0` does not exist yet | Create on publish |
| `NPM_TOKEN` secret configured on GitHub | Required for Release workflow |

**Notes for 0.6.0 consumers:** `@lessonkit/lxpack` requires **Node.js 20+** for packaging. LMS export uses the lxpack adapter; the CLI `lessonkit package` command remains a stub until 0.7.x.

> **Do not create or push a `v0.6.0` git tag** until you intend to publish to npm. Tagging triggers the Release workflow.

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
   git tag v0.6.0
   git push origin v0.6.0
   ```

4. Verify the **Release** workflow on GitHub Actions and packages on [npm](https://www.npmjs.com/org/lessonkit).

The release job sets each package version from the tag, aligns `@lessonkit/*` dependency ranges, builds, and runs `npm publish` for all seven packages. Requires the `NPM_TOKEN` repository secret.

## After release

- Confirm npm shows `0.6.0` for each `@lessonkit/*` package.
- Optional: create a GitHub Release from the tag with notes copied from [CHANGELOG.md](CHANGELOG.md).

## Changesets

`changeset version` / `changeset publish` are available for future workflows but are **not** used for the current tag-based publish path. Do not run `changeset version` on a branch that is already at the target version unless you intend to bump again.
