## Summary

<!-- What changed and why? Link related issues: Fixes #123 -->

## Type of change

- [ ] Bug fix
- [ ] Feature / enhancement
- [ ] Documentation
- [ ] Tests / CI
- [ ] Internal refactor (no user-facing change)

## Test plan

<!-- How did you verify this? -->

- [ ] `npm test` (or scoped workspace tests — see CONTRIBUTING.md)
- [ ] `npm run lint` and `npm run typecheck` (when code changed)
- [ ] Docs build when `docs/` changed — canonical command from [CONTRIBUTING.md](CONTRIBUTING.md#faster-loops): `npm run build:packages && npm run docs:api && bash docs/scripts/verify-doc-includes.sh && node docs/scripts/generate-block-props-doc.mjs && cd docs && pip install -r requirements.txt && sphinx-build -W -b html . _build/html`
- [ ] Integration / e2e (when CLI, packaging, or examples changed)

## Checklist

- [ ] User-facing docs updated if behavior or public API changed (README, `docs/`, package READMEs)
- [ ] New `@lessonkit/react` block? Complete [Adding a framework block](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/adding-a-framework-block.html) checklist
- [ ] CHANGELOG **Unreleased** entry added for user-facing npm/CLI/packaging changes
- [ ] `package-lock.json` committed if root workspaces or dependencies changed
- [ ] No secrets, credentials, or `.env` files included
