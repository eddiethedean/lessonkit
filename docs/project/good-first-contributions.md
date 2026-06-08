# Good first contributions

Concrete ways to help without deep framework knowledge. Comment on [an existing issue](https://github.com/eddiethedean/lessonkit/issues) or open one describing what you plan to do.

Maintainers: label suitable issues **`good first issue`** or **`help wanted`** in GitHub.

## Documentation

- Fix broken links or stale version labels (framework **1.6.x**, npm **@lessonkit/react**).
- Add a short “how I debugged X” note to [troubleshooting](../guides/vibe-coding/troubleshooting.md).
- Improve [glossary](../reference/glossary.md) definitions from your onboarding experience.

## Examples

- Add or extend a short README in an `examples/` directory that lacks one — explain what to look at in `App.tsx`, which blocks the course demonstrates, and how to run it (`npm -w <workspace> run dev` after `npm run build:packages`). Good targets: `react-vite`, `data-privacy`, `customer-service`, `interactive-book`, `assessments-p0`.
- Verify [examples/README](https://github.com/eddiethedean/lessonkit/blob/main/examples/README.md) matches workspace names in root `package.json`.

## Tests and tooling

- Extend a Vitest test in `packages/react` for a block you use in production.
- Run `npm run test:integration` after CLI changes and document any new flags in [CLI reference](../reference/cli.md).

## Before you start

1. Read [CONTRIBUTING.md](https://github.com/eddiethedean/lessonkit/blob/main/CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](https://github.com/eddiethedean/lessonkit/blob/main/CODE_OF_CONDUCT.md).
2. Use the smallest check matrix from the contributing guide (docs-only PRs do not need full e2e).
3. Link your PR to the issue you picked up.
