# Getting started in 5 minutes

:::{admonition} No clone required
:class: tip

This guide uses **npm only**. You do not need the LessonKit GitHub monorepo unless you are [contributing](contributing-to-the-monorepo.md) or running [examples](../../examples/index.md).
:::

:::{admonition} LMS export is a separate guide
:class: note

This page covers **local preview** in about five minutes. SCORM packaging, bridge configuration, and env setup are in [First LMS export](first-lms-export.md). For production go-live, also complete the [production checklist](production-checklist.md).
:::

**Prerequisites:** See [Prerequisites](../prerequisites.md). Node.js **20.19+** recommended for `npx @lessonkit/cli init` (Vite 8).

## 1. Create a project

```bash
npx @lessonkit/cli init my-course
cd my-course
```

`init` runs `npm install` by default and writes `lessonkit.json`, `src/courseConfig.ts`, and a starter `src/App.tsx`.

### Advanced init flags

| Flag | When to use |
| --- | --- |
| `lessonkit init --here` | Scaffold in the current directory (must be empty or use `--force`) |
| `lessonkit init my-course --skip-install` | Create files only; run `npm install` yourself after fixing Node/proxy issues |
| `lessonkit init my-course --force` | Overwrite an existing scaffold in the target directory |

See [CLI reference](../../reference/cli.md) for all options.

## 2. Preview locally

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The starter template uses console telemetry sinks in development.

**Success check:** You should see a scenario paragraph and a quiz with two choices. Open the browser console — when you answer the quiz, you should see telemetry events such as `quiz_answered`.

Alternative: `npx lessonkit dev` (same as the `dev` script).

## 3. Change one quiz

:::{admonition} Edit React and lessonkit.json together
:class: warning

Packaging validates that `courseId`, `lessonId`, and every `checkId` in React appear in **`lessonkit.json`**. Change both files in the same edit—mismatches are the most common `lessonkit package` failure. See [Keep React IDs in sync](quickstart.md#keep-react-ids-in-sync-with-lessonkitjson).
:::

After saving both files and refreshing the browser, you should see your new question text and be able to submit the quiz.

**Before — `src/App.tsx` (excerpt):**

```tsx
<Quiz
  checkId="ready-to-build"
  question="Ready to build?"
  choices={["Not yet", "Yes"]}
  answer="Yes"
/>
```

**After:**

```tsx
<Quiz
  checkId="ready-to-build"
  question="What is the first step when you receive a suspicious email?"
  choices={["Open the attachment", "Verify the sender"]}
  answer="Verify the sender"
/>
```

**Matching `lessonkit.json` entry** under `course.assessments[]`:

```json
{
  "checkId": "ready-to-build",
  "question": "What is the first step when you receive a suspicious email?",
  "choices": ["Open the attachment", "Verify the sender"],
  "answer": "Verify the sender",
  "passingScore": 1
}
```

Keep `checkId` unchanged when you edit question text only. When you add lessons or checks, update both React and the manifest in the same commit.

## 4. Production build (optional smoke test)

```bash
npm run build
```

Output goes to `dist/` (Vite SPA).

:::{admonition} Do not preview the production bundle yet
:class: warning

`npm run build` succeeds without env vars, but **`vite preview` or opening `dist/` directly will throw** in production mode unless you add `.env` proxy URLs or disable tracking/xAPI. Keep iterating with `npm run dev`. See [First LMS export](first-lms-export.md) before uploading to an LMS.
:::

## Next steps

- [First LMS export](first-lms-export.md) — bridge, env, SCORM zip
- [Ship to LMS checklist](ship-to-lms.md) — one-page go-live checklist
- [Quickstart](quickstart.md) — add LessonKit to an existing Vite app
- [Block cookbook](block-cookbook.md) — per-block React + manifest examples
- [FAQ](../faq.md) — common questions
- [Live examples](../../examples/index.md) — full demo courses
