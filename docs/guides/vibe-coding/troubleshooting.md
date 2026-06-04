# Troubleshooting (vibe coding)

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

## Packaging says layout not supported

Use `"layout": "single-spa"` in `lessonkit.json`. `per-lesson-spa` is not supported by `lessonkit package` (1.0.0).

## “Could not find lessonkit.json”

Run commands from the project root (where `lessonkit.json` lives), not a parent folder.

## AI changed IDs and tracking looks wrong

1. Open `lessonkit.json` and note `courseId`, each `lessons[].id`, each `assessments[].checkId`
2. Open `src/App.tsx` and align `courseId`, `lessonId`, `checkId` props
3. Re-run `lessonkit build`

## Node version errors during package

Install Node 18+, then:

```bash
node -v   # should be v18.x, v20.x, or v22.x
lessonkit package --target scorm12
```

## Still stuck?

- [CLI reference](../../reference/cli.md)
- GitHub issues: [eddiethedean/lessonkit](https://github.com/eddiethedean/lessonkit/issues)
- Switch to [React developer guides](../react-developers/index.md) for one technical review
