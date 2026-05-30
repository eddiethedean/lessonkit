# Templates

Two Vite + React trees serve different purposes:

| Path | Purpose |
| --- | --- |
| [`vite-react/`](https://github.com/eddiethedean/lessonkit/tree/main/templates/vite-react) | Monorepo dev — `file:../../packages/*` deps |
| [`packages/cli/template/vite-react/`](https://github.com/eddiethedean/lessonkit/tree/main/packages/cli/template/vite-react) | Published scaffold — npm `^1.0.0`, shipped with `lessonkit init` |

`src/` and `lessonkit.json` must match between both trees.

After editing `templates/vite-react/`:

```bash
npm run copy-template -w @lessonkit/cli
git add packages/cli/template/vite-react
```

CI verifies parity on every PR.
