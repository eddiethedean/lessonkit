# Releasing LessonKit

Published packages: `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/accessibility`, `@lessonkit/react`, `@lessonkit/themes`, `@lessonkit/cli`.

## Prerequisites

- `main` is green (see [CI workflow](.github/workflows/ci.yml)).
- All `packages/*/package.json` versions match the release (e.g. `0.5.0`).
- [CHANGELOG.md](CHANGELOG.md) documents the release.
- No pending files in [`.changeset/`](.changeset/) that would run `changeset version` and bump versions unexpectedly (this repo publishes via **git tags**, not `changeset publish`).

### 0.4.0 checklist (before tagging)

| Item | Status |
|------|--------|
| All six `@lessonkit/*` packages at `0.4.0` in `package.json` | Required |
| `@lessonkit/react` depends on `@lessonkit/themes@0.4.0` | Required |
| [CHANGELOG.md](CHANGELOG.md) `## [0.4.0]` includes Added / Changed / Fixed | Required |
| `docs/THEMING.md`, `docs/STUDIO_READINESS.md` 0.4.x items | Done in repo |
| npm latest is `0.3.1` (0.4.0 not published yet) | Expected until tag |
| Git tag `v0.4.0` does not exist yet | Create on publish |
| `NPM_TOKEN` secret configured on GitHub | Required for Release workflow |

**Breaking note for consumers:** `LessonkitTheme` is now the full `LessonkitThemeV1` schema (see CHANGELOG).

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
   git tag v0.4.0
   git push origin v0.4.0
   ```

4. Verify the **Release** workflow on GitHub Actions and packages on [npm](https://www.npmjs.com/org/lessonkit).

The release job sets each package version from the tag, aligns `@lessonkit/*` dependency ranges, builds, and runs `npm publish` for all six packages. Requires the `NPM_TOKEN` repository secret.

## After release

- Confirm npm shows `0.4.0` for each `@lessonkit/*` package.
- Optional: create a GitHub Release from the tag with notes copied from [CHANGELOG.md](CHANGELOG.md).

## Changesets

`changeset version` / `changeset publish` are available for future workflows but are **not** used for the current tag-based publish path. Do not run `changeset version` on a branch that is already at the target version unless you intend to bump again.
