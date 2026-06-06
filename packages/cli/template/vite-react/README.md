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

## Before LMS packaging

1. **LMS bridge** — In `src/courseConfig.ts`, set `lxpack: { bridge: "auto" }` before SCORM/xAPI/cmi5 export (template defaults to `"off"` for local preview).
2. **Production runtime** — Copy `.env.example` to `.env`, set proxy URLs, and rebuild—or temporarily disable `tracking` / `xapi` for a first test export only.

## SCORM output path

After `npm run package:scorm12`, the CLI prints the resolved ZIP path. Default:

**`.lxpack/course/.lxpack/out/course-scorm12.zip`**

(`paths.outputBaseDir` is resolved inside `paths.lxpackOutDir`, not at the project root.)

## Production

Copy `.env.example` to `.env` and set your LRS/analytics proxy URLs before `npm run build`. See the [production checklist](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/production-checklist.html).

## Docs

[5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) · [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) · [Packaging guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html)
