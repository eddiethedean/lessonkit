# Troubleshooting (vibe coding)

See the [troubleshooting hub](../troubleshooting.md) for a combined decision tree across React and vibe-coding paths.

## Quick decision tree

| Symptom | Try this first | AI prompt |
| --- | --- | --- |
| Blank dev page | Browser console errors | “Fix runtime errors in App.tsx without removing Course/Lesson structure” |
| Quiz won't complete | ID + exact answer string | “Align checkId in App.tsx with lessonkit.json assessments[]” |
| LMS no completion | Bridge + allowlist | “Set lxpack bridge auto and allowedParentOrigins for staging LMS” |
| Package failed | IDs + layout | “Fix lessonkit.json ID parity; use single-spa layout” |
| Node errors | Version check | “Use Node 20.19+; rerun lessonkit package” |

Full runbooks: [React troubleshooting](../react-developers/troubleshooting.md) (decision tree + sections).

## `lessonkit: command not found`

Use:

```bash
npx @lessonkit/cli dev
```

Or install globally: `npm install -g @lessonkit/cli`.

## `npm run dev` opens but the page is blank

Ask the AI:

```text
The Vite dev server runs but the page is blank. Check src/main.tsx and src/App.tsx
for runtime errors. Fix without removing Course/Lesson structure.
```

Open the browser developer console (F12) and paste errors into the chat.

## Quiz does not mark complete

- Confirm `checkId` on `<Quiz />` matches `lessonkit.json` → `course.assessments[].checkId`
- Confirm the learner selected the **exact** answer string from `choices`

## LMS does not record completion after SCORM upload

Set `lxpack: { bridge: "auto", allowedParentOrigins: ["https://your-lms.example"] }` in `src/courseConfig.ts` before `npm run build` and packaging. Production requires the allowlist. Details: [React troubleshooting — SCORM completion](../react-developers/troubleshooting.md#scorm-runs-but-lms-shows-no-completion-or-score).

## Packaging says layout not supported

Use `"layout": "single-spa"` in `lessonkit.json`. `per-lesson-spa` is not supported by `lessonkit package` (1.x).

## “Could not find lessonkit.json”

Run commands from the project root (where `lessonkit.json` lives), not a parent folder.

## AI changed IDs and tracking looks wrong

1. Open `lessonkit.json` and note `courseId`, each `lessons[].id`, each `assessments[].checkId`
2. Open `src/App.tsx` and align `courseId`, `lessonId`, `checkId` props
3. Re-run `lessonkit build`

## Node version errors during package

Install Node **20.19+** recommended (**18+** minimum), then:

```bash
node -v   # should be v20.19+ for init; v18+ may work for package on existing projects
lessonkit package --target scorm12
```

See [Prerequisites](../prerequisites.md).

## Still stuck?

- [CLI reference](../../reference/cli.md)
- GitHub issues: [eddiethedean/lessonkit](https://github.com/eddiethedean/lessonkit/issues)
- Switch to [React developer guides](../react-developers/index.md) for one technical review
