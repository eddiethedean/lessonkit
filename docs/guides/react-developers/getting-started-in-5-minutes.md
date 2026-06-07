# Getting started in 5 minutes

:::{admonition} No clone required
:class: tip

This guide uses **npm only**. You do not need the LessonKit GitHub monorepo unless you are [contributing](contributing-to-the-monorepo.md) or running [examples](../../examples/index.md).
:::

:::{admonition} LMS export is a separate guide
:class: note

This page covers **local preview** in about five minutes. SCORM packaging, bridge configuration, and env setup are in [First LMS export](first-lms-export.md). For production go-live, also complete the [production checklist](production-checklist.md).
:::

**Prerequisites:** Node.js **18+** minimum; **20.19+** recommended (CLI scaffold uses Vite 8).

## 1. Create a project

```bash
npx @lessonkit/cli init my-course
cd my-course
```

`init` runs `npm install` by default and writes `lessonkit.json`, `src/courseConfig.ts`, and a starter `src/App.tsx`.

## 2. Preview locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The starter template uses console telemetry sinks in development.

Alternative: `npx lessonkit dev` (same as the `dev` script).

## 3. Change one quiz

:::{admonition} Edit React and lessonkit.json together
:class: warning

Packaging validates that `courseId`, `lessonId`, and every `checkId` in React appear in **`lessonkit.json`**. Change both files in the same edit—mismatches are the most common `lessonkit package` failure. See [Keep React IDs in sync](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).
:::

Edit `src/App.tsx` and `lessonkit.json` together:

- In React: update a `Quiz` `question`, `choices`, or `answer`.
- In `lessonkit.json`: update the matching `assessments[]` entry (`checkId`, `question`, `choices`, `answer`).

`lessonkit init` already aligned `courseId` and the first assessment—keep that pattern when you add lessons or checks. See [Keep React IDs in sync with lessonkit.json](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).

## 4. Production build (optional smoke test)

```bash
npm run build
```

Output goes to `dist/` (Vite SPA). A production build may require env vars or disabled tracking—see [First LMS export](first-lms-export.md) before uploading to an LMS.

## Next steps

- [First LMS export](first-lms-export.md) — bridge, env, SCORM zip
- [Quickstart](quickstart.md) — add LessonKit to an existing Vite app
- [Block cookbook](block-cookbook.md) — per-block React + manifest examples
- [FAQ](../faq.md) — common questions
- [Live examples](../../examples/index.md) — full demo courses
