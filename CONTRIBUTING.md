# Contributing to LessonKit

Thank you for helping improve LessonKit. This file is the GitHub entry point for contributors; the full monorepo guide lives on Read the Docs.

**Full guide:** [Contributing to the monorepo](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/contributing-to-the-monorepo.html)

## Code of conduct

We follow the [Contributor Covenant](CODE_OF_CONDUCT.md). Be respectful and constructive in issues and pull requests.

## Before you open a PR

1. Fork the repository and create a branch from **`main`**.
2. Keep each PR focused on one logical change (feature, fix, or docs update).
3. Search [existing issues](https://github.com/eddiethedean/lessonkit/issues) to avoid duplicate work.

**Branch policy:** Open pull requests against **`main`**. Release branches (for example `release/1.5.x`) are maintainer-only for version stabilization—do not target them unless a maintainer asks you to.

## Good first contributions

Look for issues labeled **`good first issue`** or **`help wanted`**. Starter ideas (no issue required—comment on an existing thread first): [Good first contributions](https://lessonkit.readthedocs.io/en/latest/project/good-first-contributions.html).

Maintainers: create those labels in GitHub (**Settings → Labels**) if they are not present yet.

## Development setup

Canonical first-time setup (from repo root):

```bash
git clone https://github.com/eddiethedean/lessonkit.git
cd lessonkit
npm ci
npm run build:packages
npm test
```

`npm test` runs `pretest` → `build:packages` automatically, but run `build:packages` explicitly before `npm -w lessonkit-example-react-vite run dev` or other example workspaces. Skip the full monorepo `npm run build` unless you are validating examples or release surfaces.

### Faster loops

**Docs-only changes:** run the canonical docs build (matches CI):

```bash
npm run build:packages
npm run docs:api
bash docs/scripts/verify-doc-includes.sh
node docs/scripts/generate-block-props-doc.mjs
cd docs && pip install -r requirements.txt && sphinx-build -W -b html . _build/html
npm run docs:verify
```

Requires **Python 3.12+** and Node. Skip `build-docs-demos.sh` unless you changed example embeds. `docs:verify` checks reference includes and that MyST substitution tokens (version badge, SCORM path, Node versions) expanded in the built HTML.

| Change type | Usually enough |
| --- | --- |
| `docs/` only (Markdown, Sphinx) | Canonical docs build above |
| Single package you edited | `npm run build -w @lessonkit/react` then `npm test -w @lessonkit/react` |
| Examples after package API change | `npm run build:packages` then the example workspace `dev` / `test` |

Skip the full monorepo `npm run build` when your PR touches only documentation or one workspace.

## Node.js versions

**Node.js 20.19+ recommended** for `npx @lessonkit/cli init` (Vite 8). Node 18 may work for packaging-only workflows but is not tested in CI.

| Task | Node.js |
| --- | --- |
| CLI scaffold (Vite 8), monorepo CI | **20.19+** recommended |
| Day-to-day dev, build, packaging smoke | **18+** minimum |
| Playwright e2e (`npm run test:e2e`) | **20+** |

After `npm ci`, install Playwright once for e2e:

```bash
npm exec -w @lessonkit/e2e -- playwright install --with-deps chromium
```

See the [E2E section](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/contributing-to-the-monorepo.html#e2e-and-conformance) in the full guide.

## Lockfile

If you add or change a workspace in the root `package.json`, run `npm install` and commit the updated `package-lock.json`. CI expects a consistent lockfile.

## What to run for your change

| Area changed | Suggested checks |
| --- | --- |
| `packages/react`, `packages/core`, examples | `npm test`, often `npm run test:e2e` |
| `packages/cli`, `packages/lxpack`, templates | `npm run test:integration` |
| New `@lessonkit/react` block | [Adding a framework block](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/adding-a-framework-block.html) checklist + `npm test -w @lessonkit/react` |
| `docs/` (Sphinx) | Canonical docs build (see [Faster loops](#faster-loops) above) |

## Full CI-equivalent checks

Before a wide refactor or release, run from the repo root:

| Check | Command |
| --- | --- |
| Template sync | `npm run copy-template -w @lessonkit/cli && git diff --exit-code packages/cli/template/vite-react` |
| Template parity | `diff -rq templates/vite-react/src packages/cli/template/vite-react/src` |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Coverage | `npm run coverage` |
| Test suite quality notes | [Test suite verification (1.7.4)](docs/project/test-suite-verification-1.7.4.md) — behavioral confidence audit; prefer contract asserts over coverage theater |
| Storybook | `STORYBOOK_DISABLE_TELEMETRY=1 CI=true npm run build-storybook` |
| Integration | `npm run test:integration` |
| E2E | `npm exec -w @lessonkit/e2e -- playwright install --with-deps chromium && npm run test:e2e` |
| Conformance | `npm run conformance:lxpack && npm run conformance:golden` |
| Audit | `npm run audit:ci` |
| API docs | `npm run docs:api` |
| Sphinx docs | Canonical docs build (see [Faster loops](#faster-loops) above) |

## Pull request expectations

- Tests and lint/typecheck pass locally when feasible (`npm test`, `npm run lint`, `npm run typecheck`).
- Update user-facing docs if behavior or public API changes (README, `docs/`, or package READMEs).
- **CHANGELOG:** add an entry under **Unreleased** when the change is user-facing (npm API, CLI flags, packaging behavior, or docs that correct wrong guidance). Skip changelog lines for typos, internal refactors, or test-only changes. Maintainers may fold entries at release time; you do not need Changesets unless asked.
- Do not commit secrets (`.env`, API keys, credentials).

## CI failure map

When a GitHub Actions job fails, reproduce locally:

| CI job | Common failure | Local repro |
| --- | --- | --- |
| **checks** | Lint, typecheck, unit tests | `npm run lint && npm run typecheck && npm test` |
| **docs** | Broken link, missing include, Sphinx `-W` | Canonical docs build (see [Faster loops](#faster-loops) above) |
| **packaging** | CLI template drift, SCORM smoke, library-skills validation | `npm run copy-template -w @lessonkit/cli && git diff --exit-code packages/cli/template/vite-react` · `npm run test:integration` · `npm run conformance:lxpack && npm run conformance:golden` |
| **integration** | init → build → package | `npm run test:integration` |
| **security-audit** | npm audit high/critical | `npm run audit:ci` |
| **codeql** | Static analysis | Fix reported path in Security tab |
| **e2e** | SCORM parity, Playwright | `npm exec -w @lessonkit/e2e -- playwright install --with-deps chromium && npm run test:e2e` |

See [contributing to the monorepo — full CI-equivalent checks](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/contributing-to-the-monorepo.html#full-ci-equivalent-checks).

## Releases

npm publish is **tag-driven** ([RELEASING.md](RELEASING.md)). Casual contributors do not need to cut releases or manage Changesets.

## Security

**Do not open a public issue for security vulnerabilities.**

Use [GitHub private vulnerability reporting](https://github.com/eddiethedean/lessonkit/security/advisories/new) or follow [SECURITY.md](SECURITY.md).

## Getting help

- **Bugs and features:** use the [issue templates](https://github.com/eddiethedean/lessonkit/issues/new/choose).
- **Documentation:** [lessonkit.readthedocs.io](https://lessonkit.readthedocs.io/en/latest/)
- **Roadmap (maintainers):** [ROADMAP.md](ROADMAP.md)
