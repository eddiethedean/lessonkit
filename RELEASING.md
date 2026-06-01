# Releasing LessonKit

Published packages:

- **LessonKit** (`v*.*.*` tag → [Release](.github/workflows/release.yml)): `@lessonkit/core`, `@lessonkit/xapi`, `@lessonkit/accessibility`, `@lessonkit/react`, `@lessonkit/themes`, `@lessonkit/lxpack`, `@lessonkit/cli`
- **Studio** (`studio-v*` tag → [Studio Release](.github/workflows/studio-release.yml)): `@lessonkit/studio-schema`, `@lessonkit/studio-renderer`

Normal `v1.0.3` tags **do not** publish or re-version Studio packages. Studio uses its own semver line (e.g. `0.1.0`) and tag prefix.

## Prerequisites

- `main` is green (see [CI workflow](.github/workflows/ci.yml)).
- All `packages/*/package.json` versions match the release (e.g. `1.0.2`).
- [CHANGELOG.md](CHANGELOG.md) documents the release.
- No pending files in [`.changeset/`](.changeset/) that would run `changeset version` and bump versions unexpectedly (this repo publishes via **git tags**, not `changeset publish`).

> **1.0.0** is the stable public API release. See [MIGRATION-0.x-to-1.0.md](docs/MIGRATION-0.x-to-1.0.md).

### Studio 0.1.0 checklist (ready to publish)

| Item | Status |
|------|--------|
| `@lessonkit/studio-schema` and `@lessonkit/studio-renderer` at `0.1.0` | Done |
| `private: false`, `publishConfig`, `prepublishOnly`, README on both packages | Done |
| [CHANGELOG.md](CHANGELOG.md) `## [studio-v0.1.0]` | Done |
| [studio-release.yml](.github/workflows/studio-release.yml) + [prepare-publish.mjs](scripts/release/prepare-publish.mjs) | Done |
| `packages/core` at `1.0.2` (Studio publish pins `@lessonkit/*` to this version) | Done |
| `main` CI green | Verify before tag |
| `npm run lint` + `typecheck` + `test` + `coverage` | Verify before tag |
| `NPM_TOKEN` can publish `@lessonkit` (same org as core/react) | Done — Studio uses `@lessonkit/studio-schema` and `@lessonkit/studio-renderer` |
| Local pack smoke: `node scripts/release/prepare-publish.mjs studio 0.1.0 && npm run build:packages && npm pack -w @lessonkit/studio-schema --dry-run` (then `git checkout -- packages/studio-*/package.json`) | Optional |
| Git tag `studio-v0.1.0` | **Create when ready** — triggers Studio npm publish |

> **Do not create or push `studio-v0.1.0`** until you intend to publish to npm. Normal `v*` tags do not publish Studio.

### 1.0.2 checklist (ready to publish)

| Item | Status |
|------|--------|
| All seven `@lessonkit/*` packages at `1.0.2` | Done |
| Internal `@lessonkit/*` workspace deps pinned to `1.0.2` | Done |
| Sphinx `docs/conf.py` `release` matches `1.0.2` | Done |
| `lessonkit init` template pins `^1.0.2` (`copy-template.mjs`) | Done |
| [CHANGELOG.md](CHANGELOG.md) `## [1.0.2]` documents the patch | Done |
| No pending `.changeset/*.md` files | Done (only `config.json`) |
| Vitest 4.1.8+ (GHSA-5xrq-8626) | Done |
| `npm run lint` + `typecheck` + `test` + `coverage` + `test:integration` | Verified locally (2026-06-01) |
| `npm run test:e2e` + `build-storybook` (react/lxpack changes) | Verified locally (2026-06-01) |
| `npm run copy-template -w @lessonkit/cli` (template in sync) | Verified locally (2026-06-01) |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities (2026-06-01; 3 moderate dev-only Storybook/uuid on full audit) |
| Git tag `v1.0.2` | **Create when ready** — triggers npm publish |

> **Do not create or push a `v1.0.2` git tag** until you intend to publish that version to npm.

### 1.0.1 checklist (ready to publish)

