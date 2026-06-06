# LessonKit starter template

Vite + React scaffold for new LessonKit courses. Created by `lessonkit init`.

## Commands

```bash
npm install
npm run dev          # lessonkit dev
npm run build        # lessonkit build
npm run package:scorm12
```

## Files

- `src/App.tsx` — course UI (IDs match `lessonkit.json`)
- `src/courseConfig.ts` — production transports, observability hooks, and LMS bridge config
- `.env.example` — `VITE_XAPI_PROXY_URL` and `VITE_ANALYTICS_URL` for production builds
- `lessonkit.json` — manifest for CLI and LXPack packaging

## Production

Copy `.env.example` to `.env.production` and set your LRS/analytics proxy URLs before `npm run build`. See the [production checklist](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/production-checklist.html).

## Docs

[CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) · [React quickstart](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/quickstart.html) · [Packaging guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html)
