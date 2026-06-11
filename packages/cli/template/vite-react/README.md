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

1. **LMS bridge** — In `src/courseConfig.ts`, enable the bridge for SCORM/xAPI/cmi5 export (template defaults to `"off"` for local preview):

   ```ts
   lxpack: {
     bridge: "auto",
     allowedParentOrigins: ["https://your-lms.example"], // required in production builds
   },
   ```

   Development builds allow `bridge: "auto"` without an allowlist; **production builds do not**. Discover your LMS origin from the SCORM preview URL or browser devtools (`document.referrer`).

2. **Production runtime** — Copy `.env.example` to `.env`, set `VITE_ANALYTICS_URL` and `VITE_XAPI_PROXY_URL`, and wire the observability hooks in `courseConfig.ts` (see comments there). Rebuild with `npm run build` before packaging. Alternatively, disable `tracking` and `xapi` for a first test export only.

3. **Activity IRI** — Replace the `example.com` placeholder in `lessonkit.json` → `course.tracking.xapi.activityIri` before xAPI/cmi5 export (must be HTTPS).

## SCORM output path

After `npm run package:scorm12`, the CLI prints the resolved ZIP path. Default:

**`.lxpack/course/.lxpack/out/course-scorm12.zip`**

(`paths.outputBaseDir` is resolved inside `paths.lxpackOutDir`, not at the project root.)

## Production

Copy `.env.example` to `.env` and set your LRS/analytics proxy URLs before `npm run build`. See [LMS Go-Live](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/lms-go-live.html) and the [backend proxy cookbook](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/backend-proxy-cookbook.html).

## Docs

[5-minute guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/getting-started-in-5-minutes.html) · [LMS Go-Live](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/lms-go-live.html) · [CLI reference](https://lessonkit.readthedocs.io/en/latest/reference/cli.html) · [Packaging guide](https://lessonkit.readthedocs.io/en/latest/guides/react-developers/packaging-and-cli.html)
