# Templates

LessonKit maintains two Vite + React template trees:

| Path | Purpose |
| --- | --- |
| [`templates/vite-react/`](vite-react/) | Monorepo development — depends on workspace packages via `file:../../packages/*` |
| [`packages/cli/template/vite-react/`](../packages/cli/template/vite-react/) | Published scaffold — depends on npm `^1.0.0` and ships with `@lessonkit/cli init` |

The CLI copies from `packages/cli/template/vite-react/` when you run `lessonkit init`. The monorepo template is for contributors running examples against local packages.

**Keep in sync:** `src/` and `lessonkit.json` must match between both trees.

After editing [`templates/vite-react/`](vite-react/), run `npm run copy-template -w @lessonkit/cli` and commit the updated [`packages/cli/template/vite-react/`](../packages/cli/template/vite-react/) tree. CI runs `copy-template` and diffs both trees on every PR.
