# Getting started in 5 minutes

:::{admonition} No clone required
:class: tip

This guide uses **npm only**. You do not need the LessonKit GitHub monorepo unless you are [contributing](contributing-to-the-monorepo.md) or running [examples](../../examples/index.md).
:::

**Prerequisites:** Node.js **18+**.

## 1. Create a project

```bash
npx @lessonkit/cli init my-course
cd my-course
```

`init` runs `npm install` by default and writes `lessonkit.json` plus a starter `src/App.tsx`.

## 2. Preview locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Open the browser console to see sample telemetry and xAPI logs from the starter template.

Alternative: `npx lessonkit dev` (same as the `dev` script).

## 3. Change one quiz

Edit `src/App.tsx` and `lessonkit.json` together:

- In React: update a `Quiz` `question`, `choices`, or `answer`.
- In `lessonkit.json`: update the matching `assessments[]` entry (`checkId`, `question`, `choices`, `answer`).

`lessonkit init` already aligned `courseId` and the first assessment—keep that pattern when you add lessons or checks. See [Keep React IDs in sync with lessonkit.json](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).

## 4. Production build

```bash
npm run build
```

Output goes to `dist/` (Vite SPA).

## 5. Package for your LMS {#package-for-your-lms}

```bash
npm run package:scorm12
```

Or:

```bash
npx lessonkit package --target scorm12
```

### Where the SCORM zip lands

By default, `lessonkit.json` sets:

```json
"paths": {
  "outputBaseDir": ".lxpack/out"
}
```

For `scorm12`, the CLI writes:

```text
.lxpack/out/course-scorm12.zip
```

Upload that ZIP to your LMS. Other targets use the same folder, for example `course-xapi.zip`, `course-cmi5.zip`. Standalone export writes a directory: `.lxpack/out/standalone/`.

Override the path with `--out path/to/custom.zip` (must stay inside the project directory).

## Next steps

- [Quickstart](quickstart.md) — add LessonKit to an existing Vite app
- [Packaging and CLI](packaging-and-cli.md) — all `--target` values
- [Glossary](../../reference/glossary.md) — LXPack, IDs, catalogs
- [Live examples](../../examples/index.md) — full demo courses