| Item | Status |
|------|--------|
| All seven `@lessonkit/*` packages at `1.0.1` | Done |
| Internal `@lessonkit/*` workspace deps pinned to `1.0.1` | Done |
| Sphinx `docs/conf.py` `release` matches `1.0.1` | Done |
| `lessonkit init` template pins `^1.0.1` (`copy-template.mjs`) | Done |
| [CHANGELOG.md](CHANGELOG.md) `## [1.0.1]` documents the patch | Done |
| No pending `.changeset/*.md` files | Done (only `config.json`) |
| `main` CI green | Done — [CI run 26723716648](https://github.com/eddiethedean/lessonkit/actions/runs/26723716648) (2026-05-31) |
| `npm run lint` + `typecheck` + `test` + `coverage` | Verified locally (2026-05-31) |
| `npm run test:integration` + `test:e2e` + `build-storybook` | Verified locally (2026-05-31) |
| `npm run conformance:lxpack` + `conformance:golden` | Verified locally (2026-05-31) |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities (2026-05-31) |
| Git tag `v1.0.1` | **Create when ready** — triggers npm publish |

> **Do not create or push a `v1.0.1` git tag** until you intend to publish that version to npm.

### 1.0.0 checklist (before tagging)

| Item | Status |
|------|--------|
| `main` CI green (includes Storybook build) | Done — [CI run 26691621420](https://github.com/eddiethedean/lessonkit/actions/runs/26691621420) (2026-05-30) |
| All seven `@lessonkit/*` packages at `1.0.0` | Done |
| Deprecated APIs removed (`buildTrackEvent`, `defineLessonkitPlugin`, `createPluginHost`, `setLxpackBridgeMode`) | Done |
| `runtimeVersion` defaults to `"v2"` | Done |
| [MIGRATION-0.x-to-1.0.md](docs/MIGRATION-0.x-to-1.0.md) reviewed | Done |
| [CHANGELOG.md](CHANGELOG.md) `## [1.0.0]` (+ maintenance entries on `main`) | Done |
| Sphinx `docs/conf.py` `release` matches `1.0.0` | Done |
| `npm run build-storybook` passes | Done (local, 2026-05-30) |
| `npm run build` + `npm test` + `npm run typecheck` + `npm run coverage` | Done (local, 2026-05-30) |
| `npm run test:integration` + `npm run test:e2e` + conformance scripts | Done (local, 2026-05-30) |
| No pending `.changeset/*.md` files | Done (only `config.json`) |
| `NPM_TOKEN` secret configured on GitHub | Done |
| npm latest is still **0.9.3** (1.0.0 not published yet) | Verified 2026-05-30 |
| Git tag `v1.0.0` | **Not created** — create when ready to publish to npm |

> **Do not create or push a `v1.0.0` git tag** until you intend to publish to npm.

### 1.0.0-beta.1 checklist (before tagging)

| Item | Status |
|------|--------|
| `main` CI green | Required |
| All seven `@lessonkit/*` packages at `1.0.0-beta.1` | Done (local) |
| [MIGRATION-0.x-to-1.0.md](docs/MIGRATION-0.x-to-1.0.md) | Done |
| [CHANGELOG.md](CHANGELOG.md) `## [1.0.0-beta.1]` | Done (local) |
| Sphinx `docs/conf.py` `release` matches `1.0.0-beta.1` | Done (local) |
| `npm run build` + `npm test` + `npm run typecheck` | Required before tag |

### 0.9.3 checklist (before tagging)

| Item | Status |
|------|--------|
| `main` CI green (includes `test:e2e` with telemetry-harness project) | Required — verify on push |
| All seven `@lessonkit/*` packages at `0.9.3` in `package.json` | Done (local) |
| `@lessonkit/react` / `@lessonkit/lxpack` / `@lessonkit/cli` depend on matching `@lessonkit/*@0.9.3` | Done (local) |
| `lessonkit init` template pins `^0.9.3` for `@lessonkit/*` | Historical (1.0 uses `^1.0.0` in `copy-template.mjs`) |
| [CHANGELOG.md](CHANGELOG.md) `## [0.9.3]` (bugfix pass) | Done (local) |
| Sphinx `docs/conf.py` `release` matches `0.9.3` | Done |
| `npm run build` + `npm test` + `npm run typecheck` + `npm run audit:ci` | Done (local, 2026-05-29) |
| `npm run test:integration` + `npm run test:e2e` (13 specs) + conformance scripts | Done (local, 2026-05-29) |
| No pending `.changeset/*.md` files | Done (only `config.json`) |
| Commit all release changes on `main` | Required before tag |
| Git tag `v0.9.3` | Create when ready to publish to npm |

> **Do not create or push a `v0.9.3` git tag** until you intend to publish to npm.

### 0.9.2 checklist (shipped)

### 0.9.1 checklist (before tagging)

| Item | Status |
|------|--------|
| `main` CI green (includes `test:e2e` with telemetry-harness project) | Required — verify on push |
| All seven `@lessonkit/*` packages at `0.9.1` in `package.json` | Done (local) |
| `@lessonkit/react` / `@lessonkit/lxpack` / `@lessonkit/cli` depend on matching `@lessonkit/*@0.9.1` | Done (local) |
| `lessonkit init` template pins `^0.9.1` for `@lessonkit/*` | Done (`copy-template.mjs`) |
| `npm run test:e2e` passes (10 specs: golden-vite + telemetry-harness) | Done (local, 2026-05-29) |
| `conformance:lxpack` + `conformance:golden` pass | Done (local, 2026-05-29) |
| [CHANGELOG.md](CHANGELOG.md) `## [0.9.1]` (includes 0.9.1 bugfix pass) | Done (local) |
| Sphinx `docs/conf.py` `release` matches `0.9.1` | Done |
| `npm run build` + `npm test` + `npm run typecheck` + `npm run audit:ci` | Done (local, 2026-05-29) |
| No pending `.changeset/*.md` files | Done (only `config.json`) |
| Commit all release changes on `main` | Required before tag |
| Git tag `v0.9.1` | Create when ready to publish to npm |

> **Do not create or push a `v0.9.1` git tag** until you intend to publish to npm.

### 0.9.0 checklist (shipped)

| Item | Status |
|------|--------|
| Git tag `v0.9.0` | Published |

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

**Notes for 0.8.0 consumers:** `@lessonkit/cli` `package` LMS targets required **Node.js 20+** (same as `@lessonkit/lxpack` at that release). **1.0.0+** requires **Node.js 18+** for LMS packaging. Dev/build work on Node 18+ across releases. Import the block catalog via `@lessonkit/react/block-catalog.v1.json`.

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
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. Verify the **Release** workflow on GitHub Actions and packages on [npm](https://www.npmjs.com/org/lessonkit).

The release job sets each **LessonKit** package version from the tag, aligns `@lessonkit/*` dependency ranges, builds, and runs `npm publish` for all seven packages. Requires the `NPM_TOKEN` repository secret (publish access to the `@lessonkit` org).

## Publish Studio packages to npm (`studio-v*` tags)

Studio versions are **independent** of LessonKit tags. When you push `studio-v0.1.0`:

1. [Studio Release](.github/workflows/studio-release.yml) runs CI checks, then `node scripts/release/prepare-publish.mjs studio 0.1.0`.
2. That sets `@lessonkit/studio-*` to the tag version and pins other `@lessonkit/*` deps in Studio packages to the version in `packages/core/package.json` on that commit (e.g. `1.0.2`).
3. Publishes **`@lessonkit/studio-schema`** first, then **`@lessonkit/studio-renderer`** (same npm org as `@lessonkit/react`).

```bash
# After CI is green on main and Studio package.json versions match the release:
git tag studio-v0.1.0
git push origin studio-v0.1.0
```

Re-run a failed publish: **Actions** → **Studio Release** → **Re-run failed jobs** (no new tag needed if the tag already points at a commit with these package names).

## After release

- Confirm npm shows `1.0.1` for each `@lessonkit/*` package.
- Optional: create a GitHub Release from the tag with notes copied from [CHANGELOG.md](CHANGELOG.md).

## Changesets

`changeset version` / `changeset publish` are available for future workflows but are **not** used for the current tag-based publish path. Do not run `changeset version` on a branch that is already at the target version unless you intend to bump again.
