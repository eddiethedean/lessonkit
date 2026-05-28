# Releasing LessonKit

Published packages: `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/accessibility`, `@lessonkit/react`, `@lessonkit/themes`, `@lessonkit/cli`.

## Prerequisites

- `main` is green (see [CI workflow](.github/workflows/ci.yml)).
- All `packages/*/package.json` versions match the release (e.g. `0.3.0`).
- [CHANGELOG.md](CHANGELOG.md) documents the release.
- No pending files in [`.changeset/`](.changeset/) that would run `changeset version` and bump versions unexpectedly (this repo publishes via **git tags**, not `changeset publish`).

## Publish to npm (tag-based)

1. Confirm locally:

   ```bash
   npm ci
   npm run build
   npm test
   npm run coverage
   ```

2. Commit and push any release-prep changes on `main`.

3. Create and push the version tag (triggers [`.github/workflows/release.yml`](.github/workflows/release.yml)):

   ```bash
   git tag v0.3.0
   git push origin v0.3.0
   ```

4. Verify the **Release** workflow on GitHub Actions and packages on [npm](https://www.npmjs.com/org/lessonkit).

The release job sets each package version from the tag, aligns `@lessonkit/*` dependency ranges, builds, and runs `npm publish` for all six packages. Requires the `NPM_TOKEN` repository secret.

## After release

- Confirm npm shows `0.3.0` for each `@lessonkit/*` package.
- Optional: create a GitHub Release from the tag with notes copied from [CHANGELOG.md](CHANGELOG.md).

## Changesets

`changeset version` / `changeset publish` are available for future workflows but are **not** used for the current tag-based publish path. Do not run `changeset version` on a branch that is already at the target version unless you intend to bump again.
