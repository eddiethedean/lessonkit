# Releasing LessonKit

Published packages: `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/accessibility`, `@lessonkit/react`, `@lessonkit/themes`, `@lessonkit/cli`.

## Prerequisites

- `main` is green (see [CI workflow](.github/workflows/ci.yml)).
- All `packages/*/package.json` versions match the release (e.g. `0.5.0`).
- [CHANGELOG.md](CHANGELOG.md) documents the release.
- No pending files in [`.changeset/`](.changeset/) that would run `changeset version` and bump versions unexpectedly (this repo publishes via **git tags**, not `changeset publish`).

### 0.5.0 checklist (before tagging)

| Item | Status |
|------|--------|
| `main` CI green ([workflow](.github/workflows/ci.yml): build, typecheck, test, coverage on Node 18 + 20) | Required |
| All six `@lessonkit/*` packages at `0.5.0` in `package.json` | Required |
| `@lessonkit/react` depends on `@lessonkit/*@0.5.0` | Required |
| [CHANGELOG.md](CHANGELOG.md) `## [0.5.0]` includes Added / Changed / Breaking / Fixed / Migration | Required |
| `docs/IDENTITY.md`, `docs/TELEMETRY.md`, `docs/STUDIO_READINESS.md` 0.5.x items | Done in repo |
| Examples/templates use required ids (`courseId`, `lessonId`, `checkId`) | Done in repo |
| No pending `.changeset/*.md` files (would bump versions unexpectedly) | Required |
| npm latest is `0.4.0` (0.5.0 not published yet) | Expected until tag |
| Git tag `v0.5.0` does not exist yet | Create on publish |
| `NPM_TOKEN` secret configured on GitHub | Required for Release workflow |

**Breaking note for consumers:** `courseId`, `lessonId`, and `checkId` are required on core components (see [CHANGELOG.md](CHANGELOG.md) and [`docs/IDENTITY.md`](docs/IDENTITY.md)).

> **Do not create or push a `v0.5.0` git tag** until you intend to publish to npm. Tagging triggers the Release workflow.

## Publish to npm (tag-based)

1. Confirm locally:

   ```bash
   npm ci
   npm run build
   npm test
   npm run typecheck
   npm run coverage
   ```

2. Commit and push any release-prep changes on `main`.

3. When ready to publish, create and push the version tag (triggers [`.github/workflows/release.yml`](.github/workflows/release.yml)):

   ```bash
   git tag v0.5.0
   git push origin v0.5.0
   ```

4. Verify the **Release** workflow on GitHub Actions and packages on [npm](https://www.npmjs.com/org/lessonkit).

The release job sets each package version from the tag, aligns `@lessonkit/*` dependency ranges, builds, and runs `npm publish` for all six packages. Requires the `NPM_TOKEN` repository secret.

## After release

- Confirm npm shows `0.5.0` for each `@lessonkit/*` package.
- Optional: create a GitHub Release from the tag with notes copied from [CHANGELOG.md](CHANGELOG.md).

## Changesets

`changeset version` / `changeset publish` are available for future workflows but are **not** used for the current tag-based publish path. Do not run `changeset version` on a branch that is already at the target version unless you intend to bump again.
