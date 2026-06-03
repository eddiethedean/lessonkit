# lessonkit-studio-web

Private Vite app for LessonKit Studio **0.3.1** (visual editor + export). Not published to npm.

## Run

From the monorepo root:

```bash
npm install
npm run build:packages
npm run dev -w lessonkit-studio-web
```

## Persistence

- Autosave: `localStorage` key `lessonkit-studio:project`
- Toolbar: export / import JSON, reset to bundled sample

See [Studio editor guide](../../docs/guides/studio/editor.md).
