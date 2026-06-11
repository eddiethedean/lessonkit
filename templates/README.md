# Templates

Two Vite + React trees serve different purposes:

| Path | Purpose |
| --- | --- |
| [`vite-react/`](vite-react/) | **Monorepo dev mirror** — `file:../../packages/*` deps; scripts call `vite` directly for workspace development |
| [`packages/cli/template/vite-react/`](https://github.com/eddiethedean/lessonkit/tree/main/packages/cli/template/vite-react) | **Published scaffold** — npm `^1.7.0`, `lessonkit dev`/`build` scripts; what `npx @lessonkit/cli init` produces |

End users always get the **published scaffold** via `init`. The monorepo mirror is for contributors only—do not copy its `package.json` scripts into course repos.

`src/` and `lessonkit.json` must match between both trees.

After editing `templates/vite-react/`:

```bash
npm run copy-template -w @lessonkit/cli
git add packages/cli/template/vite-react
```

CI verifies parity on every PR.
